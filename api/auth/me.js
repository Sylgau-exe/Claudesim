// api/auth/me.js (adapted for ClaudeSim)
import { sql } from '@vercel/postgres';
import { requireAuth, cors } from '../../lib/auth.js';
import { UserDB } from '../../lib/db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const user = await UserDB.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let sessionCount = { rows: [{ count: 0 }] };
    let completedCount = { rows: [{ count: 0 }] };
    try { sessionCount = await sql`SELECT COUNT(*) as count FROM simulation_sessions WHERE user_id = ${user.id}`; } catch(e) {}
    try { completedCount = await sql`SELECT COUNT(*) as count FROM simulation_sessions WHERE user_id = ${user.id} AND status = 'completed'`; } catch(e) {}

    return res.status(200).json({
      user: {
        id: user.id, email: user.email, name: user.name,
        organization: user.organization, jobTitle: user.job_title,
        experienceLevel: user.experience_level,
        plan: user.plan || 'free', lang: user.lang || 'en',
        isAdmin: user.is_admin, authProvider: user.auth_provider,
        simulationsUsed: user.simulations_used || 0,
        simulationsLimit: user.simulations_limit || 1,
        totalSessions: parseInt(sessionCount.rows[0].count),
        completedSessions: parseInt(completedCount.rows[0].count),
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
}
