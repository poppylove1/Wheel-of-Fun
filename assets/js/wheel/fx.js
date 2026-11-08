import { $, rnd, pick } from '../common.js';
import { COLORS } from './config.js';
import { buzz, thud } from './audio.js';

const cv = $('fx'), ctx = cv.getContext('2d');
let parts = [];

function fall() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.y < cv.height + 20);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.5;
  parts.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += .5;
    p.a += p.va;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    ctx.strokeRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    ctx.restore();
  });
  if (parts.length) requestAnimationFrame(fall);
}

export function boom() {
  cv.width = innerWidth;
  cv.height = innerHeight;
  const idle = !parts.length;
  for (let i = 0; i < 140; i++) {
    parts.push({
      x: innerWidth / 2,
      y: innerHeight * .4,
      vx: rnd(-10, 10),
      vy: rnd(-18, -4),
      s: rnd(6, 12),
      c: pick(COLORS),
      a: rnd(0, 6),
      va: rnd(-.3, .3)
    });
  }
  if (idle) fall();
}

export function shake() {
  const box = $('box');
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
  thud();
  buzz([60, 30, 60]);
}