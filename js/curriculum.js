// FluentQuest — cursus 6 mois (26 semaines × 5 leçons + révisions du week-end)

export const LANGS = {
  en: { name: 'Anglais', native: 'English', flag: '🇬🇧', accents: ['en-GB', 'en-US'], tutor: { ado: 'Jamie', adulte: 'Emma' } },
  es: { name: 'Espagnol', native: 'Español', flag: '🇪🇸', accents: ['es-ES', 'es-MX'], tutor: { ado: 'Diego', adulte: 'Lucía' } },
};

export const LEVELS = [
  { id: 'A1', fr: 'Débutant — mots simples, phrases toutes faites' },
  { id: 'A2', fr: 'Élémentaire — se débrouiller dans les situations courantes' },
  { id: 'B1', fr: 'Intermédiaire — raconter, donner son avis simplement' },
  { id: 'B2', fr: 'Avancé — discuter avec aisance de sujets variés' },
  { id: 'C1', fr: 'Autonome — s’exprimer avec nuance et spontanéité (« fluent »)' },
];
export const levelIndex = (l) => LEVELS.findIndex((x) => x.id === l);
export const defaultTarget = (start) => LEVELS[Math.min(levelIndex(start) + 2, LEVELS.length - 1)].id;

export const AUDIENCES = {
  ado: { label: 'Ado (collège / lycée)', goal: 50 },
  adulte: { label: 'Adulte (pro & perso)', goal: 60 },
};

export const REVIEW_WEEKS = [13, 26];

