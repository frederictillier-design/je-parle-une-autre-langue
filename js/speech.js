// Synthèse vocale, reconnaissance vocale, enregistrement audio (repli Gemini)

let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

export function getVoices(prefix) {
  loadVoices();
  return voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix.toLowerCase()));
}

function pickVoice(bcp, preferredName) {
  loadVoices();
  if (preferredName) { const v = voices.find((x) => x.name === preferredName); if (v) return v; }
  const norm = (l) => l.replace('_', '-').toLowerCase();
  const exact = voices.filter((v) => norm(v.lang) === bcp.toLowerCase());
  const pool = exact.length ? exact : voices.filter((v) => norm(v.lang).startsWith(bcp.slice(0, 2)));
  // privilégier les voix « naturelles / premium / enhanced »
  return pool.find((v) => /natural|premium|enhanced|neural|google/i.test(v.name)) || pool[0] || null;
}

let unlocked = false;
export function unlockAudio() {
  if (unlocked || !window.speechSynthesis) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0; speechSynthesis.speak(u);
}

export function speak(text, bcp, { rate = 1, voiceName, onend } = {}) {
  if (!window.speechSynthesis || !text) { onend && onend(); return; }
  speechSynthesis.cancel();
  // découpe en phrases pour éviter les coupures (bug Safari/Chrome sur textes longs)
  const chunks = text.match(/[^.!?¡¿]+[.!?]*|[¡¿][^.!?]+[.!?]*/g) || [text];
  const v = pickVoice(bcp, voiceName);
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c.trim());
    u.lang = bcp; u.rate = rate; if (v) u.voice = v;
    if (i === chunks.length - 1 && onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
  });
}
export const stopSpeaking = () => window.speechSynthesis && speechSynthesis.cancel();

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const srSupported = () => !!SR;
export const recSupported = () => !!(navigator.mediaDevices && window.MediaRecorder);

// Reconnaissance vocale du navigateur. Retourne une fonction stop().
export function listen(bcp, { onInterim, onFinal, onError, onEnd }) {
  const r = new SR();
  r.lang = bcp; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
  let finalText = '';
  r.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t + ' '; else interim += t;
    }
    onInterim && onInterim((finalText + interim).trim());
  };
  r.onerror = (e) => onError && onError(e.error);
  r.onend = () => { onFinal && onFinal(finalText.trim()); onEnd && onEnd(); };
  r.start();
  return () => { try { r.stop(); } catch {} };
}

// Enregistrement audio → WAV 16 kHz mono en base64 (format accepté par Gemini)
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise((resolve, reject) => {
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        try { resolve(await blobToWavBase64(new Blob(chunks, { type: rec.mimeType }))); } catch (e) { reject(e); }
      };
      rec.stop();
    }),
  };
}

async function blobToWavBase64(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const ab = await blob.arrayBuffer();
  const buf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
  ctx.close && ctx.close();
  const src = buf.getChannelData(0), ratio = buf.sampleRate / 16000, len = Math.floor(src.length / ratio);
  const pcm = new Int16Array(len);
  for (let i = 0; i < len; i++) { const s = Math.max(-1, Math.min(1, src[Math.floor(i * ratio)])); pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
  const header = new ArrayBuffer(44), v = new DataView(header);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.byteLength, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.byteLength, true);
  const bytes = new Uint8Array(44 + pcm.byteLength);
  bytes.set(new Uint8Array(header), 0); bytes.set(new Uint8Array(pcm.buffer), 44);
  let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Similarité de prononciation (comparaison mot à mot, tolérante)
export function similarity(target, said) {
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ' ]/g, ' ').split(/\s+/).filter(Boolean);
  const a = norm(target), b = norm(said);
  if (!a.length) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return Math.max(0, 1 - dp[a.length][b.length] / Math.max(a.length, b.length));
}
