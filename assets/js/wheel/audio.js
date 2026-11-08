import { $, rnd } from '../common.js';

let ctx, keepAlive;

const enabled = () => $('snd').checked;

const isIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const silence = () => {
  const rate = 8000, len = rate / 10, view = new DataView(new ArrayBuffer(44 + len));
  const text = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, 'data');
  view.setUint32(40, len, true);
  for (let i = 0; i < len; i++) view.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
};

const routeToMedia = () => {
  if (keepAlive || !isIOS()) return;
  keepAlive = new Audio(silence());
  keepAlive.loop = true;
  keepAlive.play().catch(() => (keepAlive = null));
};

const context = () => {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  }
  return ctx;
};

const ready = () => {
  const a = context();
  if (a.state === 'running') return a;
  a.resume().catch(() => { });
  return null;
};

export const unlock = () => {
  try {
    routeToMedia();
    ready();
  } catch { }
};

export const buzz = pattern => enabled() && navigator.vibrate?.(pattern);

export function beep(freq, dur, type = 'triangle', vol = .25, to) {
  if (!enabled()) return;
  try {
    const a = ready();
    if (!a) return;
    const osc = a.createOscillator(), gain = a.createGain(), t = a.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + .005);
    gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + .02);
  } catch { }
}

export const tick = () => beep(rnd(750, 950), .05, 'square', .2);

export const cue = () => beep(260, .2, 'triangle', .3, 200);

export const thud = () => beep(180, .3, 'sawtooth', .35, 40);

export const fanfare = () =>
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .25, 'triangle', .35), i * 110));

['click', 'touchend', 'keydown'].forEach(type => addEventListener(type, unlock, { passive: true }));