export const THEMES = {
  ado: [
    { fr: 'Moi & mon univers', ctx: 'se présenter, goûts, personnalité, ce qui compte pour moi' },
    { fr: 'Le collège & la 3e', ctx: 'matières, profs, emploi du temps, brevet, stage' },
    { fr: 'Famille & amis', ctx: 'décrire les gens (physique, caractère), relations' },
    { fr: 'Ma journée', ctx: 'routine, horaires, week-end, tâches à la maison' },
    { fr: 'Manger & cuisiner', ctx: 'repas, commander au restaurant/fast-food, recette simple' },
    { fr: 'Sport & vélo', ctx: 'cyclisme sur route, entraînement, compétitions, champions' },
    { fr: 'Jeux vidéo & loisirs', ctx: 'gaming, expliquer les règles d’un jeu, hobbies' },
    { fr: 'Musique, séries & films', ctx: 'goûts, recommander, critiquer, raconter un épisode' },
    { fr: 'En ville', ctx: 'se repérer, demander son chemin, transports, lieux' },
    { fr: 'Shopping & argent de poche', ctx: 'acheter, comparer, rendre un article, budget' },
    { fr: 'Voyages & vacances', ctx: 'préparer un voyage, aéroport, hôtel, visiter' },
    { fr: 'Raconter un souvenir', ctx: 'anecdotes au passé, meilleur/pire moment' },
    { fr: 'RÉVISION — mi-parcours', ctx: 'mélange de tous les thèmes des semaines 1 à 12', review: true },
    { fr: 'Santé & forme', ctx: 'chez le médecin, sommeil, bien-être, blessure de sport' },
    { fr: 'Tech & réseaux sociaux', ctx: 'smartphone, apps, créateurs de contenu, sécurité en ligne' },
    { fr: 'Environnement & planète', ctx: 'climat, écologie, gestes du quotidien' },
    { fr: 'Métiers & avenir', ctx: 'rêves, ambitions, métiers, stage d’observation' },
    { fr: 'Le lycée & l’orientation', ctx: 'choix de spécialités, projets, études à l’étranger' },
    { fr: 'Émotions & amitié', ctx: 'exprimer ses sentiments, donner des conseils, conflits entre amis' },
    { fr: 'Culture du monde', ctx: 'fêtes, traditions, villes et pays où l’on parle la langue' },
    { fr: 'Actualité & débats', ctx: 'comprendre une info, donner et justifier son avis' },
    { fr: 'Se débrouiller', ctx: 'imprévus, problèmes, réclamer poliment, demander de l’aide' },
    { fr: 'Imaginaire & « et si… »', ctx: 'histoires, légendes, situations hypothétiques' },
    { fr: 'Argumenter', ctx: 'débat structuré, convaincre, nuancer' },
    { fr: 'Projet : exposé oral', ctx: 'préparer et présenter un sujet de son choix en 2 minutes' },
    { fr: 'GRAND DÉFI FINAL', ctx: 'longue conversation libre, bilan des 6 mois', review: true },
  ],
  adulte: [
    { fr: 'Se présenter (perso & pro)', ctx: 'identité, rôle, parcours en 1 minute' },
    { fr: 'Parcours & carrière', ctx: 'expériences, réalisations, transitions' },
    { fr: 'Réunions efficaces', ctx: 'animer, interrompre poliment, reformuler, conclure' },
    { fr: 'Small talk & networking', ctx: 'brise-glace, événements, relancer une conversation' },
    { fr: 'Appels & visio', ctx: 'conf calls, problèmes techniques, clarifier' },
    { fr: 'Présenter un projet', ctx: 'structure, chiffres, questions-réponses' },
    { fr: 'Expliquer la tech simplement', ctx: 'cloud, data, IA, FinOps pour non-experts' },
    { fr: 'Négocier', ctx: 'fournisseurs, contrats, compromis, dire non' },
    { fr: 'Voyage d’affaires', ctx: 'hôtel, taxi, retards, imprévus' },
    { fr: 'Restaurant & convivialité', ctx: 'dîner client, recommander, codes culturels' },
    { fr: 'Raconter', ctx: 'anecdotes, réussites, échecs, leçons apprises' },
    { fr: 'Manager', ctx: 'feedback, délégation, motivation, entretiens annuels' },
    { fr: 'RÉVISION — mi-parcours', ctx: 'mélange de tous les thèmes des semaines 1 à 12', review: true },
    { fr: 'Passion sport & vélo', ctx: 'cyclosportives, entraînement, matériel, montagne' },
    { fr: 'Famille & vie en France', ctx: 'éducation, ados, région lyonnaise, art de vivre' },
    { fr: 'Économie & actualité', ctx: 'marchés, entreprises, résumer et commenter une info' },
    { fr: 'IA & société', ctx: 'débat, éthique, impact sur le travail' },
    { fr: 'Entretien d’embauche', ctx: 'poste de direction, questions difficiles, se vendre' },
    { fr: 'Gérer un conflit', ctx: 'désaccord, escalade, diplomatie' },
    { fr: 'Stratégie & hypothèses', ctx: 'scénarios, risques, conditionnel' },
    { fr: 'Culture & humour', ctx: 'références culturelles, blagues, faux-amis' },
    { fr: 'Écrit pro', ctx: 'emails, messages, comptes-rendus — dictés à l’oral puis corrigés' },
    { fr: 'Convaincre & pitcher', ctx: 'elevator pitch, objections, storytelling' },
    { fr: 'Idiomes & nuances', ctx: 'expressions idiomatiques, registre, sous-entendus' },
    { fr: 'Discussion de fond', ctx: 'sujet complexe de son choix, argumentation longue' },
    { fr: 'GRAND DÉFI FINAL', ctx: 'longue conversation libre, bilan des 6 mois', review: true },
  ],
};

