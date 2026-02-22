// api/simulation/chat.js - Core simulation chat handler
// Routes learner prompts to Claude API + ARIA coach analysis
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';
import { SessionDB, InteractionDB } from '../../lib/db.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// ARIA system prompt — the coaching engine
const ARIA_SYSTEM_PROMPT = `You are ARIA (AI Readiness & Interaction Advisor), an expert coach in AI prompting and strategic use of Claude.

Your role is to OBSERVE the learner's prompts and provide coaching feedback on their TECHNIQUE — not on the content of Claude's response.

You evaluate 6 competencies:
- C1 (Clarity): Is the prompt specific, complete, unambiguous? Does it define output format?
- C2 (Advanced Techniques): Does the learner use few-shot, chain-of-thought, XML tags, role prompting?
- C3 (Strategic Iteration): Does the learner refine progressively rather than starting over?
- C4 (Critical Thinking): Does the learner evaluate Claude's response quality, check for errors?
- C5 (Efficiency): Is the result-to-prompt ratio good? Are they concise yet effective?
- C6 (Ethics & Limits): Is the learner aware of AI limitations, verifying facts?

RULES:
- NEVER give the learner the answer — guide their TECHNIQUE
- Be encouraging but direct — identify weaknesses without being harsh
- Use concrete examples and analogies
- Suggest specific techniques when relevant (e.g., "Try using XML tags to separate your data from instructions")
- Celebrate good practices when you see them
- Keep coaching tips brief (2-3 sentences max per intervention)
- Respond in the same language the learner writes in (EN or FR)

For each prompt you observe, provide:
1. A brief coaching tip (or encouragement if the prompt is well-crafted)
2. A prompt_score from 0-100 rating how effective this specific prompt is for achieving the scenario goal (0=completely vague/off-target, 50=adequate but missing key elements, 80+=well-crafted with clear structure and techniques, 100=expert-level prompt)
3. Updated scores for each competency (1-5) based on cumulative performance
4. The type of intervention: "nudge", "micro-lesson", "alert", "encouragement", or "redirect"

Respond ONLY in valid JSON format:
{
  "tip": "Your coaching feedback here",
  "type": "nudge|micro-lesson|alert|encouragement|redirect",
  "prompt_score": 45,
  "scores": {"c1": 3, "c2": 2, "c3": 3, "c4": 2, "c5": 3, "c6": 2},
  "technique_detected": ["chain-of-thought", "specific-format"] 
}`;

async function callClaudeAPI(messages, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Anthropic API error:', response.status, err);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content.map(b => b.text || '').join(''),
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0
  };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' });

  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'Session ID and message required' });

  try {
    // Verify session belongs to user and is active
    const session = await SessionDB.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.user_id !== decoded.userId) return res.status(403).json({ error: 'Not your session' });
    if (session.status !== 'active') return res.status(400).json({ error: 'Session is not active' });

    // Get scenario system prompt
    const scenarioResult = await sql`SELECT system_prompt, title_en, evaluation_criteria FROM scenarios WHERE id = ${session.scenario_id}`;
    const scenario = scenarioResult.rows[0];
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    // Get conversation history
    const history = await InteractionDB.findBySession(sessionId);
    const claudeMessages = history
      .filter(h => h.role === 'user' || h.role === 'assistant')
      .map(h => ({ role: h.role, content: h.content }));

    // Add current message
    claudeMessages.push({ role: 'user', content: message });

    // Save user prompt to DB
    await InteractionDB.create(sessionId, 'user', message, 0);

    // Call Claude API and ARIA in parallel
    const promptCount = claudeMessages.filter(m => m.role === 'user').length;

    const ariaContext = `Scenario: "${scenario.title_en}"
Evaluation criteria: ${JSON.stringify(scenario.evaluation_criteria)}
This is prompt #${promptCount} from the learner.
Previous prompts in this session: ${claudeMessages.filter(m => m.role === 'user').slice(0, -1).map(m => m.content).join(' | ') || 'None (first prompt)'}

Current prompt to analyze:
"${message}"`;

    const [claudeResponse, ariaResponse] = await Promise.all([
      callClaudeAPI(claudeMessages, scenario.system_prompt),
      callClaudeAPI(
        [{ role: 'user', content: ariaContext }],
        ARIA_SYSTEM_PROMPT
      ).catch(err => {
        console.error('ARIA error (non-fatal):', err);
        return { content: '{"tip":"Keep going! I\'m analyzing your approach.","type":"encouragement","scores":{"c1":3,"c2":2,"c3":3,"c4":2,"c5":3,"c6":2},"technique_detected":[]}', inputTokens: 0, outputTokens: 0 };
      })
    ]);

    // Parse ARIA response
    let ariaData;
    try {
      // Strip markdown code blocks if present
      let ariaContent = ariaResponse.content.trim();
      ariaContent = ariaContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      ariaData = JSON.parse(ariaContent);
    } catch {
      ariaData = { tip: ariaResponse.content, type: 'nudge', scores: { c1: 3, c2: 2, c3: 3, c4: 2, c5: 3, c6: 2 }, technique_detected: [] };
    }

    // Save Claude's response
    const totalTokens = (claudeResponse.inputTokens + claudeResponse.outputTokens) + (ariaResponse.inputTokens + ariaResponse.outputTokens);
    await InteractionDB.create(sessionId, 'assistant', claudeResponse.content, claudeResponse.inputTokens + claudeResponse.outputTokens);
    
    // Save ARIA's coaching
    await InteractionDB.create(sessionId, 'coach', JSON.stringify(ariaData), ariaResponse.inputTokens + ariaResponse.outputTokens, ariaData);

    // Update session tokens
    await sql`UPDATE simulation_sessions SET tokens_used = tokens_used + ${totalTokens} WHERE id = ${sessionId}`;

    return res.json({
      claude: {
        content: claudeResponse.content,
        tokens: claudeResponse.inputTokens + claudeResponse.outputTokens
      },
      aria: {
        tip: ariaData.tip,
        type: ariaData.type,
        prompt_score: ariaData.prompt_score || 50,
        scores: ariaData.scores,
        techniques: ariaData.technique_detected || []
      },
      promptNumber: promptCount,
      totalTokens
    });
  } catch (error) {
    console.error('Simulation chat error:', error);
    return res.status(500).json({ error: 'Failed to process chat. Please try again.' });
  }
}
