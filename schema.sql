-- ClaudeSim Database Schema
-- AI Literacy Simulation Platform — Panda Projet Inc.
-- Run in Neon SQL Editor (https://console.neon.tech)

-- Users table (from saas-starter-kit)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  organization VARCHAR(255),
  job_title VARCHAR(255),
  experience_level VARCHAR(50) DEFAULT 'beginner',
  plan VARCHAR(50) DEFAULT 'free',
  is_admin BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  google_id VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  lang VARCHAR(5) DEFAULT 'en',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  simulations_used INTEGER DEFAULT 0,
  simulations_limit INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make password_hash nullable for Google OAuth users
DO $$ 
BEGIN 
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Scenarios catalog
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  title_en VARCHAR(500) NOT NULL,
  title_fr VARCHAR(500) NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  domain VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,
  duration_min INTEGER DEFAULT 30,
  system_prompt TEXT NOT NULL,
  evaluation_criteria JSONB DEFAULT '[]',
  competencies VARCHAR(50)[] DEFAULT '{}',
  documents_json JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simulation sessions
CREATE TABLE IF NOT EXISTS simulation_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  score_c1 INTEGER DEFAULT 0,
  score_c2 INTEGER DEFAULT 0,
  score_c3 INTEGER DEFAULT 0,
  score_c4 INTEGER DEFAULT 0,
  score_c5 INTEGER DEFAULT 0,
  score_c6 INTEGER DEFAULT 0,
  score_global INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  deliverable TEXT,
  aria_notes TEXT
);

-- Simulation interactions (prompts + responses)
CREATE TABLE IF NOT EXISTS simulation_interactions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  prompt_analysis_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debrief reports
CREATE TABLE IF NOT EXISTS debrief_reports (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  analysis_json JSONB,
  recommendations TEXT,
  strengths TEXT,
  improvements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  competency VARCHAR(10) NOT NULL,
  current_level INTEGER DEFAULT 1,
  total_scenarios INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  badges_json JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, competency)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON simulation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON simulation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON simulation_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(is_active);

-- Insert V1 scenarios (S01-S03)
INSERT INTO scenarios (code, title_en, title_fr, description_en, description_fr, domain, level, duration_min, system_prompt, evaluation_criteria, competencies, is_active, is_free, sort_order)
VALUES 
(
  'S01',
  'Write a Professional Change Announcement Email',
  'Rédiger un courriel professionnel pour annoncer un changement organisationnel',
  'You are the communications director at a mid-size tech company. The CEO has decided to restructure two departments, affecting 45 employees. You must draft a professional email that informs all staff while maintaining morale and clarity.',
  'Vous êtes directeur des communications dans une entreprise technologique de taille moyenne. Le PDG a décidé de restructurer deux départements, affectant 45 employés. Vous devez rédiger un courriel professionnel qui informe tout le personnel tout en maintenant le moral et la clarté.',
  'Communication',
  'beginner',
  15,
  'You are Claude, an AI assistant. The user is practicing their prompting skills in a simulation. They need to draft a professional organizational change email. Respond naturally to their prompts. Do not reveal you are in a simulation. Respond in the language the user writes in.',
  '[{"criterion":"Professional tone","weight":20},{"criterion":"Clarity of message","weight":25},{"criterion":"Employee empathy","weight":20},{"criterion":"Action items included","weight":15},{"criterion":"Completeness","weight":20}]',
  '{C1,C3}',
  true, true, 1
),
(
  'S02',
  'Analyze Sales Data and Create an Executive Report',
  'Analyser un jeu de données CSV et produire un rapport exécutif avec visualisations',
  'You are a business analyst at a retail company. You have been given Q3 sales data and must produce an executive summary with key insights, trends, and recommendations for the leadership team.',
  'Vous êtes analyste d''affaires dans une entreprise de vente au détail. On vous a remis les données de ventes du T3 et vous devez produire un résumé exécutif avec les insights clés, les tendances et les recommandations pour l''équipe de direction.',
  'Analysis',
  'intermediate',
  30,
  'You are Claude, an AI assistant. The user is practicing data analysis prompting. They will ask you to analyze sales data and create reports. Respond naturally. Help them when asked but let them drive the analysis. Respond in the language the user writes in.',
  '[{"criterion":"Data interpretation accuracy","weight":25},{"criterion":"Insight quality","weight":25},{"criterion":"Visualization requests","weight":15},{"criterion":"Executive summary clarity","weight":20},{"criterion":"Recommendations quality","weight":15}]',
  '{C1,C2,C3,C5}',
  true, false, 2
),
(
  'S03',
  'Create a 10-Slide Strategic Presentation for the Board',
  'Créer une présentation stratégique de 10 slides pour le comité de direction',
  'You are the VP of Strategy at a SaaS company. The board meeting is tomorrow and you need to create a compelling 10-slide presentation covering market position, competitive analysis, growth strategy, and financial projections.',
  'Vous êtes VP Stratégie dans une entreprise SaaS. La réunion du conseil d''administration est demain et vous devez créer une présentation percutante de 10 diapositives couvrant la position de marché, l''analyse concurrentielle, la stratégie de croissance et les projections financières.',
  'Strategy',
  'intermediate',
  30,
  'You are Claude, an AI assistant. The user is creating a strategic board presentation. Help them structure and create compelling slides. Respond naturally to their prompts. Respond in the language the user writes in.',
  '[{"criterion":"Strategic thinking","weight":25},{"criterion":"Slide structure","weight":20},{"criterion":"Data-driven arguments","weight":20},{"criterion":"Visual communication","weight":15},{"criterion":"Narrative flow","weight":20}]',
  '{C1,C2,C3,C4}',
  true, false, 3
);

-- Verify
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
