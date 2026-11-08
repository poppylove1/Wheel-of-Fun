const KEY = 'wheel-session';
const VERSION = 1;
const TTL = 6 * 60 * 60 * 1000;

const read = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s?.v === VERSION && s.exp > Date.now() ? s : {};
  } catch {
    return {};
  }
};

export const store = {
  load: ns => read()[ns] ?? null,
  save(ns, value) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...read(), v: VERSION, exp: Date.now() + TTL, [ns]: value }));
    } catch { }
  }
};