import * as C from './curriculum.js';
import * as AI from './ai.js';
import * as SP from './speech.js';
import * as ST from './store.js';

const { state, save } = ST;
const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐲', '🚴', '🚀', '🎸', '⚡'];
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

document.addEventListener('pointerdown', SP.unlockAudio, { once: true });

// ---------- UI helpers ----------
export function toast(msg, ms = 2600) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}
function modal(html, { onClose } = {}) {
  const m = document.createElement('div');
  m.className = 'modal-back';
  m.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); onClose && onClose(); };
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
  return { el: m, close };
}
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff'];
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = Math.random() * 0.6 + 's';
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3500);
}
function floatXP(n) {
  const f = document.createElement('div'); f.className = 'xp-float'; f.textContent = `+${n} XP`;
  document.body.appendChild(f); setTimeout(() => f.remove(), 1400);
}
function announceBadges(p) {
  ST.checkBadges(p).forEach((b, i) => setTimeout(() => toast(`<b>${b.icon} Badge débloqué !</b><br>${esc(b.name)}`, 3500), 600 + i * 900));
}
const bcp = (p, lang) => p.langs[lang].accent;
const voiceOpts = (p, lang, slow) => ({ rate: (p.langs[lang].rate || 1) * (slow ? 0.7 : 1), voiceName: p.langs[lang].voice });

// ---------- Router ----------
const views = {};
export function go(view, params = {}) {
  SP.stopSpeaking();
  if (lesson && view !== 'lesson') stopMic();
  window.scrollTo(0, 0);
  views[view](params);
}

function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const p = ST.profile();
  if (!p) return go('onboarding');
  if (!p.langs[state.activeLang]) state.activeLang = Object.keys(p.langs)[0];
  go('home');
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

