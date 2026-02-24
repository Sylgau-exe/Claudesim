-- ClaudeSim — Add French criteria names to all scenarios
-- Run in Neon SQL Editor

-- S01: Professional Email
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Professional tone","criterion_fr":"Ton professionnel","weight":20},
  {"criterion":"Clarity of message","criterion_fr":"Clarté du message","weight":25},
  {"criterion":"Employee empathy","criterion_fr":"Empathie envers les employés","weight":20},
  {"criterion":"Action items included","criterion_fr":"Éléments d''action inclus","weight":15},
  {"criterion":"Completeness","criterion_fr":"Exhaustivité","weight":20}
]' WHERE code = 'S01';

-- S02: Data Analysis
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Data interpretation accuracy","criterion_fr":"Précision de l''interprétation des données","weight":25},
  {"criterion":"Insight quality","criterion_fr":"Qualité des insights","weight":25},
  {"criterion":"Visualization requests","criterion_fr":"Demandes de visualisation","weight":15},
  {"criterion":"Executive summary clarity","criterion_fr":"Clarté du résumé exécutif","weight":20},
  {"criterion":"Recommendations quality","criterion_fr":"Qualité des recommandations","weight":15}
]' WHERE code = 'S02';

-- S03: Strategic Presentation
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Strategic thinking","criterion_fr":"Pensée stratégique","weight":25},
  {"criterion":"Slide structure","criterion_fr":"Structure des diapositives","weight":20},
  {"criterion":"Data-driven arguments","criterion_fr":"Arguments fondés sur les données","weight":20},
  {"criterion":"Visual communication","criterion_fr":"Communication visuelle","weight":15},
  {"criterion":"Narrative flow","criterion_fr":"Fluidité narrative","weight":20}
]' WHERE code = 'S03';

-- S04: Legal Research
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Research depth","criterion_fr":"Profondeur de la recherche","weight":25},
  {"criterion":"Source quality requests","criterion_fr":"Qualité des sources demandées","weight":20},
  {"criterion":"Legal reasoning clarity","criterion_fr":"Clarté du raisonnement juridique","weight":20},
  {"criterion":"Practical recommendations","criterion_fr":"Recommandations pratiques","weight":15},
  {"criterion":"Structured presentation","criterion_fr":"Présentation structurée","weight":20}
]' WHERE code = 'S04';

-- S05: Social Media Campaign
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Strategy coherence","criterion_fr":"Cohérence de la stratégie","weight":20},
  {"criterion":"Platform-specific tactics","criterion_fr":"Tactiques par plateforme","weight":20},
  {"criterion":"Content creativity","criterion_fr":"Créativité du contenu","weight":20},
  {"criterion":"Measurable KPIs","criterion_fr":"KPI mesurables","weight":20},
  {"criterion":"Practical timeline","criterion_fr":"Échéancier réaliste","weight":20}
]' WHERE code = 'S05';

-- S06: Code Architecture
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Technical depth","criterion_fr":"Profondeur technique","weight":25},
  {"criterion":"Tradeoff analysis quality","criterion_fr":"Qualité de l''analyse des compromis","weight":20},
  {"criterion":"Risk identification","criterion_fr":"Identification des risques","weight":20},
  {"criterion":"Practical migration plan","criterion_fr":"Plan de migration pratique","weight":20},
  {"criterion":"Cost reasoning","criterion_fr":"Raisonnement sur les coûts","weight":15}
]' WHERE code = 'S06';

-- S07: Crisis Communication
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Speed and decisiveness","criterion_fr":"Rapidité et détermination","weight":15},
  {"criterion":"Tone appropriateness per audience","criterion_fr":"Ton approprié par audience","weight":25},
  {"criterion":"Message consistency across channels","criterion_fr":"Cohérence du message entre les canaux","weight":20},
  {"criterion":"Empathy and accountability","criterion_fr":"Empathie et responsabilité","weight":20},
  {"criterion":"Action plan clarity","criterion_fr":"Clarté du plan d''action","weight":20}
]' WHERE code = 'S07';

-- S08: Grant Proposal
UPDATE scenarios SET evaluation_criteria = '[
  {"criterion":"Compelling narrative","criterion_fr":"Récit convaincant","weight":20},
  {"criterion":"Evidence-based needs assessment","criterion_fr":"Évaluation des besoins fondée sur des données","weight":20},
  {"criterion":"Program design rigor","criterion_fr":"Rigueur de la conception du programme","weight":20},
  {"criterion":"Budget realism","criterion_fr":"Réalisme budgétaire","weight":15},
  {"criterion":"Evaluation methodology","criterion_fr":"Méthodologie d''évaluation","weight":15},
  {"criterion":"Grant writing conventions","criterion_fr":"Conventions de rédaction de subventions","weight":10}
]' WHERE code = 'S08';
