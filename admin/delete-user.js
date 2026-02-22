// api/admin/delete-user.js (from saas-starter-kit)
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`;
  if (!adminCheck.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin access required' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  if (userId === decoded.userId) return res.status(400).json({ error: 'Cannot delete your own account' });

  try {
    await sql`DELETE FROM simulation_interactions WHERE session_id IN (SELECT id FROM simulation_sessions WHERE user_id = ${userId})`;
    await sql`DELETE FROM debrief_reports WHERE session_id IN (SELECT id FROM simulation_sessions WHERE user_id = ${userId})`;
    await sql`DELETE FROM simulation_sessions WHERE user_id = ${userId}`;
    await sql`DELETE FROM user_progress WHERE user_id = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
