// api/admin/stats.js - Admin dashboard statistics for ClaudeSim
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`;
  if (!adminCheck.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin access required' });

  try {
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    
    let sessionCount = { rows: [{ count: 0 }] };
    let completedCount = { rows: [{ count: 0 }] };
    let avgScore = { rows: [{ avg: 0 }] };
    let newUsers7d = { rows: [{ count: 0 }] };
    let sessions7d = { rows: [{ count: 0 }] };
    let planDist = { rows: [] };
    let scenarioUsage = { rows: [] };
    let totalTokens = { rows: [{ sum: 0 }] };

    try { sessionCount = await sql`SELECT COUNT(*) as count FROM simulation_sessions`; } catch(e) {}
    try { completedCount = await sql`SELECT COUNT(*) as count FROM simulation_sessions WHERE status = 'completed'`; } catch(e) {}
    try { avgScore = await sql`SELECT ROUND(AVG(score_global)::numeric, 1) as avg FROM simulation_sessions WHERE status = 'completed' AND score_global > 0`; } catch(e) {}
    try { newUsers7d = await sql`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'`; } catch(e) {}
    try { sessions7d = await sql`SELECT COUNT(*) as count FROM simulation_sessions WHERE started_at > NOW() - INTERVAL '7 days'`; } catch(e) {}
    try { planDist = await sql`SELECT plan, COUNT(*) as count FROM users GROUP BY plan ORDER BY count DESC`; } catch(e) {}
    try { scenarioUsage = await sql`
      SELECT s.code, s.title_en, COUNT(ss.id) as sessions, ROUND(AVG(ss.score_global)::numeric, 1) as avg_score
      FROM scenarios s LEFT JOIN simulation_sessions ss ON s.id = ss.scenario_id
      GROUP BY s.id, s.code, s.title_en ORDER BY sessions DESC
    `; } catch(e) {}
    try { totalTokens = await sql`SELECT COALESCE(SUM(tokens_used), 0) as sum FROM simulation_sessions`; } catch(e) {}

    return res.status(200).json({
      overview: {
        totalUsers: parseInt(userCount.rows[0].count) || 0,
        totalSessions: parseInt(sessionCount.rows[0].count) || 0,
        completedSessions: parseInt(completedCount.rows[0].count) || 0,
        avgGlobalScore: parseFloat(avgScore.rows[0]?.avg) || 0,
        totalTokensUsed: parseInt(totalTokens.rows[0]?.sum) || 0
      },
      last7Days: {
        newUsers: parseInt(newUsers7d.rows[0].count) || 0,
        sessions: parseInt(sessions7d.rows[0].count) || 0
      },
      planDistribution: planDist.rows,
      scenarioUsage: scenarioUsage.rows
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
}
