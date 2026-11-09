import { TAU, rnd, int, mod, pick } from '../common.js';

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
  const hold = d => add(d, cur, E.lin);
  const push = (d, turns, e) => add(d, cur + turns * TAU, e);
  const almostStop = () => clip(E.out3, rnd(.82, .92));
  const settle = idx => add(rnd(4, 6), land(idx, int(3, 6)), E.out3);

  const relay = withFreeze => {
    const rounds = int(1, 4);
    const frozen = withFreeze ? int(0, rounds) : -1;
    for (let j = 0; j < rounds; j++) {
      const d = j ? rnd(1.5, 2.5) : rnd(4, 6);
      push(d, d * rnd(.7, 1), j === frozen ? E.coast : almostStop());
      if (j === frozen) hold(rnd(.7, 1.2));
    }
    add(rnd(2.5, 3.5), land(target, 1), E.out3);
  };

  pick([
    () => settle(target),
    () => {
      const k = reach(5);
      settle(mod(target - k, n));
      hold(rnd(.6, 1));
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
    },
    () => add(rnd(5, 7), land(target, int(3, 6), pick([rnd(.03, .1), rnd(.9, .97)])), E.out3),
    () => {
      for (let j = int(2, 5); j--;) {
        push(rnd(.8, 1.4), rnd(.3, .8), E.out3);
        hold(rnd(.3, .6));
      }
      add(rnd(2.5, 3.5), land(target, 1), E.out3);
    },
    () => {
      add(rnd(2, 3), cur - rnd(1, 2) * TAU, E.out3);
      hold(rnd(.4, .8));
      settle(target);
    },
    () => {
      settle(mod(target + 1, n));
      add(rnd(.7, 1), cur + 2 * seg, E.io);
      add(rnd(.7, 1), cur - seg, E.io);
    },
    () => {
      add(rnd(1.2, 2), cur - rnd(.2, .5) * TAU, E.io);
      settle(target);
    },
    () => {
      const side = int(0, 2), dir = 1 - 2 * side, x0 = -dir * .03;
      add(rnd(5, 7), land(target, int(3, 6), side + x0), E.out3);
      const edge = cur + x0 * seg;
      const swing = (x, d) => add(d, edge - x * seg, E.io);
      hold(rnd(.7, 1.1));
      let s = pick([-1, 1]);
      for (let j = int(3, 6); j--; s = -s) swing(s * .45 * .6 ** j, rnd(.45, .7));
      swing(dir * rnd(.25, .75), rnd(.9, 1.3));
    }
  ])();

  return phases;
}