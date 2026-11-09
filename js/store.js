// État local (localStorage) + gamification : XP, niveaux, séries, pièces, quêtes, ligues, boutique, badges
import { DEFAULT_MODELS } from './ai.js';
import { LANGS, STARTER_DECK, AUDIENCES, defaultTarget, TOTAL_WEEKS, lessonId, isBeginner } from './curriculum.js';

const KEY = 'fluentquest.v1';

const defaults = () => ({
  settings: {
    provider: 'gemini', geminiKey: '', claudeKey: '',
    geminiModel: DEFAULT_MODELS.gemini, claudeModel: DEFAULT_MODELS.claude,
    micMode: 'auto', handsFree: false, sound: true,
  },
  profiles: [],
  activeId: null,
  activeLang: 'en',
});

export const state = (() => {
  try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return defaults(); }
})();
state.settings = Object.assign(defaults().settings, state.settings);
// V3 : l'ancien modèle par défaut devient « auto » (modèle gratuit choisi automatiquement)
if (!state.settings.geminiModel || state.settings.geminiModel === 'gemini-3.5-flash') state.settings.geminiModel = 'auto';

export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
export const profile = () => state.profiles.find((p) => p.id === state.activeId) || null;

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
export function weekKey(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return today(x); }

function migrate(p) {
  p.coins ??= 0; p.owned ??= {}; p.theme ??= 'violet'; p.boostUntil ??= 0;
  p.daily ??= {}; p.quests ??= {}; p.league ??= { tier: 0, week: weekKey(), history: [] };
  p.stats = Object.assign({ turns: 0, voiceTurns: 0, lessons: 0, perfect: 0, quizOk: 0, quizTotal: 0, bestCombo: 0, bosses: 0, chests: 0, questsDone: 0, repeats: 0 }, p.stats || {});
  p.streak ??= { count: 0, last: null, freezes: 0, best: 0 };
}

export function newLangState(level, accent) {
  return { level, target: defaultTarget(level), accent, startDate: today(), progress: {}, rate: isBeginner(level) ? 0.85 : 1, voice: '' };
}

export function createProfile({ name, audience, avatar, about, langs }) {
  const p = {
    id: Math.random().toString(36).slice(2, 10), name, audience, avatar: avatar || '🦊', about: about || '',
    xp: 0, xpByDay: {}, badges: {}, goal: AUDIENCES[audience].goal, langs: {}, deck: [],
  };
  migrate(p);
  for (const [code, level] of Object.entries(langs)) {
    p.langs[code] = newLangState(level, LANGS[code].accents[0]);
    seedDeck(p, code);
  }
  state.profiles.push(p);
  state.activeId = p.id;
  state.activeLang = Object.keys(langs)[0];
  save();
  return p;
}

export function seedDeck(p, lang) {
  const set = isBeginner(p.langs[lang].level) ? 'beginner' : 'confirmed';
  for (const [t, fr] of STARTER_DECK[lang][set]) addCard(p, lang, { target: t, fr, example: '' }, 'starter');
}

export function addCard(p, lang, { target, fr, example }, src = 'lesson') {
  if (!target) return false;
  const k = target.trim().toLowerCase();
  if (p.deck.some((c) => c.lang === lang && c.target.trim().toLowerCase() === k)) return false;
  p.deck.push({ id: Math.random().toString(36).slice(2, 9), lang, target: target.trim(), fr: fr || '', example: example || '', box: 1, due: today(), src });
  return true;
}

const BOX_DAYS = [0, 1, 2, 4, 8, 16];
export function reviewCard(card, ok) {
  card.box = ok ? Math.min(5, card.box + 1) : 1;
  const d = new Date(); d.setDate(d.getDate() + (ok ? BOX_DAYS[card.box] : 0));
  card.due = today(d);
}
export const dueCards = (p, lang) => p.deck.filter((c) => c.lang === lang && c.due <= today());

