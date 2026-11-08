// Connexion aux API Gemini ou Claude, directement depuis le navigateur (clé stockée sur l'appareil uniquement).
import { LANGS, SESSIONS, weekPlan, isBeginner } from './curriculum.js';

export const DEFAULT_MODELS = { gemini: 'gemini-3.5-flash', claude: 'claude-haiku-5-5' };

function parseJSON(text) {
  if (!text) throw new Error('Réponse vide de l’IA');
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch { return { reply: text.trim() }; }
}

async function httpError(res) {
  let msg = `${res.status}`;
  try { const j = await res.json(); msg += ' — ' + (j.error?.message || JSON.stringify(j)); } catch {}
  if (res.status === 401 || res.status === 403) msg += ' (clé API invalide ?)';
  if (res.status === 404) msg += ' (nom de modèle introuvable ? Vérifie les réglages)';
  if (res.status === 429) msg += ' (quota ou limite de débit atteint)';
  return new Error(msg);
}

async function callGemini({ key, model, system, messages, json = true, extraParts }) {
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  if (extraParts) contents.push({ role: 'user', parts: extraParts });
  const body = { contents, generationConfig: { temperature: 1.0, maxOutputTokens: 4096 } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (json) body.generationConfig.responseMimeType = 'application/json';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body),
  });
  if (!res.ok) throw await httpError(res);
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
}

async function callClaude({ key, model, system, messages }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 1500, system, messages }),
  });
  if (!res.ok) throw await httpError(res);
  const data = await res.json();
  return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
}

export function aiReady(settings) {
  const p = settings.provider;
  return !!(p === 'gemini' ? settings.geminiKey : settings.claudeKey);
}

export async function chat(settings, system, messages) {
  const p = settings.provider;
  const text = p === 'gemini'
    ? await callGemini({ key: settings.geminiKey, model: settings.geminiModel || DEFAULT_MODELS.gemini, system, messages })
    : await callClaude({ key: settings.claudeKey, model: settings.claudeModel || DEFAULT_MODELS.claude, system, messages });
  return parseJSON(text);
}

export async function testConnection(settings) {
  const r = await chat(settings, 'Answer only with JSON: {"reply": "..."}', [{ role: 'user', content: 'Say hello in Spanish.' }]);
  return r.reply || JSON.stringify(r);
}

export async function listModels(settings) {
  if (settings.provider === 'gemini') {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': settings.geminiKey } });
    if (!res.ok) throw await httpError(res);
    const j = await res.json();
    return (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => m.name.replace('models/', ''))
      .filter((n) => n.startsWith('gemini') && !/(tts|image|live|embedding|audio|transcribe|translate)/.test(n));
  }
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: { 'x-api-key': settings.claudeKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
  });
  if (!res.ok) throw await httpError(res);
  const j = await res.json();
  return (j.data || []).map((m) => m.id);
}

// Transcription audio (repli quand la reconnaissance vocale du navigateur n'est pas dispo, ex. iPhone en mode app)
export async function transcribe(settings, wavBase64, lang) {
  if (!settings.geminiKey) throw new Error('Transcription audio : nécessite une clé Gemini');
  const text = await callGemini({
    key: settings.geminiKey, model: settings.geminiModel || DEFAULT_MODELS.gemini, json: false, messages: [],
    extraParts: [
      { inlineData: { mimeType: 'audio/wav', data: wavBase64 } },
      { text: `Transcribe exactly what the speaker says. The speaker is a French learner speaking ${LANGS[lang].native} (may mix in some French). Keep their mistakes, do not correct anything. Output only the transcription text.` },
    ],
  });
  return text.trim();
}

// ---------- Prompts pédagogiques ----------

