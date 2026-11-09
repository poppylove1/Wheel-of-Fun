import { $, int } from '../common.js';
import { store } from '../store.js';
import { COOLDOWN, MAX_NAMES } from './config.js';
import { state } from './state.js';
import { draw, fit, idxAt } from './draw.js';
import { plan } from './plan.js';
import { buzz, fanfare, tick, unlock } from './audio.js';
import { boom, shake } from './fx.js';

const canvas = $('c');
let wake = null, frame = 0, cooldown = 0;

const save = () =>
  store.save('wheel', {
    names: $('names').value,
    norep: $('norep').checked,
    used: [...state.used],
    lastKey: state.lastKey,
    hist: state.hist
  });

const renderHist = () => {
  $('hist').innerHTML = state.hist.map(([a, b]) => `<li>${a} → ${b}</li>`).join('');
};

const build = () => {
  const { names, used } = state;
  const all = names.flatMap(a => names.filter(b => b !== a).map(b => [a, b]));
  const norep = $('norep').checked;
  state.pairs = norep ? all.filter(p => !used.has(p.join('>'))) : all;
  if (!state.pairs.length) {
    used.clear();
    state.pairs = all;
  }
  $('info').textContent =
    names.length < 2
      ? 'ต้องมีอย่างน้อย 2 คน'
      : `${names.length} คน · ${state.pairs.length} ช่อง${norep ? ` · ออกไปแล้ว ${used.size}` : ''}`;
  $('go').disabled = names.length < 2 || state.spinning;
  draw();
  save();
};

const readNames = keep => {
  state.names = [...new Set($('names').value.split(/[\s,，]+/).filter(Boolean))].slice(0, MAX_NAMES);
  if (!keep) state.used.clear();
  build();
};

const setBusy = busy => {
  state.spinning = busy;
  $('norep').disabled = $('reset').disabled = busy;
  $('go').disabled = busy || state.names.length < 2;
};

const releaseWake = () => {
  wake?.release().catch(() => { });
  wake = null;
};

const release = () => {
  cooldown = 0;
  setBusy(false);
  if (!state.pending) return;
  state.pending = false;
  readNames();
};

const abort = () => {
  cancelAnimationFrame(frame);
  clearTimeout(cooldown);
  state.flick = 0;
  releaseWake();
  release();
};

const finish = () => {
  const pair = state.pairs[idxAt(state.theta)];
  state.flick = 0;
  state.lastKey = pair.join('>');
  state.hist.unshift(pair);
  draw();
  $('res').innerHTML = `<b>${pair[0]}</b> ถาม <b>${pair[1]}</b>`;
  renderHist();
  save();
  releaseWake();
  boom();
  fanfare();
  buzz([80, 40, 80, 40, 160]);
  cooldown = setTimeout(release, COOLDOWN);
};

const spin = () => {
  if (state.spinning || state.names.length < 2) return;
  setBusy(true);
  if (state.lastKey && $('norep').checked) state.used.add(state.lastKey);
  state.lastKey = null;
  build();

  const phases = plan(int(0, state.pairs.length), state.pairs.length, state.theta);
  $('res').innerHTML = '&nbsp;';
  unlock();
  navigator.wakeLock?.request('screen').then(l => (wake = l)).catch(() => { });

  let i = 0, start = performance.now(), last = idxAt(state.theta), lastTick = 0;

  const step = now => {
    let el = (now - start) / 1000;
    while (i < phases.length && el >= phases[i].d) {
      el -= phases[i].d;
      state.theta = phases[i].a1;
      if (phases[i].shake) shake();
      start = now - el * 1000;
      i++;
    }
    if (i >= phases.length) return finish();

    const { a0, a1, d, e } = phases[i];
    state.theta = a0 + (a1 - a0) * e(el / d);
    const cur = idxAt(state.theta);
    if (cur !== last) {
      last = cur;
      state.flick = .55;
      if (now - lastTick > 35) {
        lastTick = now;
        tick();
        buzz(6);
      }
    }
    state.flick *= .86;
    draw();
    frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);
};

const onNames = () => {
  if (!state.spinning) return readNames();
  state.pending = true;
  $('info').textContent = 'แก้ชื่อได้ จะมีผลรอบหน้า';
};

const resetUsed = () => {
  state.used.clear();
  state.lastKey = null;
  build();
};

$('names').oninput = onNames;
$('names').onkeydown = e => {
  if (e.key !== 'Enter' || e.repeat) return;
  e.target.blur();
  spin();
};
$('norep').onchange = resetUsed;
$('go').onclick = canvas.onclick = spin;
$('clr').onclick = () => {
  $('names').value = '';
  $('names').focus();
  onNames();
};
$('reset').onclick = () => {
  state.hist = [];
  renderHist();
  resetUsed();
};

addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.repeat || e.target.tagName === 'INPUT') return;
  e.preventDefault();
  spin();
});
addEventListener('error', () => state.spinning && abort());

const saved = store.load('wheel');
if (saved) {
  const { names = '', norep = false, used = [], lastKey = null, hist = [] } = saved;
  $('names').value = names;
  $('norep').checked = norep;
  state.used = new Set(used);
  state.lastKey = lastKey;
  state.hist = hist;
  renderHist();
}

new ResizeObserver(fit).observe(canvas);
readNames(!!saved);