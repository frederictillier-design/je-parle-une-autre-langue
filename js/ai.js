// Connexion aux API Gemini ou Claude, directement depuis le navigateur (clé stockée sur l'appareil uniquement).
import { LANGS, SESSIONS, weekPlan } from './curriculum.js';

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
  const body = { contents, generationConfig: { temperature: 1.0, maxOutputTokens: 2048 } };
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
  "reply": "what you SAY out loud, in the target language (max ~45 words, 1-3 short sentences, ALWAYS ends with a question or a clear prompt for the learner, except when lesson_complete is true)",
  "translation_fr": "French translation of reply",
  "feedback": { "ok": true|false, "correction": "natural corrected version of the learner's LAST message, or empty string if it was fine or there was none", "tip_fr": "very short explanation in French of the main mistake or a tip to sound more natural (empty if none)" },
  "board": { "title": "short section title in French, or empty string", "items": [
      { "type": "vocab", "target": "word or chunk", "fr": "traduction", "example": "short example sentence in target language" },
      { "type": "rule", "text": "short grammar rule/explanation in French with examples" },
      { "type": "phrase", "target": "useful sentence", "fr": "traduction" }
  ] },
  "suggestions": ["2 or 3 short possible answers the learner could say next, at their level, in the target language"],
  "score": 0,
  "lesson_complete": false,
  "summary_fr": "",
  "level": ""
}
- "board" holds the WRITTEN support shown on screen next to the conversation: add items only when new (key vocabulary, a rule, model sentences). Use "items": [] when nothing new.
- "score" rates the learner's LAST message (0 if no message yet): 0 = no real attempt / French only, 1 = understandable with errors, 2 = good, 3 = excellent for the level.
- The learner's messages come from speech recognition: ignore capitalisation and punctuation; if a word looks like a transcription error, guess the intended meaning and do not penalise it.`;

function persona(profile, lang) {
  const t = LANGS[lang].tutor[profile.audience];
  const lvlDesc = profile.audience === 'ado'
    ? `The learner is a teenager (French collège / lycée student). Be warm, fun, energetic, encouraging, use topics and examples teenagers like, a bit of humour, never childish. In French you use "tu".`
    : `The learner is an adult professional (senior IT executive). Be friendly, sharp and efficient, use professional and real-life examples, challenge them intellectually. In French you use "tu" unless they prefer otherwise.`;
  return `You are ${t}, a native ${LANGS[lang].native} speaking-coach inside the app "FluentQuest". The learner's name is ${profile.name}; their native language is French.
${lvlDesc}
${profile.about ? `About the learner (use it to personalise questions): ${profile.about}` : ''}
Accent/variety to use: ${profile.langs[lang].accent}.
TEACHING RULES:
- This is an ORAL lesson: keep each spoken reply short and natural so the learner speaks MORE than you (aim for 60% learner talk).
- Speak in the target language, adapted to the learner's level. French ONLY in translation_fr, tip_fr, board "fr"/"rule" fields and summary_fr.
- If the learner answers in French or is stuck, help them: give the words they need in the board and re-ask more simply.
- Correct gently via "feedback" (max one main point per turn), never in the spoken reply except a light recast.
- Push them slightly above their level (i+1): ask follow-up questions, ask "why?", invite longer answers.`;
}

export function lessonSystemPrompt(profile, lang, w, d) {
  const plan = weekPlan(profile, lang, w);
  const s = SESSIONS[d - 1];
  return `${persona(profile, lang)}

CURRENT LESSON — 6-month programme to become fluent (week ${w}/26, lesson ${d}/5).
- Learner's current target level (CEFR): ${plan.level} (started at ${profile.langs[lang].level}, aiming ${profile.langs[lang].target} after 6 months).
- Theme of the week: ${plan.theme.fr} — ${plan.theme.ctx}.${plan.theme.review ? ' This is a REVIEW week: mix earlier themes and grammar, check what has been retained.' : ''}
- Grammar focus of the week: ${plan.grammar.g}.
- Lesson type: ${s.name} — ${s.brief}
STRUCTURE: about 8 learner turns (10–15 minutes).
1) First message (when you receive [START]): greet ${profile.name} briefly, announce today's goal in one sentence, put the key written material on the board, ask the first question.
2) Then keep the conversation going around the objective, recycle the board vocabulary, increase difficulty progressively.
3) When the objective is reached (around 8 learner turns, or if you receive [END]): set "lesson_complete": true, the spoken reply congratulates and says goodbye, and "summary_fr" gives a 3–5 line recap in French: what went well, 1–2 points to work on, and the key expressions to remember.
${JSON_SPEC}`;
}

export function freeSystemPrompt(profile, lang, topic) {
  return `${persona(profile, lang)}

FREE CONVERSATION — level ${profile.langs[lang].level}→${profile.langs[lang].target}. Topic: ${topic || 'whatever the learner wants to talk about; propose something interesting'}.
Keep a natural, lively conversation, like a chat with a friend/colleague, while still giving feedback and board items. After about 10 learner turns, or on [END], set lesson_complete true with summary_fr.
${JSON_SPEC}`;
}

export function placementSystemPrompt(profile, lang) {
  return `${persona(profile, lang)}

PLACEMENT TEST — estimate the learner's oral level (CEFR A1 to C1) through a friendly conversation of 6 to 8 turns.
Start very simple (if needed, say in French that they can answer as they can), then adapt difficulty up or down depending on answers (past, future, opinions, hypotheses, abstract topics).
Do not correct much; board can stay mostly empty. When done (or on [END]) set lesson_complete true, "level" to one of A1, A2, B1, B2, C1, and "summary_fr" explaining the estimate in French (strengths, gaps).
${JSON_SPEC}`;
}