const JSON_SPEC = `
RESPONSE FORMAT — reply with ONE JSON object only, no markdown, no text around it:
{
  "reply": "what you SAY out loud (max ~45 words, 1-3 short sentences). Ends with a question or a clear prompt for the learner, unless lesson_complete is true.",
  "translation_fr": "French translation of reply",
  "feedback": { "ok": true|false, "correction": "natural corrected version of the learner's LAST message, or empty string", "tip_fr": "very short explanation in French of the main mistake or a tip (empty if none)" },
  "board": { "title": "short section title in French, or empty string", "items": [
      { "type": "vocab", "target": "word or chunk", "fr": "traduction", "example": "short example sentence in target language" },
      { "type": "rule", "text": "short grammar rule in French with 2-3 target-language examples" },
      { "type": "phrase", "target": "useful sentence", "fr": "traduction" }
  ] },
  "exercise": null,
  "suggestions": ["2 or 3 short possible answers the learner could say next, at their level, in the target language"],
  "score": 0,
  "lesson_complete": false,
  "summary_fr": "",
  "level": ""
}
EXERCISES — "exercise" is null OR one of:
  { "kind": "choice", "skill": "vocab"|"grammar", "question": "question (in French or target language)", "options": ["3 or 4 options"], "answer": 0, "explain_fr": "why, in French, one line" }
  { "kind": "repeat", "skill": "vocab"|"grammar", "target": "a short sentence in the target language using today's words/structure", "fr": "traduction" }
  When you send an exercise, your "reply" just introduces it briefly (e.g. "Quick quiz!" / "Repeat after me!") — do not ask another question in the same turn.
  The app then sends you the result as "[QUIZ RESULT] ..." or "[REPEAT RESULT] ...": react in one sentence (congratulate or correct) and continue the lesson.
OTHER RULES:
- "board" = WRITTEN support shown next to the conversation: add items only when new. "items": [] when nothing new.
- "score" rates the learner's LAST free message (0 if none, or after a [QUIZ RESULT]/[REPEAT RESULT]): 0 = no real attempt / French only, 1 = understandable with errors, 2 = good, 3 = excellent for the level.
- The learner's messages come from speech recognition: ignore capitalisation and punctuation; if a word looks like a transcription error, guess the intended meaning and do not penalise it.`;

function persona(profile, lang) {
  const t = LANGS[lang].tutor[profile.audience];
  const L = profile.langs[lang];
  const who = profile.audience === 'ado'
    ? `The learner is a child/teenager (French collège student). Be warm, fun, energetic and very encouraging, use examples kids and teens like (games, sport, animals, school, series), a bit of humour, never babyish. In French you use "tu".`
    : `The learner is an adult professional (senior IT executive). Be friendly, sharp and efficient, use professional and real-life examples, challenge them intellectually. In French you use "tu".`;
  const beginner = isBeginner(L.level) ? `
BEGINNER MODE (learner started at ${L.level}${L.level === 'A0' ? ', complete beginner, French 6e level' : ''}):
- Give instructions and explanations in FRENCH (short), and use the target language for the words and sentences being taught. Progressively increase the share of target language over the weeks.
- Very short target-language sentences, always with translation_fr. Expect answers of 1 to 6 words; praise every attempt.
- Alternate activities every turn: a "choice" quiz, a "repeat" exercise, a simple spoken question (e.g. "What colour is your bag?"), a mini-dialogue.
- Teach pronunciation tips in tip_fr when useful (e.g. "le 'th' : langue entre les dents").` : '';
  return `You are ${t}, a native ${LANGS[lang].native} speaking-coach inside the language app "FluentQuest". The learner's name is ${profile.name}; their native language is French.
${who}
${profile.about ? `About the learner (use it to personalise questions): ${profile.about}` : ''}
Accent/variety to use: ${L.accent}.
TEACHING RULES:
- ORAL lesson: keep each spoken reply short so the learner speaks MORE than you.
- Speak in the target language, adapted to the learner's level. French in translation_fr, tip_fr, board "fr"/"rule", explain_fr and summary_fr${isBeginner(L.level) ? ', and for short instructions (beginner mode)' : ''}.
- If the learner answers in French or is stuck, give them the words they need on the board and re-ask more simply.
- Correct gently via "feedback" (one main point per turn).
- Push slightly above their level (i+1).${beginner}`;
}

