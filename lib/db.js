// lib/db.js - Database helper for ClaudeSim (adapted from saas-starter-kit)
import { sql } from '@vercel/postgres';

export const UserDB = {
  async create(email, passwordHash, name) {
    const result = await sql`
      INSERT INTO users (email, password_hash, name, auth_provider)
      VALUES (${email}, ${passwordHash}, ${name}, 'email')
      RETURNING *
    `;
    return result.rows[0];
  },

  async createGoogleUser(email, name, googleId) {
    const result = await sql`
      INSERT INTO users (email, name, google_id, auth_provider, email_verified)
      VALUES (${email}, ${name}, ${googleId}, 'google', true)
      RETURNING *
    `;
    return result.rows[0];
  },

  async linkGoogleAccount(userId, googleId) {
    const result = await sql`
      UPDATE users SET google_id = ${googleId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING *
    `;
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async setResetToken(email, token, expiresAt) {
    const result = await sql`
      UPDATE users SET
        reset_token = ${token},
        reset_token_expires = ${expiresAt},
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING *
    `;
    return result.rows[0];
  },

  async findByResetToken(token) {
    const result = await sql`
      SELECT * FROM users 
      WHERE reset_token = ${token} 
        AND reset_token_expires > CURRENT_TIMESTAMP
    `;
    return result.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const result = await sql`
      UPDATE users SET
        password_hash = ${passwordHash},
        reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  },

  async updatePlan(id, plan, limit) {
    const result = await sql`
      UPDATE users SET
        plan = ${plan},
        simulations_limit = ${limit},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  },

  async incrementSimulations(id) {
    const result = await sql`
      UPDATE users SET
        simulations_used = simulations_used + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  }
};

export const ScenarioDB = {
  async findAll(activeOnly = true) {
    const result = activeOnly
      ? await sql`SELECT * FROM scenarios WHERE is_active = true ORDER BY sort_order`
      : await sql`SELECT * FROM scenarios ORDER BY sort_order`;
    return result.rows;
  },

  async findById(id) {
    const result = await sql`SELECT * FROM scenarios WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async findByCode(code) {
    const result = await sql`SELECT * FROM scenarios WHERE code = ${code}`;
    return result.rows[0] || null;
  }
};

export const SessionDB = {
  async create(userId, scenarioId) {
    const result = await sql`
      INSERT INTO simulation_sessions (user_id, scenario_id, status)
      VALUES (${userId}, ${scenarioId}, 'active')
      RETURNING *
    `;
    return result.rows[0];
  },

  async findById(id) {
    const result = await sql`SELECT * FROM simulation_sessions WHERE id = ${id}`;
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await sql`
      SELECT ss.*, s.code, s.title_en, s.title_fr, s.domain, s.level, s.duration_min
      FROM simulation_sessions ss
      JOIN scenarios s ON ss.scenario_id = s.id
      WHERE ss.user_id = ${userId}
      ORDER BY ss.started_at DESC
    `;
    return result.rows;
  },

  async findActive(userId) {
    const result = await sql`
      SELECT ss.*, s.code, s.title_en, s.title_fr, s.system_prompt, s.evaluation_criteria, s.documents_json
      FROM simulation_sessions ss
      JOIN scenarios s ON ss.scenario_id = s.id
      WHERE ss.user_id = ${userId} AND ss.status = 'active'
      ORDER BY ss.started_at DESC LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async complete(id, scores, tokensUsed) {
    const result = await sql`
      UPDATE simulation_sessions SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        score_c1 = ${scores.c1 || 0},
        score_c2 = ${scores.c2 || 0},
        score_c3 = ${scores.c3 || 0},
        score_c4 = ${scores.c4 || 0},
        score_c5 = ${scores.c5 || 0},
        score_c6 = ${scores.c6 || 0},
        score_global = ${scores.global || 0},
        tokens_used = ${tokensUsed || 0}
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  },

  async abandon(id) {
    const result = await sql`
      UPDATE simulation_sessions SET status = 'abandoned', completed_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result.rows[0];
  }
};

export const InteractionDB = {
  async create(sessionId, role, content, tokens = 0, analysis = null) {
    const result = await sql`
      INSERT INTO simulation_interactions (session_id, role, content, tokens, prompt_analysis_json)
      VALUES (${sessionId}, ${role}, ${content}, ${tokens}, ${analysis ? JSON.stringify(analysis) : null})
      RETURNING *
    `;
    return result.rows[0];
  },

  async findBySession(sessionId) {
    const result = await sql`
      SELECT * FROM simulation_interactions 
      WHERE session_id = ${sessionId} 
      ORDER BY created_at ASC
    `;
    return result.rows;
  }
};