export const GRAMMAR = {
  en: [
    ['A1', 'to be, have got, pronoms'], ['A1', 'présent simple & adverbes de fréquence'], ['A1', 'there is / there are, some / any'],
    ['A1', 'can / can’t, impératif, prépositions de lieu'],
    ['A2', 'présent continu vs présent simple'], ['A2', 'prétérit (verbes réguliers & irréguliers)'], ['A2', 'was / were, questions au passé'],
    ['A2', 'comparatifs & superlatifs'], ['A2', 'futur : going to / will'], ['A2', 'much / many / a lot of, quantités'],
    ['A2', 'must / have to / should'], ['A2', 'present perfect (ever / never / already / yet)'],
    ['B1', 'present perfect vs prétérit, for / since'], ['B1', 'past continuous (récit)'], ['B1', 'conditionnels type 1 & 2'],
    ['B1', 'propositions relatives (who / which / that / where)'], ['B1', 'voix passive (présent / passé)'], ['B1', 'discours indirect'],
    ['B1', 'used to / would (habitudes passées)'], ['B1', 'gérondif vs infinitif'], ['B1', 'question tags & phrasal verbs courants'],
    ['B2', 'past perfect & temps du récit'], ['B2', 'conditionnel type 3 & mixtes'], ['B2', 'modaux de déduction (must have / might have)'],
    ['B2', 'wish / if only / I’d rather'], ['B2', 'causatif (have / get sth done) & passif avancé'], ['B2', 'connecteurs logiques & marqueurs de discours'],
    ['B2', 'future continuous / future perfect'], ['B2', 'mise en relief (cleft sentences, inversion)'],
    ['C1', 'phrasal verbs idiomatiques & collocations'], ['C1', 'atténuer & nuancer (hedging)'], ['C1', 'registres formel / informel'],
    ['C1', 'idiomes, humour & sous-entendus'], ['C1', 'rhétorique & persuasion'],
  ],
  es: [
    ['A1', 'ser / estar (bases), presente regular'], ['A1', 'gustar, tener, hay'], ['A1', 'presente irregular (ir, hacer, poder, querer)'],
    ['A1', 'verbes pronominaux, routine'],
    ['A2', 'estar + gérondif'], ['A2', 'pretérito perfecto (he comido)'], ['A2', 'pretérito indefinido régulier'],
    ['A2', 'pretérito indefinido irrégulier'], ['A2', 'imperfecto (descriptions, habitudes)'], ['A2', 'ir a + infinitif & futur simple'],
    ['A2', 'comparatifs & superlatifs'], ['A2', 'pronoms COD / COI (lo, la, le, se lo)'], ['A2', 'impératif affirmatif'],
    ['B1', 'indefinido vs imperfecto (récit)'], ['B1', 'ser vs estar (avancé)'], ['B1', 'subjonctif présent : souhaits (quiero que, ojalá)'],
    ['B1', 'subjonctif : opinion négative & émotions'], ['B1', 'impératif négatif'], ['B1', 'conditionnel simple (me gustaría, podría)'],
    ['B1', 'por vs para'], ['B1', 'pluscuamperfecto'], ['B1', 'discours indirect'],
    ['B2', 'imparfait du subjonctif'], ['B2', 'si + imparfait subj. + conditionnel'], ['B2', 'subjonctif après cuando / aunque / para que'],
    ['B2', 'périphrases (llevar + gér., acabar de, volver a)'], ['B2', 'se impersonnel & voix passive'], ['B2', 'connecteurs du discours'],
    ['B2', 'si + plus-que-parfait subj. + conditionnel passé'],
    ['C1', 'expressions familières & modismos'], ['C1', 'nuances de registre'], ['C1', 'variantes Espagne / Amérique latine'],
    ['C1', 'argumenter & nuancer'],
  ],
};

export const SESSIONS = [
  { d: 1, id: 'decouverte', icon: '🌱', name: 'Découverte', brief: 'Introduire le vocabulaire clé du thème à travers une conversation naturelle. Le tableau présente 6–8 mots/expressions utiles avec exemples.' },
  { d: 2, id: 'grammaire', icon: '🧩', name: 'Grammaire en action', brief: 'Faire pratiquer le point de grammaire de la semaine en conversation : courte règle au tableau, puis questions qui obligent à l’utiliser.' },
  { d: 3, id: 'role', icon: '🎭', name: 'Jeu de rôle', brief: 'Jeu de rôle réaliste lié au thème (le tuteur joue un personnage). Annonce la situation et le rôle de l’apprenant au tableau.' },
  { d: 4, id: 'ecoute', icon: '🎧', name: 'Écoute & compréhension', brief: 'Raconter une courte histoire ou situation (4–6 phrases, niveau adapté) en 2 ou 3 morceaux, puis poser des questions de compréhension et de réaction.' },
  { d: 5, id: 'defi', icon: '🏆', name: 'Défi de la semaine', brief: 'Mission « boss » : mélange vocabulaire + grammaire de la semaine, questions plus exigeantes, l’apprenant doit parler plus longuement. Note de manière exigeante.' },
];

export const TOTAL_WEEKS = 26;

export function grammarFor(lang, startLevel, targetLevel, week) {
  const list = GRAMMAR[lang];
  const startIdx = list.findIndex((g) => g[0] === startLevel);
  let endIdx = list.length - 1;
  for (let i = list.length - 1; i >= 0; i--) if (list[i][0] === targetLevel) { endIdx = i; break; }
  if (REVIEW_WEEKS.includes(week)) return { lvl: 'mix', g: 'révision de tous les points vus' };
  const normalBefore = week - 1 - REVIEW_WEEKS.filter((w) => w < week).length; // 0..23
  const span = endIdx - Math.max(startIdx, 0) + 1;
  const idx = Math.max(startIdx, 0) + Math.min(span - 1, Math.floor((normalBefore * span) / 24));
  const [lvl, g] = list[idx];
  return { lvl, g };
}

