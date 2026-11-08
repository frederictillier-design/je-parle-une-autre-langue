// Petits effets sonores générés (aucun fichier audio)
let ctx = null, enabled = true;
export const setSound = (on) => { enabled = on; };
function tone(freq, start, dur, type = 'sine', vol = 0.15) {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.02);
}
const play = (notes) => { if (!enabled) return; try { notes.forEach((n) => tone(...n)); } catch {} };
export const sfx = {
  good: () => play([[660, 0, 0.12], [990, 0.09, 0.18]]),
  bad: () => play([[220, 0, 0.18, 'triangle'], [180, 0.12, 0.22, 'triangle']]),
  combo: (n) => play([[523 + n * 40, 0, 0.08, 'square', 0.06], [784 + n * 40, 0.07, 0.12, 'square', 0.06]]),
  coin: () => play([[988, 0, 0.08, 'square', 0.07], [1319, 0.07, 0.2, 'square', 0.07]]),
  hit: () => play([[140, 0, 0.12, 'sawtooth', 0.12], [90, 0.05, 0.15, 'sawtooth', 0.1]]),
  win: () => play([[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.15], [1047, 0.36, 0.35]]),
  levelup: () => play([[392, 0, 0.12], [523, 0.1, 0.12], [659, 0.2, 0.12], [784, 0.3, 0.12], [1047, 0.4, 0.4]]),
  tap: () => play([[880, 0, 0.04, 'sine', 0.05]]),
};
