import { $, rnd } from '../common.js';

let ctx;

const enabled = () => $('snd').checked;

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

export const tick = () => beep(rnd(750, 950), .05, 'square', .15);

export const cue = () => beep(260, .2, 'triangle', .25, 200);

export const thud = () => beep(180, .3, 'sawtooth', .3, 40);

export const fanfare = () =>
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .25, 'triangle', .3), i * 110));

['click', 'touchend', 'keydown'].forEach(type => addEventListener(type, unlock, { passive: true }));