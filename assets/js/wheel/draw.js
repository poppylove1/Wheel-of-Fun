import { TAU, $, mod } from '../common.js';
import { COLORS } from './config.js';
import { state } from './state.js';

const cv = $('c'), ctx = cv.getContext('2d');
const dpr = () => Math.min(devicePixelRatio || 1, 3);

export const idxAt = th => Math.floor(mod(-th, TAU) / (TAU / state.pairs.length));

export function fit() {
  const w = cv.clientWidth;
  if (!w) return;
  cv.width = cv.height = Math.round(w * dpr());
  draw();
}

function slices(r, seg) {
  const n = state.pairs.length;
  state.pairs.forEach(([a, b], i) => {
    const s = state.theta + i * seg - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, s, s + seg);
    ctx.closePath();
    ctx.fillStyle = n % 5 === 1 && i === n - 1 ? '#ff9f1c' : COLORS[i % 5];
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();
    const size = Math.max(10, Math.min(19, r * seg * .32));
    const start = Math.max(34, size / seg);
    ctx.save();
    ctx.rotate(s + seg / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `600 ${size}px Mitr, sans-serif`;
    ctx.fillText(`${a} → ${b}`, start, 0, Math.max(24, r - 12 - start));
    ctx.restore();
  });
}

function pointer(r) {
  ctx.translate(0, -r - 2);
  ctx.rotate(-state.flick);
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.lineTo(14, -16);
  ctx.lineTo(0, 24);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f2ecdc';
  ctx.stroke();
}

export function draw() {
  const w = cv.clientWidth, n = state.pairs.length;
  if (!w) return;
  ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
  ctx.clearRect(0, 0, w, w);
  if (!n) return;
  const r = w / 2 - 18;
  ctx.translate(w / 2, w / 2);
  slices(r, TAU / n);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, TAU);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  pointer(r);
}