// ---------- Onboarding / profil ----------
views.onboarding = ({ edit } = {}) => {
  const first = !state.profiles.length;
  app.innerHTML = `
  <div class="page narrow">
    ${first ? `<div class="brand-hero"><div class="logo">🗣️</div><h1>FluentQuest</h1><p>Ton coach d’anglais & d’espagnol, à l’oral, avec l’IA.<br>6 mois pour devenir <b>fluent</b>.</p></div>` : `<button class="back" data-go="family">← Retour</button><h2>Nouveau profil</h2>`}
    <form id="ob" class="card form">
      <label>Prénom<input name="name" required maxlength="20" placeholder="ex. Pol"></label>
      <div class="field"><span>Avatar</span><div class="avatars">${AVATARS.map((a, i) => `<label class="av"><input type="radio" name="avatar" value="${a}" ${i === 0 ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div></div>
      <div class="field"><span>Profil</span><div class="seg">
        <label><input type="radio" name="audience" value="ado" checked><span>🎒 Ado</span></label>
        <label><input type="radio" name="audience" value="adulte"><span>💼 Adulte</span></label></div></div>
      <label>À propos de moi <small>(optionnel — l’IA s’en sert pour personnaliser les conversations)</small>
        <textarea name="about" rows="2" placeholder="ex. 14 ans, en 3e, je fais du vélo de route, j’aime les séries…"></textarea></label>
      ${Object.entries(C.LANGS).map(([code, L]) => `
        <div class="lang-pick">
          <label class="chk"><input type="checkbox" name="lang_${code}" checked> ${L.flag} ${L.name}</label>
          <select name="lvl_${code}">
            ${C.LEVELS.map((l) => `<option value="${l.id}" ${l.id === 'A2' ? 'selected' : ''}>${l.id} — ${esc(l.fr)}</option>`).join('')}
            <option value="test">🎯 Je ne sais pas → test oral avec l’IA</option>
          </select>
        </div>`).join('')}
      <button class="btn primary big">C’est parti 🚀</button>
    </form>
  </div>`;
  bindGo();
  $('#ob').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const langs = {}, tests = [];
    for (const code of Object.keys(C.LANGS)) if (f.get('lang_' + code)) {
      const v = f.get('lvl_' + code); langs[code] = v === 'test' ? 'A2' : v; if (v === 'test') tests.push(code);
    }
    if (!Object.keys(langs).length) return toast('Choisis au moins une langue');
    const p = ST.createProfile({ name: f.get('name').trim(), audience: f.get('audience'), avatar: f.get('avatar'), about: f.get('about').trim(), langs });
    if (tests.length) p.pendingTests = tests;
    save();
    if (!AI.aiReady(state.settings)) go('settings', { welcome: true });
    else go('home');
  };
};

// ---------- Accueil ----------
views.home = () => {
  const p = ST.profile(); const lang = state.activeLang; const L = p.langs[lang];
  const li = ST.levelInfo(p.xp); const streak = ST.streakAlive(p); const xpT = ST.xpToday(p);
  const next = C.nextLesson(L); const sched = ST.scheduleStatus(L);
  const due = ST.dueCards(p, lang).length;
  const pct = Math.min(100, Math.round((xpT / p.goal) * 100));
  const curWeek = next ? next.w : C.TOTAL_WEEKS;
  const plan = next && C.weekPlan(p, lang, next.w);
  const s = next && C.SESSIONS[next.d - 1];
  const showInstall = !isStandalone;

  app.innerHTML = `
  <header class="top">
    <button class="avatar-btn" data-go="family" title="Profils">${p.avatar}</button>
    <div class="who"><b>${esc(p.name)}</b><small>Niv. ${li.lvl} · ${li.title}</small>
      <div class="bar"><i style="width:${(li.into / li.need) * 100}%"></i></div></div>
    <div class="pill fire ${streak ? '' : 'off'}" title="Série de jours">🔥 ${streak}${p.streak.freezes ? `<sup>🧊${p.streak.freezes}</sup>` : ''}</div>
    <button class="icon-btn" data-go="settings" title="Réglages">⚙️</button>
  </header>
  <div class="page">
    <nav class="lang-tabs">${Object.keys(p.langs).map((c) => `<button data-lang="${c}" class="${c === lang ? 'on' : ''}">${C.LANGS[c].flag} ${C.LANGS[c].name} <small>${p.langs[c].level}→${p.langs[c].target}</small></button>`).join('')}</nav>

    ${p.pendingTests?.includes(lang) ? `<div class="card notice">🎯 Ton niveau en ${C.LANGS[lang].name.toLowerCase()} n’est pas encore évalué. <button class="btn small primary" id="placement">Faire le test oral (5 min)</button></div>` : ''}

    <section class="hero card">
      <div class="ring" style="--p:${pct}"><div><b>${xpT}</b><small>/ ${p.goal} XP</small></div></div>
      <div class="hero-main">
        ${next ? `<small class="muted">Semaine ${next.w}/26 · Leçon ${next.d}/5 · cible ${plan.level}</small>
        <h2>${s.icon} ${s.name}</h2>
        <p>${esc(plan.theme.fr)} <span class="muted">· ${esc(plan.grammar.g)}</span></p>
        <button class="btn primary big" id="startNext">▶︎ Leçon du jour</button>`
        : `<h2>🎓 Programme terminé !</h2><p>Bravo ! Continue en conversation libre pour entretenir ta fluidité.</p>`}
        <p class="sched ${sched.delta >= 0 ? 'ok' : 'late'}">${sched.delta >= 0 ? `✅ Dans les temps${sched.delta > 0 ? ` (+${sched.delta} d’avance)` : ''}` : `⏳ ${-sched.delta} leçon(s) de retard sur le planning 6 mois`}</p>
      </div>
    </section>

    <section class="quick">
      <button data-go="review" class="tile"><span>🃏</span>Révision<small>${due} carte${due > 1 ? 's' : ''} à revoir</small></button>
      <button data-go="pronounce" class="tile"><span>🎙️</span>Prononciation<small>répète & score</small></button>
      <button id="free" class="tile"><span>💬</span>Conversation libre<small>sujet au choix</small></button>
      <button data-go="badges" class="tile"><span>🏅</span>Badges<small>${Object.keys(p.badges).length}/${ST.BADGES.length}</small></button>
      <button data-go="family" class="tile"><span>👨‍👦</span>Famille<small>duel de la semaine</small></button>
      ${showInstall ? `<button id="install" class="tile"><span>📲</span>Installer<small>iPhone / PC</small></button>` : ''}
    </section>

    <h3 class="sec-title">Mon parcours — 26 semaines</h3>
    <section class="path">
      ${Array.from({ length: C.TOTAL_WEEKS }, (_, i) => i + 1).map((w) => weekCard(p, lang, w, w === curWeek)).join('')}
    </section>
  </div>`;
  bindGo();
  $$('[data-lang]').forEach((b) => (b.onclick = () => { state.activeLang = b.dataset.lang; save(); go('home'); }));
  $('#startNext') && ($('#startNext').onclick = () => startLesson({ mode: 'lesson', w: next.w, d: next.d }));
  $('#placement') && ($('#placement').onclick = () => startLesson({ mode: 'placement' }));
  $('#free').onclick = freeTopicPicker;
  $('#install') && ($('#install').onclick = installHelp);
  $$('.week > summary').forEach((s) => s.addEventListener('click', () => {}));
  $$('[data-lesson]').forEach((b) => (b.onclick = () => {
    const [w, d] = b.dataset.lesson.split('-').map(Number);
    if (!C.isUnlocked(L, w, d)) return toast('🔒 Termine d’abord les leçons précédentes');
    startLesson({ mode: 'lesson', w, d });
  }));
  const cur = $('.week.current'); if (cur) cur.open = true;
};

function weekCard(p, lang, w, current) {
  const L = p.langs[lang]; const plan = C.weekPlan(p, lang, w);
  const doneN = C.SESSIONS.filter((s) => L.progress[C.lessonId(w, s.d)]).length;
  const stars = C.SESSIONS.reduce((a, s) => a + (L.progress[C.lessonId(w, s.d)]?.stars || 0), 0);
  return `<details class="week ${current ? 'current' : ''} ${doneN === 5 ? 'done' : ''} ${plan.theme.review ? 'review' : ''}">
    <summary><span class="wnum">${doneN === 5 ? '✓' : w}</span>
      <span class="wtitle"><b>${esc(plan.theme.fr)}</b><small>${esc(plan.grammar.g)} · ${plan.level}</small></span>
      <span class="wstars">⭐ ${stars}/15</span></summary>
    <div class="nodes">${C.SESSIONS.map((s) => {
      const pr = L.progress[C.lessonId(w, s.d)]; const unl = C.isUnlocked(L, w, s.d);
      return `<button class="node ${pr ? 'done' : ''} ${unl ? '' : 'locked'}" data-lesson="${w}-${s.d}">
        <span class="ni">${unl ? s.icon : '🔒'}</span><span class="nn">${s.name}</span>
        <span class="ns">${pr ? '★'.repeat(pr.stars) + '☆'.repeat(3 - pr.stars) : ''}</span></button>`;
    }).join('')}</div>
    <p class="muted small">Week-end : révision des cartes 🃏 et prononciation 🎙️</p>
  </details>`;
}

function bindGo() { $$('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go))); }

function installHelp() {
  if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; return; }
  modal(`<h3>📲 Installer FluentQuest</h3>
    <p><b>iPhone / iPad (Safari)</b> : bouton <b>Partager</b> <span class="kbd">⬆︎</span> → <b>Sur l’écran d’accueil</b>.</p>
    <p><b>PC (Chrome / Edge)</b> : icône <b>Installer</b> ⊕ à droite de la barre d’adresse (ou menu ⋮ → Installer FluentQuest).</p>
    <p><b>Mac (Safari)</b> : Fichier → <b>Ajouter au Dock</b>.</p>
    <button class="btn primary" data-close>OK</button>`);
}

function freeTopicPicker() {
  const p = ST.profile();
  const ideas = p.audience === 'ado'
    ? ['Mon week-end', 'Le vélo', 'Une série que j’adore', 'Mes amis', 'Un voyage de rêve', 'Les jeux vidéo', 'Le lycée l’an prochain']
    : ['Mon métier', 'L’IA au travail', 'Le cyclisme', 'L’actualité', 'Voyages', 'Leadership', 'Un livre / film récent'];
  const m = modal(`<h3>💬 Conversation libre</h3><p class="muted">Choisis un sujet ou écris le tien :</p>
    <div class="chips">${ideas.map((i) => `<button class="chip" data-t="${esc(i)}">${esc(i)}</button>`).join('')}</div>
    <input id="topic" placeholder="Autre sujet…"><div class="row"><button class="btn" data-close>Annuler</button><button class="btn primary" id="goFree">Discuter</button></div>`);
  $$('.chip', m.el).forEach((c) => (c.onclick = () => { m.close(); startLesson({ mode: 'free', topic: c.dataset.t }); }));
  $('#goFree', m.el).onclick = () => { const t = $('#topic', m.el).value.trim(); m.close(); startLesson({ mode: 'free', topic: t }); };
}

// ---------- Leçon (conversation orale) ----------
let lesson = null;
let micStop = null, recorder = null, srBroken = false;

function startLesson(opts) {
  if (!AI.aiReady(state.settings)) { toast('Configure d’abord une clé API Gemini ou Claude'); return go('settings'); }
  const p = ST.profile(); const lang = state.activeLang;
  let system, title;
  if (opts.mode === 'lesson') {
    system = AI.lessonSystemPrompt(p, lang, opts.w, opts.d);
    const s = C.SESSIONS[opts.d - 1];
    title = `${s.icon} S${opts.w} · ${s.name}`;
  } else if (opts.mode === 'placement') { system = AI.placementSystemPrompt(p, lang); title = '🎯 Test de niveau'; }
  else { system = AI.freeSystemPrompt(p, lang, opts.topic); title = `💬 ${opts.topic || 'Conversation libre'}`; }
  lesson = { ...opts, lang, system, title, messages: [], turns: 0, scores: [], xp: 0, newWords: 0, boardCount: 0, busy: false, done: false, startedAt: new Date() };
  go('lesson');
  aiTurn('[START]');
}

views.lesson = () => {
  const p = ST.profile(); const lang = lesson.lang;
  app.innerHTML = `
  <div class="lesson">
    <header class="lesson-top">
      <button class="icon-btn" id="quit" title="Quitter">✕</button>
      <div class="lt"><b>${esc(lesson.title)}</b><div class="turns" id="turns"></div></div>
      <button class="icon-btn" id="endBtn" title="Terminer la leçon">🏁</button>
      <button class="icon-btn board-toggle" id="boardBtn" title="Tableau">📋<sup id="boardN"></sup></button>
    </header>
    <div class="lesson-body">
      <div id="chat" class="chat"></div>
      <aside id="board" class="board"><div class="board-head"><b>📋 Tableau</b><button class="icon-btn" id="boardClose">✕</button></div><div id="boardContent"><p class="muted">Le vocabulaire et les règles apparaîtront ici.</p></div></aside>
    </div>
    <div id="chips" class="chips sugg"></div>
    <footer class="composer">
      <button id="mic" class="mic" aria-label="Parler">🎙️</button>
      <input id="txt" placeholder="Parle (🎙️) ou écris en ${C.LANGS[lang].native}…" autocomplete="off" autocapitalize="off" enterkeyhint="send" lang="${bcp(p, lang)}">
      <button id="send" class="send" aria-label="Envoyer">➤</button>
    </footer>
  </div>`;
  $('#quit').onclick = () => {
    if (lesson.done || lesson.turns === 0 || confirm('Quitter la leçon ? Elle ne sera pas validée (les XP gagnés sont conservés).')) { lesson = null; go('home'); }
  };
  $('#endBtn').onclick = () => {
    if (lesson.busy || lesson.done) return;
    if (lesson.turns < 3) return toast('Encore quelques échanges avant de terminer 😉');
    aiTurn('[END] Please wrap up the lesson now.');
  };
  $('#boardBtn').onclick = () => { $('#board').classList.toggle('open'); $('#boardN').textContent = ''; };
  $('#boardClose').onclick = () => $('#board').classList.remove('open');
  $('#send').onclick = () => sendText();
  $('#txt').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendText(); });
  $('#mic').onclick = toggleMic;
  renderTurns();
};

function renderTurns() {
  const el = $('#turns'); if (!el) return;
  const max = lesson.mode === 'free' ? 10 : 8;
  el.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < lesson.turns ? (lesson.scores[i] >= 2 ? 'g' : lesson.scores[i] === 1 ? 'o' : 'r') : ''}"></i>`).join('');
}

