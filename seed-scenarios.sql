-- ClaudeSim — Additional Scenarios S04-S08
-- Run AFTER schema.sql in Neon SQL Editor

INSERT INTO scenarios (code, title_en, title_fr, description_en, description_fr, domain, level, duration_min, system_prompt, evaluation_criteria, competencies, is_active, is_free, sort_order)
VALUES
(
  'S04',
  'Research and Summarize a Complex Legal Question',
  'Rechercher et résumer une question juridique complexe',
  'You are a legal research assistant at a mid-size law firm. A senior partner needs a comprehensive briefing on the legal implications of AI-generated content and copyright law. Produce a well-structured research summary with key precedents, current legislation, and practical recommendations.',
  'Vous êtes assistant de recherche juridique dans un cabinet d''avocats de taille moyenne. Un associé principal a besoin d''un briefing complet sur les implications juridiques du contenu généré par IA et le droit d''auteur. Produisez un résumé de recherche bien structuré avec les précédents clés, la législation actuelle et les recommandations pratiques.',
  'Legal',
  'advanced',
  45,
  'You are Claude, an AI assistant. The user is practicing legal research prompting. They need to research AI copyright law. Respond naturally with detailed, well-sourced information. Respond in the language the user writes in. When they ask about legal topics, provide thorough analysis while noting you are not providing legal advice.',
  '[{"criterion":"Research depth","weight":25},{"criterion":"Source quality requests","weight":20},{"criterion":"Legal reasoning clarity","weight":20},{"criterion":"Practical recommendations","weight":15},{"criterion":"Structured presentation","weight":20}]',
  '{C1,C2,C4,C6}',
  true, false, 4
),
(
  'S05',
  'Create a Social Media Marketing Campaign Plan',
  'Créer un plan de campagne marketing sur les réseaux sociaux',
  'You are the social media manager at a direct-to-consumer skincare brand launching a new product line. Create a comprehensive 4-week social media campaign plan including content calendar, platform strategy, influencer outreach templates, and KPI targets.',
  'Vous êtes responsable des réseaux sociaux d''une marque de soins de la peau en vente directe qui lance une nouvelle gamme de produits. Créez un plan de campagne complet sur 4 semaines incluant le calendrier de contenu, la stratégie par plateforme, les modèles de contact d''influenceurs et les objectifs KPI.',
  'Marketing',
  'intermediate',
  30,
  'You are Claude, an AI assistant. The user is creating a social media marketing campaign. Help them plan strategy, content, and metrics. Respond naturally. Respond in the language the user writes in.',
  '[{"criterion":"Strategy coherence","weight":20},{"criterion":"Platform-specific tactics","weight":20},{"criterion":"Content creativity","weight":20},{"criterion":"Measurable KPIs","weight":20},{"criterion":"Practical timeline","weight":20}]',
  '{C1,C2,C3,C5}',
  true, false, 5
),
(
  'S06',
  'Debug and Optimize a Code Architecture Decision',
  'Déboguer et optimiser une décision d''architecture logicielle',
  'You are a senior developer evaluating whether to migrate a monolithic Node.js application to microservices. The CTO wants a technical recommendation with pros/cons, migration plan, risk assessment, and cost estimates. Use Claude to analyze the tradeoffs and build your recommendation.',
  'Vous êtes développeur senior évaluant s''il faut migrer une application Node.js monolithique vers des microservices. Le CTO veut une recommandation technique avec pour/contre, plan de migration, évaluation des risques et estimation des coûts. Utilisez Claude pour analyser les compromis et construire votre recommandation.',
  'Technical',
  'advanced',
  45,
  'You are Claude, an AI assistant. The user is working on a technical architecture decision about monolith vs microservices migration. Provide detailed technical analysis when asked. Respond naturally. Respond in the language the user writes in.',
  '[{"criterion":"Technical depth","weight":25},{"criterion":"Tradeoff analysis quality","weight":20},{"criterion":"Risk identification","weight":20},{"criterion":"Practical migration plan","weight":20},{"criterion":"Cost reasoning","weight":15}]',
  '{C1,C2,C3,C4,C5}',
  true, false, 6
),
(
  'S07',
  'Prepare a Crisis Communication Response',
  'Préparer une réponse de communication de crise',
  'You are the Head of Communications at a food company. A customer has posted a viral social media video claiming to have found a foreign object in your product. Media inquiries are flooding in. You must prepare: an official press statement, internal talking points for staff, a social media response strategy, and a customer service script.',
  'Vous êtes responsable des communications d''une entreprise alimentaire. Un client a publié une vidéo virale sur les réseaux sociaux affirmant avoir trouvé un objet étranger dans votre produit. Les demandes médiatiques affluent. Vous devez préparer : un communiqué de presse officiel, des points de discussion internes pour le personnel, une stratégie de réponse sur les réseaux sociaux et un script de service client.',
  'Communication',
  'advanced',
  40,
  'You are Claude, an AI assistant. The user is handling a crisis communication scenario. Help them craft appropriate responses for different audiences and channels. Respond naturally. The crisis is fictional — engage fully with the scenario. Respond in the language the user writes in.',
  '[{"criterion":"Speed and decisiveness","weight":15},{"criterion":"Tone appropriateness per audience","weight":25},{"criterion":"Message consistency across channels","weight":20},{"criterion":"Empathy and accountability","weight":20},{"criterion":"Action plan clarity","weight":20}]',
  '{C1,C3,C4,C5,C6}',
  true, false, 7
),
(
  'S08',
  'Write a Grant Proposal for a Non-Profit Initiative',
  'Rédiger une demande de subvention pour une initiative à but non lucratif',
  'You are the program director of a non-profit focused on digital literacy in underserved communities. You need to write a compelling grant proposal for a $500,000 federal grant to fund a 3-year AI literacy program. The proposal must include: executive summary, needs assessment, program design, budget justification, and evaluation plan.',
  'Vous êtes directeur de programme d''un organisme à but non lucratif axé sur la littératie numérique dans les communautés mal desservies. Vous devez rédiger une demande de subvention convaincante pour une subvention fédérale de 500 000 $ afin de financer un programme de littératie IA sur 3 ans. La proposition doit inclure : résumé exécutif, évaluation des besoins, conception du programme, justification budgétaire et plan d''évaluation.',
  'Research',
  'advanced',
  45,
  'You are Claude, an AI assistant. The user is writing a grant proposal for an AI literacy program. Help them with research, writing, and structuring the proposal when asked. Respond naturally. Respond in the language the user writes in.',
  '[{"criterion":"Compelling narrative","weight":20},{"criterion":"Evidence-based needs assessment","weight":20},{"criterion":"Program design rigor","weight":20},{"criterion":"Budget realism","weight":15},{"criterion":"Evaluation methodology","weight":15},{"criterion":"Grant writing conventions","weight":10}]',
  '{C1,C2,C3,C4,C5,C6}',
  true, false, 8
)
ON CONFLICT (code) DO NOTHING;

-- Create admin user (update email/password as needed)
-- Password: ClaudeSim2026! (bcrypt hash)
-- INSERT INTO users (email, name, password_hash, plan, is_admin, simulations_limit, auth_provider)
-- VALUES ('sgauthier@executiveproducer.ca', 'Sylvain Gauthier', '$2a$12$REPLACE_WITH_ACTUAL_HASH', 'pro_lifetime', true, 999, 'email');
