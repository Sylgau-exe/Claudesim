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
      evaluation_criteria: typeof s.evaluation_criteria === 'string' ? JSON.parse(s.evaluation_criteria) : (s.evaluation_criteria || []),
      competencies: s.competencies || [],
      is_free: s.is_free,
      tier: s.tier || 1,
      tier_label_en: s.tier_label_en || 'Prompt Engineering',
      tier_label_fr: s.tier_label_fr || 'Ingénierie de prompts',
      locked: !s.is_free && (!decoded) // locked if not free and not logged in
    }));

    // Group by tier for frontend convenience
    const tiers = [
      { tier: 1, label_en: 'Prompt Engineering', label_fr: 'Ingénierie de prompts', icon: '🎯', scenarios: mapped.filter(s => s.tier === 1) },
      { tier: 2, label_en: 'Specification Engineering', label_fr: 'Ingénierie de spécifications', icon: '📋', scenarios: mapped.filter(s => s.tier === 2) },
      { tier: 3, label_en: 'Intent Engineering', label_fr: 'Ingénierie d\'intention', icon: '🧭', scenarios: mapped.filter(s => s.tier === 3) }
    ].filter(t => t.scenarios.length > 0);

    return res.json({ scenarios: mapped, tiers });
  } catch (error) {
    console.error('Scenarios error:', error);
    return res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
}
