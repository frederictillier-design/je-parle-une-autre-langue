// État local (localStorage) + gamification
import { DEFAULT_MODELS } from './ai.js';
import { LANGS, STARTER_DECK, AUDIENCES, defaultTarget, TOTAL_WEEKS, lessonId } from './curriculum.js';

const KEY = 'fluentquest.v1';

const defaults = () => ({
  settings: {
    provider: 'gemini', geminiKey: '', claudeKey: '',
    geminiModel: DEFAULT_MODELS.gemini, claudeModel: DEFAULT_MODELS.claude,
    micMode: 'auto', handsFree: false,
  },
  profiles: [],
  activeId: null,
  activeLang: 'en',
});

export const state = (() => {
  try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return defaults(); }
})();
state.settings = Object.assign(defaults().settings, state.settings);

export const save = () => localStorage.setItem(KEY, JSON.stringify(state));
export const profile = () => state.profiles.find((p) => p.id === state.activeId) || null;

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

export function newLangState(level, accent) {
  return { level, target: defaultTarget(level), accent, startDate: today(), progress: {}, rate: 1, voice: '' };
}

export function createProfile({ name, audience, avatar, about, langs }) {
  const p = {
    id: Math.random().toString(36).slice(2, 10), name, audience, avatar: avatar || '🦊', about: about || '',
    xp: 0, xpByDay: {}, streak: { count: 0, last: null, freezes: 0, best: 0 }, badges: {},
    goal: AUDIENCES[audience].goal, stats: { turns: 0, voiceTurns: 0, lessons: 0, perfect: 0 }, langs: {}, deck: [],
  };
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
  for (const [t, fr] of STARTER_DECK[lang]) addCard(p, lang, { target: t, fr, example: '' }, 'starter');
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

// ---------- XP, niveaux, séries ----------
export const LEVEL_TITLES = ['Curieux', 'Explorateur', 'Voyageur', 'Aventurier', 'Conteur', 'Orateur', 'Ambassadeur', 'Polyglotte', 'Maestro', 'Légende'];
export function levelInfo(xp) {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = 100 + (lvl - 1) * 50; }
  return { lvl, title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lvl - 1) / 3))], into: xp - acc, need };
}

export function addXP(p, n) {
  p.xp += n;
  const t = today();
  p.xpByDay[t] = (p.xpByDay[t] || 0) + n;
  touchStreak(p);
  save();
}

export function touchStreak(p) {
  const t = today(), s = p.streak;
  if (s.last === t) return;
  const gap = s.last ? daysBetween(s.last, t) : null;
  if (gap === 1) s.count++;
  else if (gap === 2 && s.freezes > 0) { s.freezes--; s.count++; }
  else s.count = 1;
  s.last = t;
  if (s.count % 7 === 0) s.freezes = Math.min(2, s.freezes + 1);
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

export function scheduleStatus(L) {
  const done = Object.keys(L.progress).length;
  const days = daysBetween(L.startDate, today());
  const expected = Math.min(TOTAL_WEEKS * 5, Math.floor((days * 5) / 7)); // 5 leçons / 7 jours
  return { done, expected, delta: done - expected };
}

// ---------- Badges ----------
export const BADGES = [
  { id: 'first', icon: '👣', name: 'Premier pas', desc: 'Terminer une première leçon', test: (p) => p.stats.lessons >= 1 },
  { id: 'streak3', icon: '🔥', name: 'En feu', desc: '3 jours d’affilée', test: (p) => p.streak.best >= 3 },
  { id: 'streak7', icon: '⚡', name: 'Semaine parfaite', desc: '7 jours d’affilée', test: (p) => p.streak.best >= 7 },
  { id: 'streak30', icon: '🌋', name: 'Inarrêtable', desc: '30 jours d’affilée', test: (p) => p.streak.best >= 30 },
  { id: 'perfect', icon: '💎', name: 'Sans faute', desc: '3 étoiles à une leçon', test: (p) => p.stats.perfect >= 1 },
  { id: 'perfect10', icon: '👑', name: 'Perfectionniste', desc: '10 leçons à 3 étoiles', test: (p) => p.stats.perfect >= 10 },
  { id: 'boss', icon: '🏆', name: 'Boss vaincu', desc: 'Réussir un défi de la semaine', test: (p) => anyDone(p, (id) => id.endsWith('d5')) },
  { id: 'talker', icon: '🎙️', name: 'Bavard', desc: '100 réponses à l’oral', test: (p) => p.stats.voiceTurns >= 100 },
  { id: 'talker500', icon: '📣', name: 'Orateur', desc: '500 réponses à l’oral', test: (p) => p.stats.voiceTurns >= 500 },
  { id: 'words100', icon: '📚', name: 'Collectionneur', desc: '100 mots dans le carnet', test: (p) => p.deck.length >= 100 },
  { id: 'words300', icon: '🧠', name: 'Dictionnaire vivant', desc: '300 mots dans le carnet', test: (p) => p.deck.length >= 300 },
  { id: 'master50', icon: '🎯', name: 'Mémoire d’éléphant', desc: '50 cartes maîtrisées (boîte 5)', test: (p) => p.deck.filter((c) => c.box >= 5).length >= 50 },
  { id: 'bilingual', icon: '🌍', name: 'Bilingue+', desc: 'Leçons en anglais ET en espagnol', test: (p) => Object.values(p.langs).filter((L) => Object.keys(L.progress).length).length >= 2 },
  { id: 'half', icon: '🏔️', name: 'Mi-parcours', desc: 'Terminer la semaine 13', test: (p) => Object.values(p.langs).some((L) => L.progress[lessonId(13, 5)]) },
  { id: 'fluent', icon: '🎓', name: 'Fluent !', desc: 'Terminer les 26 semaines', test: (p) => Object.values(p.langs).some((L) => L.progress[lessonId(26, 5)]) },
  { id: 'early', icon: '🌅', name: 'Lève-tôt', desc: 'Une leçon avant 8 h', test: (p) => p.stats.early },
  { id: 'night', icon: '🦉', name: 'Oiseau de nuit', desc: 'Une leçon après 21 h', test: (p) => p.stats.night },
];
const anyDone = (p, f) => Object.values(p.langs).some((L) => Object.keys(L.progress).some(f));

export function checkBadges(p) {
  const fresh = [];
  for (const b of BADGES) if (!p.badges[b.id] && b.test(p)) { p.badges[b.id] = today(); fresh.push(b); }
  if (fresh.length) save();
  return fresh;
}

// ---------- Sauvegarde / partage ----------
export function exportData(all = true) {
  const data = all ? { ...state, settings: { ...state.settings, geminiKey: '', claudeKey: '' } } : { profiles: [profile()] };
  return JSON.stringify({ app: 'fluentquest', v: 1, date: new Date().toISOString(), ...data }, null, 1);
}

export function importData(json) {
  const d = JSON.parse(json);
  if (d.app !== 'fluentquest') throw new Error('Fichier non reconnu');
  for (const p of d.profiles || []) {
    const i = state.profiles.findIndex((x) => x.id === p.id);
    if (i >= 0) state.profiles[i] = p; else state.profiles.push(p);
  }
  if (!state.activeId && state.profiles.length) state.activeId = state.profiles[0].id;
  save();
  return (d.profiles || []).length;
}