export function weekPlan(profile, lang, week) {
  const L = profile.langs[lang];
  const theme = THEMES[profile.audience][week - 1];
  const grammar = grammarFor(lang, L.level, L.target, week);
  // niveau visé à cette semaine (progression linéaire entre niveau de départ et cible)
  const a = levelIndex(L.level), b = levelIndex(L.target);
  const cur = LEVELS[Math.min(b, a + Math.floor(((week - 1) / TOTAL_WEEKS) * (b - a + 1)))].id;
  return { week, theme, grammar, level: cur };
}

export const lessonId = (w, d) => `w${w}d${d}`;

export function nextLesson(L) {
  for (let w = 1; w <= TOTAL_WEEKS; w++)
    for (let d = 1; d <= 5; d++) if (!L.progress[lessonId(w, d)]) return { w, d };
  return null;
}

export function isUnlocked(L, w, d) {
  const n = nextLesson(L);
  if (!n) return true;
  return w < n.w || (w === n.w && d <= n.d) || !!L.progress[lessonId(w, d)];
}

// Phrases de survie & connecteurs — utilisables hors-ligne dès le premier jour
export const STARTER_DECK = {
  en: [
    ['Could you say that again, please?', 'Tu peux répéter, s’il te plaît ?'], ['How do you say … in English?', 'Comment dit-on … en anglais ?'],
    ['I’m not sure, but I think…', 'Je ne suis pas sûr, mais je pense que…'], ['In my opinion,…', 'À mon avis,…'],
    ['What do you mean?', 'Qu’est-ce que tu veux dire ?'], ['That makes sense.', 'Ça se tient / c’est logique.'],
    ['Let me think…', 'Laisse-moi réfléchir…'], ['By the way,…', 'Au fait,…'], ['Actually,…', 'En fait,…'],
    ['I see what you mean.', 'Je vois ce que tu veux dire.'], ['It depends on…', 'Ça dépend de…'], ['On the other hand,…', 'D’un autre côté,…'],
    ['I used to…', 'J’avais l’habitude de…'], ['I’m looking forward to it.', 'J’ai hâte.'], ['No worries.', 'Pas de souci.'],
    ['What about you?', 'Et toi ?'], ['I agree / I disagree.', 'Je suis d’accord / pas d’accord.'], ['It’s worth it.', 'Ça vaut le coup.'],
    ['I can’t wait!', 'J’ai trop hâte !'], ['That’s a good point.', 'C’est un bon argument.'],
  ],
  es: [
    ['¿Puedes repetirlo, por favor?', 'Tu peux répéter, s’il te plaît ?'], ['¿Cómo se dice … en español?', 'Comment dit-on … en espagnol ?'],
    ['No estoy seguro, pero creo que…', 'Je ne suis pas sûr, mais je crois que…'], ['En mi opinión,… / Para mí,…', 'À mon avis,…'],
    ['¿Qué quieres decir?', 'Qu’est-ce que tu veux dire ?'], ['Tiene sentido.', 'Ça se tient.'],
    ['Déjame pensar…', 'Laisse-moi réfléchir…'], ['Por cierto,…', 'Au fait,…'], ['En realidad,…', 'En fait,…'],
    ['Entiendo lo que quieres decir.', 'Je vois ce que tu veux dire.'], ['Depende de…', 'Ça dépend de…'], ['Por otro lado,…', 'D’un autre côté,…'],
    ['Solía…', 'J’avais l’habitude de…'], ['¡Qué ganas!', 'J’ai trop hâte !'], ['No pasa nada.', 'Pas de souci / ce n’est pas grave.'],
    ['¿Y tú?', 'Et toi ?'], ['Estoy de acuerdo / No estoy de acuerdo.', 'Je suis d’accord / pas d’accord.'], ['Vale la pena.', 'Ça vaut le coup.'],
    ['¡Qué guay! / ¡Qué chévere!', 'Trop bien ! (Espagne / Amérique latine)'], ['Tienes razón.', 'Tu as raison.'],
  ],
};
