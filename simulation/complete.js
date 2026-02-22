// api/simulation/complete.js - Complete a simulation and generate debrief
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';
import { SessionDB, InteractionDB } from '../../lib/db.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

const DEBRIEF_SYSTEM = `You are ARIA, the AI literacy coach. Generate a comprehensive debrief report for a simulation session.

Analyze ALL the learner's prompts and provide:
1. Overall score (0-100) 
2. Individual competency scores (C1-C6, each 1-5)
3. Top 3 strengths observed
4. Top 3 areas for improvement with specific recommendations
5. Key techniques used (and missed opportunities)
6. A personalized next-step recommendation

Respond in valid JSON:
{
  "score_global": 72,
  "scores": {"c1": 4, "c2": 3, "c3": 4, "c4": 3, "c5": 3, "c6": 2},
  "strengths": ["Clear instructions", "Good iteration", "Specified output format"],
  "improvements": ["Try using XML tags for structure", "Verify Claude's data claims", "Use few-shot examples"],
  "techniques_used": ["specific-format", "iteration"],
  "techniques_missed": ["few-shot", "xml-tags", "chain-of-thought"],
  "recommendation": "Focus on advanced techniques — try XML tags and few-shot examples in your next simulation.",
  "summary_en": "Good first simulation! You showed strong clarity but could leverage more advanced prompting techniques.",
  "summary_fr": "Belle première simulation! Vous avez démontré une bonne clarté mais pourriez utiliser des techniques de prompting plus avancées."
}`;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

  try {
    const session = await SessionDB.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.user_id !== decoded.userId) return res.status(403).json({ error: 'Not your session' });
    if (session.status !== 'active') return res.status(400).json({ error: 'Session is not active' });

    // Get all interactions
    const interactions = await InteractionDB.findBySession(sessionId);
    const userPrompts = interactions.filter(i => i.role === 'user');
    const assistantResponses = interactions.filter(i => i.role === 'assistant');
    const coachFeedback = interactions.filter(i => i.role === 'coach');

    // Get scenario info
    const scenarioResult = await sql`SELECT * FROM scenarios WHERE id = ${session.scenario_id}`;
    const scenario = scenarioResult.rows[0];

    // Build debrief context
    const debriefContext = `Scenario: "${scenario.title_en}" (${scenario.level} level, ${scenario.domain})
Evaluation criteria: ${JSON.stringify(scenario.evaluation_criteria)}
Duration: ${Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)} minutes
Total prompts: ${userPrompts.length}

Learner's prompts (in order):
${userPrompts.map((p, i) => `Prompt ${i + 1}: "${p.content}"`).join('\n')}

Claude's responses (in order):
${assistantResponses.map((r, i) => `Response ${i + 1}: "${r.content.substring(0, 500)}..."`).join('\n')}

Previous coaching feedback:
${coachFeedback.map(c => {
  try { return JSON.parse(c.content).tip; } catch { return c.content; }
}).join('\n')}

Generate the debrief report now.`;

    // Call Claude for debrief
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: DEBRIEF_SYSTEM,
        messages: [{ role: 'user', content: debriefContext }]
      })
    });

    const data = await response.json();
    const debriefText = data.content.map(b => b.text || '').join('');
    
    let debrief;
    try {
      debrief = JSON.parse(debriefText);
    } catch {
      debrief = {
        score_global: 50, scores: { c1: 3, c2: 2, c3: 3, c4: 2, c5: 3, c6: 2 },
        strengths: ['Completed the simulation'], improvements: ['Practice more scenarios'],
        techniques_used: [], techniques_missed: [],
        recommendation: 'Keep practicing!',
        summary_en: debriefText, summary_fr: debriefText
      };
    }

    // Complete the session
    await SessionDB.complete(sessionId, {
      c1: debrief.scores.c1, c2: debrief.scores.c2, c3: debrief.scores.c3,
      c4: debrief.scores.c4, c5: debrief.scores.c5, c6: debrief.scores.c6,
      global: debrief.score_global
    }, session.tokens_used + (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0));

    // Save debrief report
    await sql`
      INSERT INTO debrief_reports (session_id, analysis_json, recommendations, strengths, improvements)
      VALUES (${sessionId}, ${JSON.stringify(debrief)}, ${debrief.recommendation}, 
              ${JSON.stringify(debrief.strengths)}, ${JSON.stringify(debrief.improvements)})
    `;

    // Update user progress for each competency
    for (const [comp, score] of Object.entries(debrief.scores)) {
      const compKey = comp.toUpperCase();
      await sql`
        INSERT INTO user_progress (user_id, competency, current_level, total_scenarios, best_score)
        VALUES (${decoded.userId}, ${compKey}, ${score}, 1, ${score})
        ON CONFLICT (user_id, competency)
        DO UPDATE SET 
          current_level = GREATEST(user_progress.current_level, ${score}),
          total_scenarios = user_progress.total_scenarios + 1,
          best_score = GREATEST(user_progress.best_score, ${score}),
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return res.json({
      success: true,
      debrief: {
        scoreGlobal: debrief.score_global,
        scores: debrief.scores,
        strengths: debrief.strengths,
        improvements: debrief.improvements,
        techniquesUsed: debrief.techniques_used,
        techniquesMissed: debrief.techniques_missed,
        recommendation: debrief.recommendation,
        summaryEn: debrief.summary_en,
        summaryFr: debrief.summary_fr,
        promptCount: userPrompts.length,
        duration: Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
      }
    });
  } catch (error) {
    console.error('Complete simulation error:', error);
    return res.status(500).json({ error: 'Failed to complete simulation' });
  }
}