// ---------- XP & niveaux ----------
export const LEVEL_TITLES = ['Curieux', 'Explorateur', 'Voyageur', 'Aventurier', 'Conteur', 'Orateur', 'Ambassadeur', 'Polyglotte', 'Maestro', 'Légende'];
export function levelInfo(xp) {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = 100 + (lvl - 1) * 50; }
  return { lvl, title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lvl - 1) / 3))], into: xp - acc, need };
}
export const boostActive = (p) => p.boostUntil > Date.now();

// Ajoute de l'XP (boost x2 éventuel). Retourne { gained, levelUp }
export function addXP(p, n, { noBoost } = {}) {
  const before = levelInfo(p.xp).lvl;
  const gained = Math.round(n * (!noBoost && boostActive(p) ? 2 : 1));
  p.xp += gained;
  const t = today();
  p.xpByDay[t] = (p.xpByDay[t] || 0) + gained;
  bump(p, 'xp', gained);
  touchStreak(p);
  rollLeague(p);
  const after = levelInfo(p.xp).lvl;
  if (after > before) p.coins += 25 * (after - before);
  save();
  return { gained, levelUp: after > before ? after : 0 };
}

export function addCoins(p, n) { p.coins += n; bump(p, 'coins', n); save(); }

// ---------- Séries ----------
export function touchStreak(p) {
  const t = today(), s = p.streak;
  if (s.last === t) return;
  const gap = s.last ? daysBetween(s.last, t) : null;
  if (gap === 1) s.count++;
  else if (gap === 2 && s.freezes > 0) { s.freezes--; s.count++; }
  else s.count = 1;
  s.last = t;
  if (s.count % 7 === 0) s.freezes = Math.min(3, s.freezes + 1);
  s.best = Math.max(s.best || 0, s.count);
}
export function streakAlive(p) {
  const s = p.streak;
  if (!s.last) return 0;
  const gap = daysBetween(s.last, today());
  return gap <= 1 || (gap === 2 && s.freezes > 0) ? s.count : 0;
}

export const xpToday = (p) => p.xpByDay[today()] || 0;
export function xpThisWeek(p) {
  const d = new Date(); const dow = (d.getDay() + 6) % 7; let sum = 0;
  for (let i = 0; i <= dow; i++) { const x = new Date(); x.setDate(d.getDate() - i); sum += p.xpByDay[today(x)] || 0; }
  return sum;
}
function xpOfWeek(p, monday) {
  let sum = 0; for (let i = 0; i < 7; i++) { const x = new Date(monday); x.setDate(x.getDate() + i); sum += p.xpByDay[today(x)] || 0; } return sum;
}

export function scheduleStatus(L) {
  const done = Object.keys(L.progress).length;
  const days = daysBetween(L.startDate, today());
  const expected = Math.min(TOTAL_WEEKS * 5, Math.floor((days * 5) / 7));
  return { done, expected, delta: done - expected };
}

// ---------- Ligues hebdomadaires ----------
export const LEAGUES = [
  { name: 'Bronze', icon: '🥉', up: 150 }, { name: 'Argent', icon: '🥈', up: 250, down: 60 },
  { name: 'Or', icon: '🥇', up: 350, down: 100 }, { name: 'Saphir', icon: '💠', up: 450, down: 150 },
  { name: 'Rubis', icon: '♦️', up: 550, down: 200 }, { name: 'Diamant', icon: '💎', down: 250 },
];
// À chaque nouvelle semaine : promotion / relégation selon l'XP de la semaine écoulée
export function rollLeague(p) {
  const wk = weekKey();
  if (p.league.week === wk) return null;
  const last = xpOfWeek(p, p.league.week);
  const L = LEAGUES[p.league.tier];
  let move = 0;
  if (L.up && last >= L.up) move = 1; else if (L.down && last < L.down) move = -1;
  p.league.history.push({ week: p.league.week, xp: last, tier: p.league.tier, move });
  p.league.tier = Math.max(0, Math.min(LEAGUES.length - 1, p.league.tier + move));
  p.league.week = wk;
  if (move > 0) { p.coins += 50; p.league.lastMove = { move, tier: p.league.tier, seen: false }; }
  else if (move < 0) p.league.lastMove = { move, tier: p.league.tier, seen: false };
  return move;
}

