// api/user/dashboard.js - User dashboard data (sessions, progress, stats)
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';
import { SessionDB } from '../../lib/db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  try {
    // Get user sessions
    const sessions = await SessionDB.findByUser(decoded.userId);

    // Get competency progress
    let progress = { rows: [] };
    try {
      progress = await sql`
        SELECT competency, current_level, total_scenarios, best_score
        FROM user_progress WHERE user_id = ${decoded.userId}
        ORDER BY competency
      `;
    } catch(e) {}

    // Stats
    const completed = sessions.filter(s => s.status === 'completed');
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + (s.score_global || 0), 0) / completed.length)
      : 0;

    return res.json({
      sessions: sessions.map(s => ({
        id: s.id, code: s.code,
        title_en: s.title_en, title_fr: s.title_fr,
        domain: s.domain, level: s.level,
        status: s.status,
        scoreGlobal: s.score_global,
        startedAt: s.started_at,
        completedAt: s.completed_at
      })),
      progress: progress.rows.map(p => ({
        competency: p.competency,
        level: p.current_level,
        scenarios: p.total_scenarios,
        bestScore: p.best_score
      })),
      stats: {
        totalSessions: sessions.length,
        completedSessions: completed.length,
        avgScore,
        totalTokens: sessions.reduce((sum, s) => sum + (s.tokens_used || 0), 0)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}