function sendText(viaVoice = false) {
  const inp = $('#txt'); const t = inp.value.trim();
  if (!t || lesson.busy || lesson.done) return;
  inp.value = '';
  addLearnerBubble(t, viaVoice);
  lesson.turns++;
  const p = ST.profile(); p.stats.turns++; if (viaVoice) p.stats.voiceTurns++;
  const force = lesson.turns >= (lesson.mode === 'free' ? 12 : 11);
  aiTurn(force ? `${t}\n\n[END] (time is up: wrap up the lesson now)` : t);
}

function addLearnerBubble(text, viaVoice) {
  const b = document.createElement('div');
  b.className = 'bubble me'; b.innerHTML = `<div class="txt">${viaVoice ? '🎙️ ' : ''}${esc(text)}</div>`;
  $('#chat').appendChild(b); scrollChat();
  lesson.lastMe = b;
}

function addTutorBubble(r) {
  const p = ST.profile(); const lang = lesson.lang;
  const b = document.createElement('div');
  b.className = 'bubble tutor';
  b.innerHTML = `<div class="who">${C.LANGS[lang].flag} ${C.LANGS[lang].tutor[p.audience]}</div>
    <div class="txt">${esc(r.reply)}</div>
    ${r.translation_fr ? `<div class="fr hidden">${esc(r.translation_fr)}</div>` : ''}
    <div class="tools"><button data-a="play">🔊</button><button data-a="slow">🐢</button>${r.translation_fr ? '<button data-a="fr">FR</button>' : ''}</div>`;
  b.querySelector('[data-a=play]').onclick = () => SP.speak(r.reply, bcp(p, lang), voiceOpts(p, lang));
  b.querySelector('[data-a=slow]').onclick = () => SP.speak(r.reply, bcp(p, lang), voiceOpts(p, lang, true));
  const fr = b.querySelector('[data-a=fr]'); if (fr) fr.onclick = () => b.querySelector('.fr').classList.toggle('hidden');
  $('#chat').appendChild(b); scrollChat();
}