// ---------- Compteurs du jour & quêtes ----------
export function daily(p) { const t = today(); p.daily[t] ??= {}; return p.daily[t]; }
export function bump(p, key, n = 1) { const d = daily(p); d[key] = (d[key] || 0) + n; }
export function bumpMax(p, key, v) { const d = daily(p); d[key] = Math.max(d[key] || 0, v); }

const QUEST_POOL = [
  { id: 'xp', icon: '⭐', label: (n) => `Gagne ${n} XP`, key: 'xp', n: (p) => p.goal },
  { id: 'lesson', icon: '📘', label: (n) => `Termine ${n} leçon${n > 1 ? 's' : ''}`, key: 'lessons', n: () => 1 },
  { id: 'voice', icon: '🎙️', label: (n) => `Réponds ${n} fois à l’oral`, key: 'voice', n: () => 8 },
  { id: 'quiz', icon: '❓', label: (n) => `Réussis ${n} quiz`, key: 'quizOk', n: () => 4 },
  { id: 'cards', icon: '🃏', label: (n) => `Révise ${n} cartes`, key: 'cards', n: () => 10 },
  { id: 'combo', icon: '🔥', label: (n) => `Fais un combo de ${n}`, key: 'combo', n: () => 4 },
  { id: 'repeat', icon: '🗣️', label: (n) => `Réussis ${n} « répète après moi »`, key: 'repeatOk', n: () => 3 },
  { id: 'words', icon: '📚', label: (n) => `Apprends ${n} nouveaux mots`, key: 'words', n: () => 6 },
  { id: 'stars', icon: '🌟', label: (n) => `Gagne ${n} étoiles`, key: 'stars', n: () => 3 },
];
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); }

export function questsToday(p) {
  const t = today();
  if (!p.quests[t]) {
    const rnd = seeded(p.id + t);
    const pool = [...QUEST_POOL.slice(1)].sort(() => rnd() - 0.5);
    p.quests = { [t]: { ids: ['xp', pool[0].id, pool[1].id], claimed: [], chest: false } };
  }
  const q = p.quests[t]; const d = daily(p);
  return {
    chest: q.chest,
    list: q.ids.map((id) => {
      const def = QUEST_POOL.find((x) => x.id === id); const n = def.n(p); const v = Math.min(n, d[def.key] || 0);
      return { id, icon: def.icon, label: def.label(n), n, v, done: v >= n, claimed: q.claimed.includes(id), reward: 20 };
    }),
  };
}
export function claimQuest(p, id) {
  const q = p.quests[today()]; const qs = questsToday(p).list.find((x) => x.id === id);
  if (!qs || !qs.done || qs.claimed) return 0;
  q.claimed.push(id); p.coins += qs.reward; p.stats.questsDone++; save(); return qs.reward;
}
export function claimChest(p) {
  const q = p.quests[today()]; const all = questsToday(p).list.every((x) => x.claimed);
  if (!all || q.chest) return 0;
  q.chest = true; const c = 40 + Math.floor(Math.random() * 41); p.coins += c; p.stats.chests++;
  if (Math.random() < 0.3) p.streak.freezes = Math.min(3, p.streak.freezes + 1);
  save(); return c;
}

