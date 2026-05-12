/* MonBureauCAPTURE — State store réactif */
const State = (() => {
  const initial = () => ({
    mode: null, // 'capture' | 'import'
    page: 'home',
    session: null,
    isRecording: false,
    isPaused: false,
    elapsed: 0,
    importedFile: null,
    importedUrl: null,
    autoScreenshot: false,
    canExport: false,
  });

  let s = initial();
  const listeners = new Set();

  function get(k) { return k ? s[k] : { ...s }; }

  function set(patch) {
    const old = { ...s };
    if (typeof patch === 'function') {
      Object.assign(s, patch(s));
    } else {
      Object.assign(s, patch);
    }
    listeners.forEach(fn => { try { fn(s, old); } catch (e) { console.error(e); } });
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function reset() { s = initial(); listeners.forEach(fn => fn(s, {})); }

  return { get, set, subscribe, reset };
})();

/* ── Préférences persistantes (localStorage) ─────────── */
const Prefs = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.PREFS_KEY) || '{}');
    } catch { return {}; }
  },
  save(p) {
    try {
      localStorage.setItem(CONFIG.PREFS_KEY, JSON.stringify(p));
    } catch (e) { console.warn('Prefs save failed', e); }
  },
  get(key, fallback) {
    const p = this.load();
    return p[key] !== undefined ? p[key] : fallback;
  },
  set(key, val) {
    const p = this.load();
    p[key] = val;
    this.save(p);
  },
};
