// api/simulation/session.js - Get session data (for resuming or viewing)
import { getUserFromRequest, cors } from '../../lib/auth.js';
import { SessionDB, InteractionDB } from '../../lib/db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const sessionId = req.query.id;
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

  try {
    const session = await SessionDB.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.user_id !== decoded.userId) return res.status(403).json({ error: 'Not your session' });

    const interactions = await InteractionDB.findBySession(sessionId);

    return res.json({
      session: {
        id: session.id,
        scenarioId: session.scenario_id,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        scores: { c1: session.score_c1, c2: session.score_c2, c3: session.score_c3, c4: session.score_c4, c5: session.score_c5, c6: session.score_c6, global: session.score_global },
        tokensUsed: session.tokens_used
      },
      interactions: interactions.map(i => ({
        id: i.id, role: i.role, content: i.content,
        tokens: i.tokens, analysis: i.prompt_analysis_json,
        createdAt: i.created_at
      }))
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
}
