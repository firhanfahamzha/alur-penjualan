/* ============================================================
   STORE.JS — State Global, Persistensi, Event Bus
   ============================================================
   - Menyimpan state sesi (user, progres, skor, dsb) di localStorage
   - Event bus sederhana untuk komunikasi antar modul
   - Migrasi versi skema
   - API: Store.get(), Store.set(), Store.patch(), Store.subscribe()
   ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY  = 'o2c.lab.state.v1';
  const SCHEMA_VERSION = 1;

  /* ---------- DEFAULT STATE ---------- */
  function defaultState() {
    return {
      _v: SCHEMA_VERSION,
      _t: Date.now(),

      /* Sesi & identitas */
      session: {
        id: 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        startedAt: Date.now(),
        finishedAt: null,
        finished: false,
      },

      /* Preferensi tampilan */
      prefs: {
        theme: 'light',            // 'light' | 'dark' | 'sepia' | 'auto'
        lang: 'mix',               // 'id' | 'en' | 'mix'
        reducedMotion: false,
        sound: true,
        confetti: true,
        fontSize: 'md',            // 'sm' | 'md' | 'lg'
        sidebarCollapsed: false,
      },

      /* Perusahaan & karakter */
      company: {
        seller: {
          name: 'PT Firhan Fahamzha Global',
          shortName: 'FFG',
          director: 'Firhan Fahamzha',
          npwp: '01.234.567.8-901.000',
          address: 'Jl. Gatot Subroto Kav. 88, Jakarta Selatan 12710',
          phone: '+62 21 5099 8800',
          email: 'sales@firhanfahamzha.co.id',
        },
        buyer: {
          name: 'Kopi Senja Group',
          shortName: 'KSG',
          manager: 'Nadia Prameswari',
          npwp: '09.876.543.2-100.000',
          address: 'Jl. Braga No. 45, Bandung 40111',
          phone: '+62 22 4200 7700',
          email: 'procurement@kopisenja.id',
        },
      },

      /* Produk yang diperdagangkan */
      product: {
        sku: 'FFG-ARG-500',
        name: 'Arabika Gayo Specialty Grade 1',
        qty: 500,
        unit: 'kg',
        pricePerKg: 285000,
        incoterms: 'FOB Medan',
        origin: 'Takengon, Aceh',
      },

      /* Nomor dokumen & timestamp */
      counters: {
        RFQ: 1, QUO: 1, PO: 1, SO: 1, DO: 1, INV: 1,
        RMA: 1, CN: 1, DN: 1, POD: 1, PRO: 1,
      },

      /* Progres global */
      progress: {
        beranda:      { visited: false, done: false, score: 0 },
        materi:       { visited: false, done: false, score: 0, opened: [] },  // array stepId
        roleplay:     { visited: false, done: false, score: 0, rounds: 0, currentStage: 0, log: [] },
        puzzle:       { visited: false, done: false, score: 0, best: 0, attempts: 0, bestTime: null, levels: {} },
        detektif:     { visited: false, done: false, score: 0, attempts: 0, bestLevel: null, found: [] },
        pencapaian:   { visited: false, done: false, score: 0 },
        pustaka:      { visited: false, done: false, score: 0 },
        pengaturan:   { visited: false, done: false, score: 0 },
      },

      /* Skor total */
      score: {
        total: 0,
        byMode: { materi: 0, roleplay: 0, puzzle: 0, detektif: 0 },
        history: [],   // { t, mode, delta, reason }
      },

      /* Badge / achievements */
      badges: {
        unlocked: {},   // id → timestamp
        progress: {},   // id → 0..1 (untuk sebagian badge)
      },

      /* Statistik roleplay */
      roleplay: {
        active: false,
        role: null,        // 'seller' | 'buyer'
        docsCreated: [],
        docsReceived: [],
        negotiation: { asking: null, offered: null, agreed: null, rounds: [] },
        stage: 0,          // 0..N
      },

      /* Puzzle */
      puzzle: {
        active: false,
        level: 'easy',     // 'easy' | 'medium' | 'hard'
        timer: 0,
        hintsUsed: 0,
        placements: {},    // slotId → docId
        bank: [],          // docId yang belum dipakai
        startedAt: null,
      },

      /* Detektif */
      detektif: {
        active: false,
        difficulty: 'easy', // 'easy' | 'medium' | 'hard'
        found: [],          // index error yang sudah ditemukan
        errors: [],         // daftar error (di-generate per sesi)
        wrongClicks: 0,
        startedAt: null,
      },

      /* Fasilitator */
      facilitator: {
        unlocked: false,
        errorCount: null,         // null = auto per difficulty
        seed: null,               // seed acak
        unlockedModes: [],        // daftar mode yang dibuka paksa
        hideScore: false,
      },

      /* Log aktivitas (untuk ekspor) */
      activity: [],   // { t, event, data }

      /* Tema tambahan */
      ui: {
        lastView: 'beranda',
        scrollPositions: {},
      },
    };
  }

  /* ---------- STATE + SUBSCRIBERS ---------- */
  let state = defaultState();
  const subscribers = new Map();      // event → Set(fn)
  const globalSubs = new Set();
  let writeScheduled = null;
  let STORAGE_OK = true;

  /* ---------- DETEKSI localStorage ---------- */
  try {
    const test = '__o2c_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
  } catch (e) {
    STORAGE_OK = false;
    if (global.console) console.warn('[store] localStorage tidak tersedia:', e.message);
  }

  /* ---------- LOAD DARI STORAGE ---------- */
  function load() {
    if (!STORAGE_OK) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      // Migrasi versi
      const migrated = migrate(parsed);
      state = deepMerge(defaultState(), migrated);
    } catch (e) {
      console.warn('[store] gagal load, memakai default', e);
      state = defaultState();
    }
  }

  /* ---------- MIGRASI SKEMA ---------- */
  function migrate(old) {
    let v = old._v || 0;
    // Contoh pola migrasi ke depan:
    // if (v < 1) { old.newField = 'x'; v = 1; }
    old._v = SCHEMA_VERSION;
    return old;
  }

  /* ---------- DEEP MERGE (state default + saved) ---------- */
  function deepMerge(base, override) {
    if (Array.isArray(base)) return Array.isArray(override) ? override.slice() : base.slice();
    if (isPlainObject(base) && isPlainObject(override)) {
      const out = { ...base };
      for (const k of Object.keys(override)) {
        if (k in base) out[k] = deepMerge(base[k], override[k]);
        else out[k] = override[k];
      }
      return out;
    }
    return override === undefined ? base : override;
  }
  function isPlainObject(o) {
    return o !== null && typeof o === 'object' && !Array.isArray(o);
  }

  /* ---------- PERSIST ---------- */
  function persistNow() {
    if (!STORAGE_OK) return;
    try {
      state._t = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[store] gagal simpan:', e);
    }
  }

  function schedulePersist() {
    if (writeScheduled) return;
    writeScheduled = setTimeout(() => {
      writeScheduled = null;
      persistNow();
    }, 120);
  }

  /* ---------- API PUBLIK ---------- */
  function get(path) {
    if (!path) return state;
    return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), state);
  }

  function set(path, value) {
    if (!path) return;
    const keys = path.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!isPlainObject(obj[k]) && !Array.isArray(obj[k])) obj[k] = {};
      obj = obj[k];
    }
    obj[keys[keys.length - 1]] = value;
    schedulePersist();
    emit(path, value);
  }

  function patch(pathOrObj, maybeObj) {
    let changes = [];
    if (typeof pathOrObj === 'string') {
      const current = get(pathOrObj);
      const merged = deepMerge(isPlainObject(current) ? current : {}, maybeObj || {});
      set(pathOrObj, merged);
      changes.push(pathOrObj);
    } else if (isPlainObject(pathOrObj)) {
      for (const k of Object.keys(pathOrObj)) {
        patch(k, pathOrObj[k]);
        changes.push(k);
      }
    }
    return changes;
  }

  function update(fn) {
    const next = fn(state);
    if (next && isPlainObject(next)) {
      state = deepMerge(state, next);
    }
    schedulePersist();
    emit('*', state);
  }

  /* ---------- EVENT BUS ---------- */
  function emit(event, payload) {
    // Subscribers spesifik
    if (subscribers.has(event)) {
      subscribers.get(event).forEach(fn => {
        try { fn(payload, event); } catch (e) { console.error('[store] sub error', e); }
      });
    }
    // Global subscribers
    globalSubs.forEach(fn => {
      try { fn(event, payload); } catch (e) { console.error('[store] glob error', e); }
    });
    // Broadcast ke window
    document.dispatchEvent(new CustomEvent('store:change', {
      detail: { event, payload, state }
    }));
  }

  function subscribe(event, fn) {
    if (typeof event === 'function') {
      globalSubs.add(event);
      return () => globalSubs.delete(event);
    }
    if (!subscribers.has(event)) subscribers.set(event, new Set());
    subscribers.get(event).add(fn);
    return () => subscribers.get(event).delete(fn);
  }

  /* ---------- RESET ---------- */
  function reset(keepPrefs) {
    const prefs = keepPrefs ? state.prefs : null;
    const fac = keepPrefs ? state.facilitator : null;
    state = defaultState();
    if (prefs) state.prefs = prefs;
    if (fac) state.facilitator = fac;
    persistNow();
    emit('*', state);
    emit('reset', null);
  }

  function resetProgress() {
    const fresh = defaultState();
    state.progress = fresh.progress;
    state.score = fresh.score;
    state.badges = fresh.badges;
    state.roleplay = fresh.roleplay;
    state.puzzle = fresh.puzzle;
    state.detektif = fresh.detektif;
    state.counters = fresh.counters;
    state.activity = [];
    persistNow();
    emit('reset:progress', null);
    emit('*', state);
  }

  /* ---------- NOMOR DOKUMEN ---------- */
  function nextDocNumber(type) {
    const c = state.counters;
    if (!c[type]) c[type] = 0;
    c[type] += 1;
    schedulePersist();
    const year = new Date().getFullYear();
    const pad = String(c[type]).padStart(4, '0');
    return `${type}/${state.company.seller.shortName}/${year}/${pad}`;
  }

  /* ---------- SKOR & BADGE ---------- */
  function addScore(delta, mode, reason) {
    if (!delta) return;
    const s = state.score;
    s.total = Math.max(0, s.total + delta);
    if (mode && s.byMode[mode] !== undefined) {
      s.byMode[mode] = Math.max(0, s.byMode[mode] + delta);
    }
    s.history.push({ t: Date.now(), mode: mode || null, delta, reason: reason || '' });
    if (s.history.length > 200) s.history = s.history.slice(-200);
    schedulePersist();
    emit('score', { total: s.total, delta, mode, reason });

    // Broadcast ke UI global
    document.dispatchEvent(new CustomEvent('score:change', {
      detail: { total: s.total, delta, mode, reason }
    }));
  }

  function unlockBadge(id) {
    if (state.badges.unlocked[id]) return false;
    state.badges.unlocked[id] = Date.now();
    schedulePersist();
    emit('badge', { id });
    document.dispatchEvent(new CustomEvent('badge:unlocked', { detail: { id } }));
    return true;
  }

  function isBadgeUnlocked(id) {
    return !!state.badges.unlocked[id];
  }

  /* ---------- ACTIVITY LOG ---------- */
  function log(event, data) {
    state.activity.push({ t: Date.now(), event, data: data || null });
    if (state.activity.length > 500) state.activity = state.activity.slice(-500);
    schedulePersist();
  }

  /* ---------- PROGRESS ---------- */
  function markVisited(view) {
    if (state.progress[view] && !state.progress[view].visited) {
      state.progress[view].visited = true;
      schedulePersist();
      emit('progress', { view });
    }
  }
  function markDone(view, scoreDelta) {
    const p = state.progress[view];
    if (!p) return;
    p.done = true;
    if (typeof scoreDelta === 'number') p.score = (p.score || 0) + scoreDelta;
    schedulePersist();
    emit('progress', { view, done: true });
  }

  /* ---------- EXPORT / IMPORT ---------- */
  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }
  function importJSON(json) {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      if (!parsed || typeof parsed !== 'object') throw new Error('bukan objek');
      state = deepMerge(defaultState(), migrate(parsed));
      persistNow();
      emit('*', state);
      return true;
    } catch (e) {
      console.warn('[store] import gagal:', e);
      return false;
    }
  }

  /* ---------- INIT ---------- */
  load();

  // Sinkron antar-tab
  if (STORAGE_OK && global.addEventListener) {
    global.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        state = deepMerge(defaultState(), migrate(parsed));
        emit('*', state);
        emit('external', null);
      } catch (_) {}
    });
  }

  // Simpan sebelum halaman ditutup
  global.addEventListener('beforeunload', persistNow);

  /* ---------- EXPORT ---------- */
  global.Store = {
    // Core
    get, set, patch, update, reset, resetProgress,
    subscribe,
    // Util
    nextDocNumber, addScore, unlockBadge, isBadgeUnlocked,
    log, markVisited, markDone,
    exportJSON, importJSON,
    // Shortcut
    STORAGE_KEY, SCHEMA_VERSION,
    _state: () => state,
    _persistNow: persistNow,
  };

})(window);