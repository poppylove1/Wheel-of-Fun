export const TAU = Math.PI * 2;
export const $ = id => document.getElementById(id);
export const rnd = (a, b) => a + Math.random() * (b - a);
export const int = (a, b) => Math.floor(rnd(a, b));
export const mod = (x, m) => ((x % m) + m) % m;
export const pick = a => a[int(0, a.length)];