// ---------- Boutique ----------
export const SHOP = [
  { id: 'freeze', icon: '🧊', name: 'Gel de série', desc: 'Protège ta série un jour d’absence (max 3)', price: 60, consumable: true },
  { id: 'boost', icon: '⚡', name: 'Boost XP x2', desc: 'Double tous tes XP pendant 30 min', price: 90, consumable: true },
  { id: 'av_ninja', icon: '🥷', name: 'Avatar Ninja', price: 120, avatar: '🥷' },
  { id: 'av_robot', icon: '🤖', name: 'Avatar Robot', price: 120, avatar: '🤖' },
  { id: 'av_alien', icon: '👽', name: 'Avatar Alien', price: 150, avatar: '👽' },
  { id: 'av_dragon', icon: '🐉', name: 'Avatar Dragon', price: 200, avatar: '🐉' },
  { id: 'av_crown', icon: '🤴', name: 'Avatar Prince', price: 250, avatar: '🤴' },
  { id: 'av_goat', icon: '🐐', name: 'Avatar Légende', price: 400, avatar: '🐐' },
  { id: 'th_ocean', icon: '🌊', name: 'Thème Océan', price: 150, theme: 'ocean' },
  { id: 'th_forest', icon: '🌿', name: 'Thème Forêt', price: 150, theme: 'forest' },
  { id: 'th_sunset', icon: '🌅', name: 'Thème Coucher de soleil', price: 150, theme: 'sunset' },
  { id: 'th_gold', icon: '🏆', name: 'Thème Or', price: 300, theme: 'gold' },
];
export function buy(p, id) {
  const it = SHOP.find((x) => x.id === id);
  if (!it || p.coins < it.price) return 'Pas assez de pièces';
  if (it.id === 'freeze') { if (p.streak.freezes >= 3) return 'Tu as déjà 3 gels'; p.streak.freezes++; }
  else if (it.id === 'boost') p.boostUntil = Math.max(Date.now(), p.boostUntil) + 30 * 60e3;
  else { if (p.owned[id]) return 'Déjà acheté'; p.owned[id] = today(); }
  p.coins -= it.price; save(); return '';
}

