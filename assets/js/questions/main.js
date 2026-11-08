import { $, pick } from '../common.js';

const FRAMES = 12;
const FRAME_MS = 70;

let cats = [], active = new Set(), seen = new Set(), busy = false;

const pool = () =>
  cats
    .filter(c => active.has(c.id))
    .flatMap(c => c.questions.map(q => ({ tag: c.name, q, key: `${c.id}|${q}` })));

const fresh = () => {
  const all = pool();
  return $('norep').checked ? all.filter(x => !seen.has(x.key)) : all;
};

const renderChips = () => {
  const chips = [
    { id: '*', name: 'ทั้งหมด', on: active.size === cats.length },
    ...cats.map(c => ({ ...c, on: active.has(c.id) }))
  ];
  $('chips').innerHTML = chips
    .map(c => `<button class="chip" data-id="${c.id}" aria-pressed="${c.on}">${c.name}</button>`)
    .join('');
};

const refresh = () => {
  renderChips();
  const total = pool().length;
  $('info').textContent = total ? `${total} คำถาม · เหลือ ${fresh().length}` : 'เลือกหมวดอย่างน้อย 1 หมวด';
  $('go').disabled = busy || !total;
};

const show = ({ tag, q }) => {
  $('tag').textContent = tag;
  $('q').textContent = q;
};

const roll = () => {
  if (busy) return;
  let left = fresh();
  if (!left.length) {
    seen.clear();
    left = fresh();
  }
  if (!left.length) return;

  const final = pick(left), all = pool();
  let n = 0;
  busy = true;
  $('card').classList.add('roll');
  $('go').disabled = true;

  const timer = setInterval(() => {
    if (++n < FRAMES) return show(pick(all));
    clearInterval(timer);
    busy = false;
    seen.add(final.key);
    show(final);
    $('card').classList.remove('roll');
    refresh();
  }, FRAME_MS);
};

$('chips').onclick = e => {
  const id = e.target.dataset?.id;
  if (!id) return;
  if (id === '*') active = new Set(cats.map(c => c.id));
  else if (!active.delete(id)) active.add(id);
  refresh();
};
$('norep').onchange = refresh;
$('go').onclick = roll;

addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.target.tagName === 'INPUT') return;
  e.preventDefault();
  roll();
});

fetch('../data/questions.json')
  .then(r => r.json())
  .then(({ categories }) => {
    cats = categories;
    active = new Set(cats.map(c => c.id));
    refresh();
  })
  .catch(() => {
    $('q').textContent = 'โหลด questions.json ไม่ได้ ลองเปิดผ่านเว็บ (เช่น GitHub Pages) แทนการเปิดไฟล์ตรงๆ';
  });
