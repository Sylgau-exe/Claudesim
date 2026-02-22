// api/scenarios/index.js - List available scenarios
import { ScenarioDB } from '../../lib/db.js';
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decoded = getUserFromRequest(req);
    const scenarios = await ScenarioDB.findAll(true);

    const mapped = scenarios.map(s => ({
      id: s.id, code: s.code,
      title_en: s.title_en, title_fr: s.title_fr,
      description_en: s.description_en, description_fr: s.description_fr,
      domain: s.domain, level: s.level,
      duration_min: s.duration_min,
      competencies: s.competencies || [],
      is_free: s.is_free,
      locked: !s.is_free && (!decoded) // locked if not free and not logged in
    }));

    return res.json({ scenarios: mapped });
  } catch (error) {
    console.error('Scenarios error:', error);
    return res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
}