// ---------- Badges ----------
export const BADGES = [
  { id: 'first', icon: '👣', name: 'Premier pas', desc: 'Terminer une première leçon', test: (p) => p.stats.lessons >= 1 },
  { id: 'lessons10', icon: '📘', name: 'Studieux', desc: '10 leçons terminées', test: (p) => p.stats.lessons >= 10 },
  { id: 'lessons50', icon: '📚', name: 'Bûcheur', desc: '50 leçons terminées', test: (p) => p.stats.lessons >= 50 },
  { id: 'streak3', icon: '🔥', name: 'En feu', desc: '3 jours d’affilée', test: (p) => p.streak.best >= 3 },
  { id: 'streak7', icon: '⚡', name: 'Semaine parfaite', desc: '7 jours d’affilée', test: (p) => p.streak.best >= 7 },
  { id: 'streak30', icon: '🌋', name: 'Inarrêtable', desc: '30 jours d’affilée', test: (p) => p.streak.best >= 30 },
  { id: 'perfect', icon: '💎', name: 'Sans faute', desc: '3 étoiles à une leçon', test: (p) => p.stats.perfect >= 1 },
  { id: 'perfect10', icon: '👑', name: 'Perfectionniste', desc: '10 leçons à 3 étoiles', test: (p) => p.stats.perfect >= 10 },
  { id: 'boss', icon: '🐉', name: 'Tueur de dragon', desc: 'Vaincre un Boss', test: (p) => p.stats.bosses >= 1 },
  { id: 'boss10', icon: '⚔️', name: 'Chasseur de Boss', desc: 'Vaincre 10 Boss', test: (p) => p.stats.bosses >= 10 },
  { id: 'combo5', icon: '🎯', name: 'Combo x5', desc: '5 bonnes réponses d’affilée', test: (p) => p.stats.bestCombo >= 5 },
  { id: 'combo10', icon: '🌪️', name: 'Combo x10', desc: '10 bonnes réponses d’affilée', test: (p) => p.stats.bestCombo >= 10 },
  { id: 'quiz50', icon: '🧠', name: 'Quiz master', desc: '50 quiz réussis', test: (p) => p.stats.quizOk >= 50 },
  { id: 'parrot', icon: '🦜', name: 'Perroquet', desc: '25 « répète après moi » réussis', test: (p) => p.stats.repeats >= 25 },
  { id: 'talker', icon: '🎙️', name: 'Bavard', desc: '100 réponses à l’oral', test: (p) => p.stats.voiceTurns >= 100 },
  { id: 'talker500', icon: '📣', name: 'Orateur', desc: '500 réponses à l’oral', test: (p) => p.stats.voiceTurns >= 500 },
  { id: 'words100', icon: '🗂️', name: 'Collectionneur', desc: '100 mots dans le carnet', test: (p) => p.deck.length >= 100 },
  { id: 'words300', icon: '📖', name: 'Dictionnaire vivant', desc: '300 mots dans le carnet', test: (p) => p.deck.length >= 300 },
  { id: 'master50', icon: '🐘', name: 'Mémoire d’éléphant', desc: '50 cartes maîtrisées', test: (p) => p.deck.filter((c) => c.box >= 5).length >= 50 },
  { id: 'quests10', icon: '📜', name: 'Aventurier', desc: '10 quêtes accomplies', test: (p) => p.stats.questsDone >= 10 },
  { id: 'chest10', icon: '🎁', name: 'Chasseur de trésors', desc: 'Ouvrir 10 coffres du jour', test: (p) => p.stats.chests >= 10 },
  { id: 'gold', icon: '🥇', name: 'Ligue Or', desc: 'Atteindre la ligue Or', test: (p) => p.league.tier >= 2 },
  { id: 'diamond', icon: '💎', name: 'Ligue Diamant', desc: 'Atteindre la ligue Diamant', test: (p) => p.league.tier >= 5 },
  { id: 'rich', icon: '💰', name: 'Fortune', desc: 'Posséder 500 pièces', test: (p) => p.coins >= 500 },
  { id: 'bilingual', icon: '🌍', name: 'Bilingue+', desc: 'Leçons en anglais ET en espagnol', test: (p) => Object.values(p.langs).filter((L) => Object.keys(L.progress).length).length >= 2 },
  { id: 'world1', icon: '🏝️', name: 'Explorateur d’îles', desc: 'Finir le monde 1 (semaine 4)', test: (p) => Object.values(p.langs).some((L) => L.progress[lessonId(4, 5)]) },
  { id: 'half', icon: '🏰', name: 'Mi-parcours', desc: 'Terminer la semaine 13', test: (p) => Object.values(p.langs).some((L) => L.progress[lessonId(13, 5)]) },
  { id: 'fluent', icon: '🎓', name: 'Fluent !', desc: 'Terminer les 26 semaines', test: (p) => Object.values(p.langs).some((L) => L.progress[lessonId(26, 5)]) },
  { id: 'early', icon: '🌅', name: 'Lève-tôt', desc: 'Une leçon avant 8 h', test: (p) => p.stats.early },
  { id: 'night', icon: '🦉', name: 'Oiseau de nuit', desc: 'Une leçon après 21 h', test: (p) => p.stats.night },
];

export function checkBadges(p) {
  const fresh = [];
  for (const b of BADGES) if (!p.badges[b.id] && b.test(p)) { p.badges[b.id] = today(); p.coins += 15; fresh.push(b); }
  if (fresh.length) save();
  return fresh;
}

// ---------- Sauvegarde / partage ----------
export function exportData(all = true) {
  const data = all ? { ...state, settings: { ...state.settings, geminiKey: '', claudeKey: '' } } : { profiles: [profile()] };
  return JSON.stringify({ app: 'fluentquest', v: 2, date: new Date().toISOString(), ...data }, null, 1);
}

export function importData(json) {
  const d = JSON.parse(json);
  if (d.app !== 'fluentquest') throw new Error('Fichier non reconnu');
  for (const p of d.profiles || []) {
    migrate(p);
    const i = state.profiles.findIndex((x) => x.id === p.id);
    if (i >= 0) state.profiles[i] = p; else state.profiles.push(p);
  }
  if (!state.activeId && state.profiles.length) state.activeId = state.profiles[0].id;
  save();
  return (d.profiles || []).length;
}

// migration des profils existants (après déclaration de toutes les fonctions)
state.profiles.forEach(migrate);
