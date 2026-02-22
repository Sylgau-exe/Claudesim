// api/simulation/start.js - Start a new simulation session
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';
import { UserDB, ScenarioDB, SessionDB } from '../../lib/db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const { scenarioId } = req.body;
  if (!scenarioId) return res.status(400).json({ error: 'Scenario ID required' });

  try {
    const user = await UserDB.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const scenario = await ScenarioDB.findById(scenarioId);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    // Check plan limits
    if (user.plan === 'free' && !scenario.is_free) {
      return res.status(403).json({ error: 'This scenario requires a Pro plan. Upgrade to access all scenarios.' });
    }

    // Check simulation limit (monthly)
    if (user.simulations_used >= user.simulations_limit && user.plan !== 'free') {
      return res.status(403).json({ error: 'Monthly simulation limit reached. Upgrade your plan for more.' });
    }

    // Check for existing active session — abandon it
    const active = await SessionDB.findActive(decoded.userId);
    if (active) {
      await SessionDB.abandon(active.id);
    }

    // Create new session
    const session = await SessionDB.create(decoded.userId, scenarioId);

    // Increment usage counter
    await UserDB.incrementSimulations(decoded.userId);

    return res.status(201).json({
      session: {
        id: session.id,
        scenarioId: session.scenario_id,
        status: session.status,
        startedAt: session.started_at
      },
      scenario: {
        code: scenario.code,
        title_en: scenario.title_en,
        title_fr: scenario.title_fr,
        description_en: scenario.description_en,
        description_fr: scenario.description_fr,
        domain: scenario.domain,
        level: scenario.level,
        duration_min: scenario.duration_min,
        competencies: scenario.competencies,
        evaluation_criteria: typeof scenario.evaluation_criteria === 'string' ? JSON.parse(scenario.evaluation_criteria) : (scenario.evaluation_criteria || []),
        documents_json: scenario.documents_json
      }
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    return res.status(500).json({ error: 'Failed to start simulation' });
  }
}