function typing(on) {
  let t = $('#typing');
  if (on && !t) { t = document.createElement('div'); t.id = 'typing'; t.className = 'bubble tutor typing'; t.innerHTML = '<span></span><span></span><span></span>'; $('#chat').appendChild(t); scrollChat(); }
  if (!on && t) t.remove();
}
const scrollChat = () => { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; };

async function aiTurn(userContent) {
  const L = lesson; L.busy = true; typing(true); $('#chips').innerHTML = '';
  L.messages.push({ role: 'user', content: userContent });
  let r;
  try { r = await AI.chat(state.settings, L.system, L.messages); }
  catch (e) {
    typing(false); L.busy = false; L.messages.pop();
    const retry = document.createElement('div'); retry.className = 'bubble error';
    retry.innerHTML = `⚠️ ${esc(e.message)}<br><button class="btn small">Réessayer</button>`;
    retry.querySelector('button').onclick = () => { retry.remove(); aiTurn(userContent); };
    $('#chat').appendChild(retry); scrollChat();
    return;
  }
  if (lesson !== L) return; // leçon quittée entre-temps
  typing(false); L.busy = false;
  r.reply = r.reply || '…';
  L.messages.push({ role: 'assistant', content: JSON.stringify(r) });
  const p = ST.profile();

  // feedback sur la réponse de l'apprenant
  if (L.turns > 0 && !userContent.startsWith('[END]')) {
    const sc = Math.max(0, Math.min(3, Number(r.score) || 0));
    L.scores[L.turns - 1] = sc;
    const gain = 5 + sc * 5; L.xp += gain; ST.addXP(p, gain); floatXP(gain);
    if (L.lastMe && r.feedback && (r.feedback.correction || r.feedback.tip_fr)) {
      const f = document.createElement('div');
      f.className = 'fb ' + (r.feedback.ok ? 'ok' : 'fix');
      f.innerHTML = `${r.feedback.correction && !r.feedback.ok ? `✏️ <b>${esc(r.feedback.correction)}</b>` : r.feedback.ok ? '✅ Bien dit !' : ''}${r.feedback.tip_fr ? `<div class="tip">💡 ${esc(r.feedback.tip_fr)}</div>` : ''}`;
      L.lastMe.appendChild(f);
    } else if (L.lastMe && sc >= 2) {
      L.lastMe.insertAdjacentHTML('beforeend', '<div class="fb ok">✅ Bien dit !</div>');
    }
    renderTurns();
  }
  addTutorBubble(r);
  addBoard(r.board);
  if (r.suggestions?.length && !r.lesson_complete) {
    $('#chips').innerHTML = `<span class="muted small">Idées :</span>` + r.suggestions.slice(0, 3).map((s) => `<button class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join('');
    $$('#chips .chip').forEach((c) => (c.onclick = () => SP.speak(c.dataset.s, bcp(p, L.lang), voiceOpts(p, L.lang))));
  }
  SP.speak(r.reply, bcp(p, L.lang), {
    ...voiceOpts(p, L.lang),
    onend: () => { if (lesson === L && !L.done && state.settings.handsFree && !micStop && !recorder) toggleMic(); },
  });
  save();
  if (r.lesson_complete) finishLesson(r);
}

function addBoard(board) {
  if (!board || !board.items?.length) return;
  const p = ST.profile(); const lang = lesson.lang;
  const box = $('#boardContent');
  if (!lesson.boardCount) box.innerHTML = '';
  const sec = document.createElement('div'); sec.className = 'board-sec';
  sec.innerHTML = (board.title ? `<h4>${esc(board.title)}</h4>` : '') + board.items.map((it) => {
    if (it.type === 'rule') return `<div class="rule">${esc(it.text).replace(/\n/g, '<br>')}</div>`;
    const added = ST.addCard(p, lang, it); if (added) lesson.newWords++;
    return `<div class="vocab"><button class="say" data-say="${esc(it.target)}">🔊</button><div><b>${esc(it.target)}</b> <span class="muted">— ${esc(it.fr)}</span>${it.example ? `<div class="ex"><i>${esc(it.example)}</i> <button class="say mini" data-say="${esc(it.example)}">🔊</button></div>` : ''}</div></div>`;
  }).join('');
  box.appendChild(sec);
  $$('[data-say]', sec).forEach((b) => (b.onclick = () => SP.speak(b.dataset.say, bcp(p, lang), voiceOpts(p, lang))));
  lesson.boardCount += board.items.length;
  if (!$('#board').classList.contains('open')) $('#boardN').textContent = lesson.boardCount;
  box.scrollTop = box.scrollHeight;
  save();
}

function finishLesson(r) {
  const L = lesson; L.done = true; stopMic();
  const p = ST.profile(); const lang = L.lang; const Lg = p.langs[lang];
  const sc = L.scores.filter((x) => x !== undefined);
  const avg = sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : 0;
  const stars = avg >= 2.4 ? 3 : avg >= 1.6 ? 2 : 1;
  let bonus = 30;
  if (L.mode === 'lesson') {
    if (L.d === 5) bonus += 50;
    if (stars === 3) bonus += 20;
    const id = C.lessonId(L.w, L.d); const prev = Lg.progress[id];
    Lg.progress[id] = { stars: Math.max(stars, prev?.stars || 0), date: ST.today(), avg: Math.round(avg * 100) / 100 };
    p.stats.lessons++; if (stars === 3) p.stats.perfect++;
  }
  if (L.mode === 'placement' && /^(A1|A2|B1|B2|C1)$/.test(r.level || '')) {
    Lg.level = r.level; Lg.target = C.defaultTarget(r.level);
    p.pendingTests = (p.pendingTests || []).filter((x) => x !== lang);
  }
  const h = new Date().getHours(); if (h < 8) p.stats.early = true; if (h >= 21) p.stats.night = true;
  ST.addXP(p, bonus); L.xp += bonus;
  save();
  confetti();
  setTimeout(() => {
    const m = modal(`<div class="end">
      <div class="stars">${L.mode === 'placement' ? '🎯' : '★'.repeat(stars) + '<span class="off">' + '☆'.repeat(3 - stars) + '</span>'}</div>
      <h2>${L.mode === 'placement' ? `Niveau estimé : ${esc(r.level || '?')}` : stars === 3 ? 'Excellent !' : stars === 2 ? 'Bien joué !' : 'Leçon terminée !'}</h2>
      ${L.mode === 'placement' ? `<p>Objectif dans 6 mois : <b>${Lg.target}</b> (modifiable dans les réglages).</p>` : ''}
      <div class="end-stats"><div><b>+${L.xp}</b><small>XP</small></div><div><b>${L.turns}</b><small>réponses</small></div><div><b>+${L.newWords}</b><small>mots au carnet</small></div></div>
      ${r.summary_fr ? `<div class="summary">${esc(r.summary_fr).replace(/\n/g, '<br>')}</div>` : ''}
      <button class="btn primary big" data-close>Continuer</button></div>`, { onClose: () => { lesson = null; go('home'); } });
    announceBadges(p);
  }, 1200);
}

// ---------- Micro ----------
function micMode() {
  const s = state.settings.micMode;
  if (s === 'browser') return SP.srSupported() ? 'sr' : 'kbd';
  if (s === 'gemini') return SP.recSupported() && state.settings.geminiKey ? 'rec' : 'kbd';
  if (s === 'keyboard') return 'kbd';
  if (SP.srSupported() && !srBroken) return 'sr';
  if (SP.recSupported() && state.settings.geminiKey) return 'rec';
  return 'kbd';
}

function stopMic() {
  if (micStop) { micStop(); micStop = null; }
  if (recorder) { const r = recorder; recorder = null; finishRecording(r); }
}

async function toggleMic() {
  if (!lesson || lesson.done) return;
  const btn = $('#mic');
  if (micStop || recorder) return stopMic();
  if (lesson.busy) return toast('Attends la réponse du coach…');
  SP.stopSpeaking();
  const mode = micMode();
  const p = ST.profile(); const lang = lesson.lang;
  if (mode === 'kbd') {
    $('#txt').focus();
    return toast(isIOS ? 'Utilise la dictée 🎤 du clavier iPhone (choisis la langue avec 🌐)' : 'Micro indisponible : écris ta réponse');
  }
  if (mode === 'sr') {
    btn.classList.add('on'); $('#txt').placeholder = '🎙️ Je t’écoute… (touche pour finir)';
    let got = '';
    micStop = SP.listen(bcp(p, lang), {
      onInterim: (t) => { got = t; $('#txt').value = t; },
      onError: (err) => {
        if (['not-allowed', 'service-not-allowed', 'network', 'audio-capture', 'language-not-supported'].includes(err)) {
          srBroken = true;
          toast(state.settings.geminiKey ? 'Reconnaissance du navigateur indisponible → bascule sur la transcription Gemini' : 'Micro du navigateur indisponible : utilise la dictée du clavier');
        }
      },
      onEnd: () => {
        micStop = null; btn.classList.remove('on'); $('#txt').placeholder = 'Parle (🎙️) ou écris…';
        if ($('#txt').value.trim() || got) { if (!$('#txt').value.trim()) $('#txt').value = got; sendText(true); }
      },
    });
    return;
  }
  // mode enregistrement + transcription Gemini
  try {
    recorder = await SP.startRecording();
    btn.classList.add('on', 'rec'); $('#txt').placeholder = '⏺ Enregistrement… touche pour envoyer';
  } catch (e) { recorder = null; toast('Micro refusé : ' + esc(e.message)); }
}

async function finishRecording(r) {
  const btn = $('#mic'); btn && btn.classList.remove('on', 'rec');
  const inp = $('#txt'); if (inp) inp.placeholder = '✍️ Transcription…';
  try {
    const b64 = await r.stop();
    const text = await AI.transcribe(state.settings, b64, lesson.lang);
    if (inp) { inp.value = text; inp.placeholder = 'Parle (🎙️) ou écris…'; }
    if (text) sendText(true);
  } catch (e) { toast('Transcription impossible : ' + esc(e.message)); if (inp) inp.placeholder = 'Parle (🎙️) ou écris…'; }
}

// ---------- Révision (cartes) ----------
views.review = ({ all } = {}) => {
  const p = ST.profile(); const lang = state.activeLang;
  let cards = ST.dueCards(p, lang);
  if (all || !cards.length) cards = all ? p.deck.filter((c) => c.lang === lang).sort(() => Math.random() - 0.5).slice(0, 10) : [];
  cards = cards.sort(() => Math.random() - 0.5).slice(0, 20);
  let i = 0, ok = 0;
  const draw = () => {
    if (!cards.length) {
      app.innerHTML = `<div class="page narrow"><button class="back" data-go="home">← Accueil</button>
      <div class="card center"><div class="big-emoji">🎉</div><h2>Rien à réviser aujourd’hui</h2><p class="muted">${p.deck.filter((c) => c.lang === lang).length} cartes dans ton carnet.</p>
      <button class="btn primary" id="anyway">Réviser 10 cartes quand même</button></div></div>`;
      bindGo(); $('#anyway').onclick = () => go('review', { all: true }); return;
    }
    if (i >= cards.length) {
      const gain = ok * 2 + 10; ST.addXP(p, gain); confetti(); announceBadges(p);
      app.innerHTML = `<div class="page narrow"><div class="card center"><div class="big-emoji">🧠</div><h2>Révision terminée</h2>
        <p>${ok}/${cards.length} réussies · <b>+${gain} XP</b></p><button class="btn primary" data-go="home">Accueil</button></div></div>`;
      return bindGo();
    }
    const c = cards[i];
    app.innerHTML = `<div class="page narrow"><button class="back" data-go="home">← Accueil</button>
      <div class="progress"><i style="width:${(i / cards.length) * 100}%"></i></div>
      <div class="flash" id="flash"><div class="front"><div class="box">Boîte ${c.box}/5</div><h2>${esc(c.target)}</h2><button class="btn" id="say">🔊 Écouter</button><p class="muted">Touche la carte pour voir la traduction</p></div>
        <div class="back-side hidden"><h3>${esc(c.fr)}</h3>${c.example ? `<p><i>${esc(c.example)}</i></p>` : ''}</div></div>
      <div class="row hidden" id="answer"><button class="btn bad" id="no">😕 À revoir</button><button class="btn good" id="yes">😎 Je savais</button></div></div>`;
    bindGo();
    const speakC = () => SP.speak(c.target, bcp(p, lang), voiceOpts(p, lang));
    $('#say').onclick = (e) => { e.stopPropagation(); speakC(); };
    speakC();
    $('#flash').onclick = () => { $('.back-side').classList.remove('hidden'); $('#answer').classList.remove('hidden'); };
    $('#no').onclick = () => { ST.reviewCard(c, false); save(); i++; draw(); };
    $('#yes').onclick = () => { ST.reviewCard(c, true); ok++; save(); i++; draw(); };
  };
  draw();
};

// ---------- Prononciation ----------
views.pronounce = () => {
  const p = ST.profile(); const lang = state.activeLang;
  const pool = p.deck.filter((c) => c.lang === lang).flatMap((c) => [c.example, c.target]).filter((t) => t && t.split(' ').length >= 3);
  let sentence = pool[Math.floor(Math.random() * pool.length)] || C.STARTER_DECK[lang][0][0];
  let total = 0, n = 0;
  const draw = (result) => {
    app.innerHTML = `<div class="page narrow"><button class="back" data-go="home">← Accueil</button>
      <h2>🎙️ Prononciation ${C.LANGS[lang].flag}</h2>
      <div class="card center"><p class="muted">Écoute, puis répète :</p><h2 class="target">${esc(sentence)}</h2>
        <div class="row"><button class="btn" id="listen">🔊 Écouter</button><button class="btn" id="slow">🐢 Lent</button></div>
        <button class="mic big" id="pmic">🎙️</button>
        <div id="pres">${result || ''}</div>
        <button class="btn" id="nextS">Phrase suivante ➜</button></div>
      <p class="muted small center">Session : ${n} phrase(s)${n ? ` · moyenne ${Math.round((total / n) * 100)} %` : ''}</p></div>`;
    bindGo();
    $('#listen').onclick = () => SP.speak(sentence, bcp(p, lang), voiceOpts(p, lang));
    $('#slow').onclick = () => SP.speak(sentence, bcp(p, lang), voiceOpts(p, lang, true));
    $('#nextS').onclick = () => { sentence = pool[Math.floor(Math.random() * pool.length)] || sentence; draw(); };
    $('#pmic').onclick = async () => {
      const btn = $('#pmic');
      const evaluate = (said) => {
        const sim = SP.similarity(sentence, said); total += sim; n++;
        const st = sim >= 0.9 ? 3 : sim >= 0.7 ? 2 : sim >= 0.4 ? 1 : 0;
        if (st >= 2) { ST.addXP(p, st * 2); floatXP(st * 2); }
        draw(`<div class="pres"><div class="stars">${'★'.repeat(st)}<span class="off">${'☆'.repeat(3 - st)}</span></div><p>Compris : « ${esc(said || '…')} »</p><b>${Math.round(sim * 100)} %</b></div>`);
      };
      if (SP.srSupported() && !srBroken && state.settings.micMode !== 'gemini') {
        btn.classList.add('on'); let got = '';
        const stop = SP.listen(bcp(p, lang), { onInterim: (t) => (got = t), onError: (e) => { if (e === 'not-allowed' || e === 'service-not-allowed') srBroken = true; }, onEnd: () => { btn.classList.remove('on'); evaluate(got); } });
        btn.onclick = () => stop();
      } else if (SP.recSupported() && state.settings.geminiKey) {
        const rec = await SP.startRecording(); btn.classList.add('on', 'rec');
        btn.onclick = async () => { btn.classList.remove('on', 'rec'); btn.textContent = '⏳'; try { evaluate(await AI.transcribe(state.settings, await rec.stop(), lang)); } catch (e) { toast(esc(e.message)); draw(); } };
      } else toast('Reconnaissance vocale indisponible sur cet appareil (ajoute une clé Gemini pour la transcription)');
    };
  };
  draw();
};

// ---------- Badges ----------
views.badges = () => {
  const p = ST.profile();
  app.innerHTML = `<div class="page narrow"><button class="back" data-go="home">← Accueil</button><h2>🏅 Badges de ${esc(p.name)}</h2>
    <div class="badges">${ST.BADGES.map((b) => `<div class="badge ${p.badges[b.id] ? 'got' : ''}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div>
    <div class="card"><b>Stats</b><p>${p.stats.lessons} leçons · ${p.stats.turns} réponses (dont ${p.stats.voiceTurns} à l’oral) · ${p.deck.length} cartes · meilleure série ${p.streak.best || 0} j</p></div></div>`;
  bindGo();
};

// ---------- Famille ----------
views.family = () => {
  const ranked = [...state.profiles].sort((a, b) => ST.xpThisWeek(b) - ST.xpThisWeek(a));
  app.innerHTML = `<div class="page narrow"><button class="back" data-go="home">← Accueil</button>
    <h2>👨‍👦 Famille — duel de la semaine</h2>
    <div class="family">${ranked.map((p, i) => `<div class="fam card ${p.id === state.activeId ? 'active' : ''}">
      <span class="rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="av">${p.avatar}</span>
      <div class="grow"><b>${esc(p.name)}</b><small>Niv. ${ST.levelInfo(p.xp).lvl} · 🔥 ${ST.streakAlive(p)} · ${Object.keys(p.langs).map((c) => C.LANGS[c].flag).join(' ')}</small></div>
      <div class="wxp"><b>${ST.xpThisWeek(p)}</b><small>XP sem.</small></div>
      ${p.id === state.activeId ? '<span class="tag">actif</span>' : `<button class="btn small" data-switch="${p.id}">Choisir</button>`}</div>`).join('')}</div>
    <button class="btn" id="addP">＋ Ajouter un profil</button>
    <div class="card"><b>🔄 Synchroniser entre appareils</b>
      <p class="muted small">Chaque appareil garde ses données localement. Pour comparer les scores (ex. iPhone de l’ado ↔ PC), exporte un profil sur un appareil et importe-le sur l’autre.</p>
      <div class="row"><button class="btn" id="expOne">Exporter mon profil</button><button class="btn" id="expAll">Sauvegarde complète</button><label class="btn">Importer<input type="file" id="imp" accept=".json,application/json" hidden></label></div></div></div>`;
  bindGo();
  $$('[data-switch]').forEach((b) => (b.onclick = () => { state.activeId = b.dataset.switch; const p = ST.profile(); state.activeLang = Object.keys(p.langs)[0]; save(); go('home'); }));
  $('#addP').onclick = () => go('onboarding');
  const dl = (txt, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; a.click(); };
  $('#expOne').onclick = () => dl(ST.exportData(false), `fluentquest-${ST.profile().name}-${ST.today()}.json`);
  $('#expAll').onclick = () => dl(ST.exportData(true), `fluentquest-sauvegarde-${ST.today()}.json`);
  $('#imp').onchange = async (e) => {
    try { const n = ST.importData(await e.target.files[0].text()); toast(`${n} profil(s) importé(s)`); go('family'); }
    catch (err) { toast('Import impossible : ' + esc(err.message)); }
  };
};

// ---------- Réglages ----------
views.settings = ({ welcome } = {}) => {
  const s = state.settings; const p = ST.profile();
  app.innerHTML = `<div class="page narrow">
    ${welcome ? '' : '<button class="back" data-go="home">← Accueil</button>'}
    <h2>⚙️ Réglages</h2>
    ${welcome ? `<div class="card notice">Dernière étape : connecte une IA (Gemini <b>ou</b> Claude). La clé reste <b>uniquement sur cet appareil</b>.<br><small>Gemini : clé gratuite sur <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> · Claude : <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a></small></div>` : ''}
    <form class="card form" id="sf">
      <div class="field"><span>Moteur d’IA</span><div class="seg">
        <label><input type="radio" name="provider" value="gemini" ${s.provider === 'gemini' ? 'checked' : ''}><span>✦ Gemini</span></label>
        <label><input type="radio" name="provider" value="claude" ${s.provider === 'claude' ? 'checked' : ''}><span>✳︎ Claude</span></label></div></div>
      <label>Clé API Gemini<input type="password" name="geminiKey" value="${esc(s.geminiKey)}" placeholder="AIza…" autocomplete="off"></label>
      <label>Modèle Gemini<input name="geminiModel" value="${esc(s.geminiModel)}" list="gm"><datalist id="gm"></datalist></label>
      <label>Clé API Claude<input type="password" name="claudeKey" value="${esc(s.claudeKey)}" placeholder="sk-ant-…" autocomplete="off"></label>
      <label>Modèle Claude<input name="claudeModel" value="${esc(s.claudeModel)}" list="cm"><datalist id="cm"></datalist></label>
      <div class="row"><button type="button" class="btn" id="test">🔌 Tester</button><button type="button" class="btn" id="models">📃 Lister les modèles</button></div>
      <p class="muted small">💡 Avec une clé Gemini, l’app peut aussi transcrire ta voix quand le navigateur ne sait pas le faire (iPhone en mode app).</p>
      <label>Micro<select name="micMode">
        <option value="auto" ${s.micMode === 'auto' ? 'selected' : ''}>Automatique (navigateur, sinon Gemini)</option>
        <option value="browser" ${s.micMode === 'browser' ? 'selected' : ''}>Reconnaissance du navigateur</option>
        <option value="gemini" ${s.micMode === 'gemini' ? 'selected' : ''}>Enregistrement + transcription Gemini</option>
        <option value="keyboard" ${s.micMode === 'keyboard' ? 'selected' : ''}>Clavier / dictée du téléphone</option></select></label>
      <label class="chk"><input type="checkbox" name="handsFree" ${s.handsFree ? 'checked' : ''}> Mode mains libres (le micro s’ouvre quand le coach a fini de parler)</label>
      <button class="btn primary big">Enregistrer</button>
    </form>
    ${p ? profileSettings(p) : ''}
    <p class="muted small center">FluentQuest · données stockées localement sur cet appareil</p></div>`;
  bindGo();
  const form = $('#sf');
  const collect = () => {
    const f = new FormData(form);
    Object.assign(s, { provider: f.get('provider'), geminiKey: f.get('geminiKey').trim(), claudeKey: f.get('claudeKey').trim(), geminiModel: f.get('geminiModel').trim(), claudeModel: f.get('claudeModel').trim(), micMode: f.get('micMode'), handsFree: !!f.get('handsFree') });
    save();
  };
  form.onsubmit = (e) => { e.preventDefault(); collect(); toast('Réglages enregistrés ✓'); if (welcome) go('home'); };
  $('#test').onclick = async (e) => {
    collect(); if (!AI.aiReady(s)) return toast('Renseigne la clé du moteur choisi');
    e.target.textContent = '⏳…';
    try { const r = await AI.testConnection(s); toast(`✅ Connecté : « ${esc(r)} »`, 4000); } catch (err) { toast('❌ ' + esc(err.message), 6000); }
    e.target.textContent = '🔌 Tester';
  };
  $('#models').onclick = async () => {
    collect(); if (!AI.aiReady(s)) return toast('Renseigne la clé du moteur choisi');
    try {
      const list = await AI.listModels(s);
      $(s.provider === 'gemini' ? '#gm' : '#cm').innerHTML = list.map((m) => `<option value="${esc(m)}">`).join('');
      toast(`${list.length} modèles disponibles — touche le champ « Modèle » pour choisir`, 4000);
    } catch (err) { toast('❌ ' + esc(err.message), 6000); }
  };
  if (p) bindProfileSettings(p);
};

function profileSettings(p) {
  return `<h3 class="sec-title">${p.avatar} Profil de ${esc(p.name)}</h3>
  <form class="card form" id="pf">
    <label>Prénom<input name="name" value="${esc(p.name)}"></label>
    <label>À propos (pour personnaliser l’IA)<textarea name="about" rows="2">${esc(p.about)}</textarea></label>
    <label>Objectif quotidien (XP)<input type="number" name="goal" min="20" max="300" step="10" value="${p.goal}"></label>
    ${Object.entries(p.langs).map(([c, L]) => `<fieldset><legend>${C.LANGS[c].flag} ${C.LANGS[c].name}</legend>
      <div class="row2"><label>Niveau de départ<select name="lvl_${c}">${C.LEVELS.map((l) => `<option ${l.id === L.level ? 'selected' : ''}>${l.id}</option>`).join('')}</select></label>
      <label>Objectif 6 mois<select name="tgt_${c}">${C.LEVELS.map((l) => `<option ${l.id === L.target ? 'selected' : ''}>${l.id}</option>`).join('')}</select></label></div>
      <div class="row2"><label>Accent<select name="acc_${c}">${C.LANGS[c].accents.map((a) => `<option ${a === L.accent ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <label>Voix<select name="voice_${c}" data-vlang="${c}"><option value="">Automatique</option></select></label></div>
      <label>Vitesse de parole : <output>${L.rate}</output><input type="range" name="rate_${c}" min="0.6" max="1.3" step="0.05" value="${L.rate}" oninput="this.previousElementSibling.value=this.value"></label>
      <button type="button" class="btn small" data-try="${c}">🔊 Essayer la voix</button>
    </fieldset>`).join('')}
    ${Object.keys(C.LANGS).filter((c) => !p.langs[c]).map((c) => `<button type="button" class="btn" data-addlang="${c}">＋ Ajouter ${C.LANGS[c].flag} ${C.LANGS[c].name}</button>`).join('')}
    <button class="btn primary">Enregistrer le profil</button>
    <details><summary class="muted">Zone sensible</summary>
      <div class="row"><button type="button" class="btn bad" id="resetP">Remettre à zéro la progression</button><button type="button" class="btn bad" id="delP">Supprimer le profil</button></div></details>
  </form>`;
}

function bindProfileSettings(p) {
  const fill = () => $$('[data-vlang]').forEach((sel) => {
    const c = sel.dataset.vlang;
    const vs = SP.getVoices(c);
    sel.innerHTML = '<option value="">Automatique</option>' + vs.map((v) => `<option ${v.name === p.langs[c].voice ? 'selected' : ''} value="${esc(v.name)}">${esc(v.name)} (${v.lang})</option>`).join('');
  });
  fill(); setTimeout(fill, 700);
  const form = $('#pf');
  const apply = () => {
    const f = new FormData(form);
    p.name = f.get('name').trim() || p.name; p.about = f.get('about').trim(); p.goal = Number(f.get('goal')) || p.goal;
    for (const c of Object.keys(p.langs)) {
      const L = p.langs[c];
      L.level = f.get('lvl_' + c); L.target = f.get('tgt_' + c);
      if (C.levelIndex(L.target) < C.levelIndex(L.level)) L.target = L.level;
      L.accent = f.get('acc_' + c); L.voice = f.get('voice_' + c); L.rate = Number(f.get('rate_' + c));
    }
    save();
  };
  form.onsubmit = (e) => { e.preventDefault(); apply(); toast('Profil enregistré ✓'); };
  $$('[data-try]').forEach((b) => (b.onclick = () => { apply(); const c = b.dataset.try; SP.speak(c === 'en' ? `Hi ${p.name}! Ready for today's lesson?` : `¡Hola ${p.name}! ¿Listo para la clase de hoy?`, p.langs[c].accent, voiceOpts(p, c)); }));
  $$('[data-addlang]').forEach((b) => (b.onclick = () => {
    const c = b.dataset.addlang; p.langs[c] = ST.newLangState('A2', C.LANGS[c].accents[0]); ST.seedDeck(p, c);
    p.pendingTests = [...(p.pendingTests || []), c]; save(); go('settings');
  }));
  $('#resetP').onclick = () => { if (confirm(`Effacer toute la progression de ${p.name} ?`)) { for (const L of Object.values(p.langs)) { L.progress = {}; L.startDate = ST.today(); } p.xp = 0; p.xpByDay = {}; p.badges = {}; p.streak = { count: 0, last: null, freezes: 0, best: 0 }; save(); toast('Progression remise à zéro'); } };
  $('#delP').onclick = () => {
    if (!confirm(`Supprimer définitivement le profil ${p.name} ?`)) return;
    state.profiles = state.profiles.filter((x) => x.id !== p.id); state.activeId = state.profiles[0]?.id || null; save(); boot();
  };
}

boot();