function knownWords(profile, lang) {
  const words = profile.deck.filter((c) => c.lang === lang && c.src !== 'starter').slice(-80).map((c) => c.target);
  return words.length ? `WORDS ALREADY LEARNT (do NOT re-teach them as new; DO recycle 3+ of them in this lesson): ${words.join(' | ')}` : 'No words learnt yet in previous lessons.';
}

export function lessonSystemPrompt(profile, lang, w, d) {
  const plan = weekPlan(profile, lang, w);
  const s = SESSIONS[d - 1];
  const nTurns = d === 5 ? 10 : 9;
  return `${persona(profile, lang)}

CURRENT LESSON — 6-month programme (week ${w}/26, lesson ${d}/5).
- Target level this week (CEFR): ${plan.level} (started ${profile.langs[lang].level}, aiming ${profile.langs[lang].target} after 6 months).
- Theme of the week: ${plan.theme.fr} — ${plan.theme.ctx}.${plan.theme.vocab ? ` Core vocabulary field: ${plan.theme.vocab}.` : ''}${plan.theme.review ? ' REVIEW week: mix earlier themes and grammar.' : ''}
- Grammar point of the week: ${plan.grammar.g}.
- Lesson type: ${s.name}.
EVERY LESSON MUST WORK BOTH VOCABULARY AND GRAMMAR:
- VOCABULARY: ${s.vocab} Put every new word on the board (type "vocab", with example).
- GRAMMAR: ${s.grammar} Put ONE clear "rule" item on the board early in the lesson (in French, with examples).
- EXERCISES: at least ${d === 5 ? 4 : 2} "choice" quizzes (mix vocab and grammar) and at least ${isBeginner(profile.langs[lang].level) ? 2 : 1} "repeat" exercise during the lesson.
- ${knownWords(profile, lang)}
STRUCTURE: about ${nTurns} learner turns (10–15 minutes).
1) On [START]: greet ${profile.name} briefly, announce today's goal (words + grammar) in one sentence, put the first board items, ask the first question or give the first exercise.
2) Progress: new words → rule → practice (questions + exercises) → free use.
3) When done (around ${nTurns} learner turns, or on [END]): "lesson_complete": true, spoken reply congratulates and says goodbye, "summary_fr" = 3–5 lines in French: what went well, 1–2 points to work on, the key words and the rule to remember.
${JSON_SPEC}`;
}

export function freeSystemPrompt(profile, lang, topic) {
  return `${persona(profile, lang)}

FREE CONVERSATION — level ${profile.langs[lang].level}→${profile.langs[lang].target}. Topic: ${topic || 'whatever the learner wants to talk about; propose something interesting'}.
Natural, lively conversation, while still teaching a few new words (board), giving feedback and 1–2 exercises. ${knownWords(profile, lang)}
After about 10 learner turns, or on [END], set lesson_complete true with summary_fr.
${JSON_SPEC}`;
}

export function placementSystemPrompt(profile, lang) {
  return `${persona(profile, lang)}

PLACEMENT TEST — estimate the learner's level (A0 = complete beginner, A1, A2, B1, B2, C1) through 6 to 8 turns.
Start in French: explain it is a short game to find their level and that it's fine to not know. Begin with very simple things (greetings, numbers, "what's your name?"), use 2–3 "choice" exercises, then adapt difficulty (present, past, future, opinions, hypotheses) depending on answers. Stop early if the learner clearly knows nothing (→ A0).
Do not correct much. When done (or on [END]) set lesson_complete true, "level" to one of A0, A1, A2, B1, B2, C1, and "summary_fr" explaining the estimate in French (strengths, gaps).
${JSON_SPEC}`;
}
