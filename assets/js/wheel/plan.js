import { TAU, rnd, int, mod, pick } from '../common.js';

const SAY = {
  back: ['ถอยหลังเฉย', 'ผิดทางหรือเปล่า'],
  kick: ['มีคนมาหมุนต่อ', 'ยังไม่จบนะ', 'เอาอีกที'],
  freeze: ['ค้างเฉยเลย', 'อ้าว หยุดซะงั้น', 'เดี๋ยวก่อน']
};

const E = {
  lin: t => t,
  out3: t => 1 - (1 - t) ** 3,
  coast: t => t * (1.3 - .3 * t),
  io: t => (t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
};

const clip = (ease, cut) => t => ease(t * cut) / ease(cut);

export function plan(target, n, theta) {
  const seg = TAU / n, phases = [];
  let cur = theta;

  const land = (idx, turns, f = rnd(.2, .8)) =>
    cur + mod(-(idx + f) * seg - cur, TAU) + turns * TAU;
  const reach = max => int(1, Math.min(max, n - 1) + 1);
  const add = (d, a1, e, extra) => phases.push({ d, a0: cur, a1: (cur = a1), e, ...extra });
  const hold = (d, say) => add(d, cur, E.lin, say && { say: pick(SAY[say]) });
  const push = (d, turns, e, say) => add(d, cur + turns * TAU, e, say && { say: pick(SAY[say]) });
  const almostStop = () => clip(E.out3, rnd(.82, .92));
  const settle = idx => add(rnd(4, 6), land(idx, int(3, 6)), E.out3);

  const relay = withFreeze => {
    const rounds = int(1, 4);
    const frozen = withFreeze ? int(0, rounds) : -1;
    for (let j = 0; j < rounds; j++) {
      const d = j ? rnd(1.5, 2.5) : rnd(4, 6);
      push(d, d * rnd(.7, 1), j === frozen ? E.coast : almostStop(), j ? 'kick' : undefined);
      if (j === frozen) hold(rnd(.7, 1.2), 'freeze');
    }
    add(rnd(2.5, 3.5), land(target, 1), E.out3, { say: pick(SAY.kick) });
  };

  pick([
    () => settle(target),
    () => {
      const k = reach(5);
      settle(mod(target - k, n));
      hold(rnd(.6, 1), 'back');
      add(.8 + k * .4, cur - k * seg, E.io);
    },
    () => relay(false),
    () => {
      const d = rnd(4, 6);
      add(d, land(target, int(d * 1.2, d * 2)), E.coast, { shake: true });
    },
    () => relay(true),
    () => {
      const k = reach(2);
      settle(mod(target + k, n));
      hold(rnd(1, 1.8));
      add(k * rnd(1.4, 2), cur + k * seg, E.io);
    }
  ])();

  return phases;
}