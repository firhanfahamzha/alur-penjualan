/* ============================================================
   PUZZLE.JS — Puzzle Alur Dokumen (Drag & Drop)
   ============================================================
   Fitur:
   - 3 level: easy (8 kartu), medium (12), hard (18, ikon saja)
   - Drag & drop via Pointer Events (mouse + touch)
   - Timer, hint (3×), skor bintang, mode ikon saja
   - Validasi dengan feedback visual (hijau/getar/confetti)
   - Best score per level tersimpan di Store
   - Dua mode: KLASIK (acak slot kosong) & SCAFFOLD (ada slot berlabel)
   ============================================================ */

(function (global) {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ============================================================
     1. DATA — DOKUMEN & URUTAN BENAR
     ============================================================ */
  // Urutan kanonik Order-to-Cash (indeks makin besar = makin akhir)
  const ORDER = [
    { key: 'rfq',           icon: '📄', stage: 1, name: { id: 'RFQ dari Pembeli',         en: 'RFQ from Buyer',         mix: 'RFQ' } },
    { key: 'quotation',     icon: '📑', stage: 1, name: { id: 'Quotation / Penawaran',    en: 'Quotation',              mix: 'Quotation' } },
    { key: 'supporting',    icon: '📎', stage: 1, name: { id: 'Supporting Documents',     en: 'Supporting Documents',   mix: 'Supporting Docs' } },
    { key: 'po',            icon: '📥', stage: 2, name: { id: 'Purchase Order (PO)',      en: 'Purchase Order',         mix: 'PO' } },
    { key: 'so',            icon: '🔄', stage: 2, name: { id: 'Sales Order (Internal)',   en: 'Sales Order (Internal)', mix: 'Sales Order' } },
    { key: 'contract',      icon: '📜', stage: 2, name: { id: 'Kontrak Jual-Beli',        en: 'Sales Contract',         mix: 'Kontrak' } },
    { key: 'credit',        icon: '📊', stage: 2, name: { id: 'Credit Check Report',      en: 'Credit Check Report',    mix: 'Credit Check' } },
    { key: 'picking',       icon: '📋', stage: 3, name: { id: 'Picking List',             en: 'Picking List',           mix: 'Picking List' } },
    { key: 'packing',       icon: '📦', stage: 3, name: { id: 'Packing List',             en: 'Packing List',           mix: 'Packing List' } },
    { key: 'do',            icon: '🚛', stage: 3, name: { id: 'Surat Jalan (DO)',         en: 'Delivery Order',         mix: 'Surat Jalan' } },
    { key: 'bol',           icon: '✈️', stage: 3, name: { id: 'Bill of Lading / AWB',     en: 'Bill of Lading / AWB',   mix: 'B/L / AWB' } },
    { key: 'pod',           icon: '✅', stage: 3, name: { id: 'Proof of Delivery (POD)',  en: 'Proof of Delivery',      mix: 'POD' } },
    { key: 'proforma',      icon: '🧾', stage: 4, name: { id: 'Proforma Invoice',         en: 'Proforma Invoice',       mix: 'Proforma Invoice' } },
    { key: 'invoice',       icon: '📄', stage: 4, name: { id: 'Invoice Resmi',            en: 'Official Invoice',       mix: 'Invoice' } },
    { key: 'remittance',    icon: '✉️', stage: 4, name: { id: 'Remittance Advice',        en: 'Remittance Advice',      mix: 'Remittance' } },
    { key: 'bank',          icon: '🏦', stage: 4, name: { id: 'Bukti Transfer Bank',      en: 'Bank Transfer Proof',    mix: 'Bukti Bank' } },
    { key: 'rma',           icon: '↩️', stage: 5, name: { id: 'RMA (Return Auth.)',       en: 'RMA',                    mix: 'RMA' } },
    { key: 'credit-note',   icon: '📝', stage: 5, name: { id: 'Credit Note',              en: 'Credit Note',            mix: 'Credit Note' } },
  ];

  const LEVELS = {
    easy:   { count: 8,  iconOnly: false, time: 240, slots: 8,  label: { id: 'Pemula',  en: 'Easy',   mix: 'Easy'   } },
    medium: { count: 12, iconOnly: false, time: 300, slots: 12, label: { id: 'Menengah', en: 'Medium', mix: 'Medium' } },
    hard:   { count: 18, iconOnly: true,  time: 420, slots: 18, label: { id: 'Mahir',   en: 'Hard',   mix: 'Hard'   } },
  };

  // Ambil subset yang representatif untuk easy/medium
  function pickSubset(level) {
    const lvl = LEVELS[level];
    if (level === 'easy') {
      // 8 dokumen inti
      const keys = ['rfq', 'quotation', 'po', 'so', 'do', 'pod', 'invoice', 'bank'];
      return keys.map(k => ORDER.find(d => d.key === k));
    }
    if (level === 'medium') {
      // 12 dokumen penting
      const keys = ['rfq', 'quotation', 'po', 'so', 'contract', 'credit', 'picking', 'do', 'pod', 'invoice', 'remittance', 'bank'];
      return keys.map(k => ORDER.find(d => d.key === k));
    }
    return ORDER.slice(); // hard: semua
  }

  /* ============================================================
     2. STATE RUNTIME
     ============================================================ */
  const state = {
    active: false,
    level: 'easy',
    docs: [],             // subset dokumen yang dipakai
    shuffled: [],         // urutan acak untuk bank
    slots: [],            // array of docKey | null
    hintsUsed: 0,
    attempts: 0,
    maxHints: 3,
    timer: 0,
    timerInterval: null,
    startedAt: null,
    finishedAt: null,
    dragging: null,       // { key, from: 'bank' | 'slot', slotIdx }
    ghostEl: null,
    offsetX: 0,
    offsetY: 0,
    validated: false,
    soundOn: true,
  };

  /* ============================================================
     3. UTIL
     ============================================================ */
  const t = (obj) => {
    if (!obj) return '';
    const lang = (global.I18N && I18N.get && I18N.get()) || 'mix';
    return obj[lang] || obj.mix || obj.id || obj.en || '';
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  /* ============================================================
     4. RENDER ROOT
     ============================================================ */
  function render() {
    const mount = document.getElementById('puzzleMount');
    if (!mount) return;

    if (!state.active) {
      mount.innerHTML = renderLevelChooser();
      bindLevelChooser();
      return;
    }
    mount.innerHTML = renderBoard();
    bindBoard();
    renderBank();
    renderSlots();
    updateHUD();
  }

  /* ============================================================
     5. LEVEL CHOOSER
     ============================================================ */
  function renderLevelChooser() {
    const best = (global.Store && Store.get('puzzle.levels')) || {};
    const totalBest = (global.Store && Store.get('puzzle.best')) || 0;

    const levelCards = ['easy', 'medium', 'hard'].map(lvl => {
      const cfg = LEVELS[lvl];
      const b = best[lvl] || { stars: 0, time: null, score: 0 };
      const starsHtml = [1, 2, 3].map(i =>
        '<span class="star' + (b.stars >= i ? ' is-on' : '') + '">★</span>'
      ).join('');

      return (
        '<div class="pz-level-card pz-level-card--' + lvl + '" data-level="' + lvl + '">' +
          '<div class="pz-level-card__icon">' + (lvl === 'easy' ? '🌱' : lvl === 'medium' ? '🔥' : '💎') + '</div>' +
          '<div class="pz-level-card__title">' + esc(t(cfg.label)) + '</div>' +
          '<div class="pz-level-card__sub">' + cfg.count + ' ' + t({ id: 'dokumen', en: 'documents', mix: 'docs' }) + ' · ' + Math.floor(cfg.time / 60) + ' ' + t({ id: 'menit', en: 'min', mix: 'menit' }) + '</div>' +
          '<ul class="pz-level-card__features">' +
            '<li>' + (cfg.iconOnly ? '🎯 ' + t({ id: 'Mode ikon saja (tanpa nama)', en: 'Icon-only mode', mix: 'Icon-only' }) : '📝 ' + t({ id: 'Ada nama dokumen', en: 'Document names shown', mix: 'Ada nama' })) + '</li>' +
            '<li>🖱️ ' + t({ id: 'Drag & drop / tap', en: 'Drag & drop / tap', mix: 'Drag & drop / tap' }) + '</li>' +
            '<li>💡 ' + t({ id: '3× hint tersedia', en: '3 hints available', mix: '3× hint' }) + '</li>' +
          '</ul>' +
          '<div class="pz-level-card__best">' +
            '<span style="font-size:11px;color:var(--text-3);font-weight:800;letter-spacing:.4px;text-transform:uppercase">' + t({ id: 'Best', en: 'Best', mix: 'Best' }) + '</span>' +
            '<div class="stars">' + starsHtml + '</div>' +
            (b.time ? '<span style="font-size:11px;color:var(--text-3);font-family:var(--ff-mono)">' + fmtTime(b.time) + ' · ' + b.score + ' pt</span>' : '<span style="font-size:11px;color:var(--text-3);font-style:italic">' + t({ id: 'Belum dimainkan', en: 'Not played yet', mix: 'Belum dimainkan' }) + '</span>') +
          '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="pz-intro mb-5">' +
        '<div class="card card--flat" style="background:linear-gradient(135deg,var(--amber-soft),var(--primary-soft))">' +
          '<div class="card__body" style="display:flex;gap:var(--s-5);flex-wrap:wrap;align-items:flex-start">' +
            '<div style="font-size:48px;line-height:1">🧩</div>' +
            '<div style="flex:1;min-width:260px">' +
              '<div style="font-size:18px;font-weight:800;margin-bottom:6px">' + t({ id: 'Susun Alur Dokumen', en: 'Arrange the Document Flow', mix: 'Susun Alur Dokumen' }) + '</div>' +
              '<p style="font-size:13.5px;line-height:1.65;color:var(--text-2);margin:0 0 12px">' +
                t({
                  id: 'Seret kartu dokumen ke slot yang benar sesuai urutan Order-to-Cash. Semakin cepat & sedikit hint, semakin tinggi skormu.',
                  en: 'Drag document cards to the correct slot in Order-to-Cash sequence. Faster & fewer hints = higher score.',
                  mix: 'Drag kartu ke slot yang benar sesuai urutan O2C. Makin cepat & sedikit hint, makin tinggi skor.'
                }) +
              '</p>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
                '<span class="chip">🖱️ ' + t({ id: 'Mouse & touch', en: 'Mouse & touch', mix: 'Mouse & touch' }) + '</span>' +
                '<span class="chip">⏱️ ' + t({ id: 'Timer', en: 'Timer', mix: 'Timer' }) + '</span>' +
                '<span class="chip">⭐ ' + t({ id: 'Skor bintang', en: 'Star score', mix: 'Stars' }) + '</span>' +
                '<span class="chip">💡 ' + t({ id: 'Hint 3×', en: '3 hints', mix: '3 hints' }) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="pz-level-grid mt-5">' + levelCards + '</div>' +

        (totalBest > 0
          ? '<div class="callout callout--ok mt-5"><div class="callout__icon">🏅</div><div class="callout__body"><b>' + t({ id: 'Total skor puzzle', en: 'Total puzzle score', mix: 'Total skor puzzle' }) + '</b><p>' + totalBest + ' poin</p></div></div>'
          : '') +
      '</div>' +

      '<style>' +
      '.pz-level-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--s-4)}' +
      '.pz-level-card{padding:var(--s-5);border:1.5px solid var(--border);border-radius:var(--r-lg);background:var(--surface);cursor:pointer;transition:all .25s;display:flex;flex-direction:column;gap:8px}' +
      '.pz-level-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-3)}' +
      '.pz-level-card--easy:hover{border-color:var(--green)}' +
      '.pz-level-card--medium:hover{border-color:var(--amber)}' +
      '.pz-level-card--hard:hover{border-color:var(--violet)}' +
      '.pz-level-card__icon{font-size:38px;line-height:1}' +
      '.pz-level-card__title{font-size:17px;font-weight:800;color:var(--text)}' +
      '.pz-level-card__sub{font-size:12px;color:var(--text-3);margin-bottom:6px}' +
      '.pz-level-card__features{list-style:none;padding:0;margin:6px 0;display:flex;flex-direction:column;gap:5px}' +
      '.pz-level-card__features li{font-size:12.5px;color:var(--text-2);padding:2px 0}' +
      '.pz-level-card__best{margin-top:auto;padding-top:12px;border-top:1px dashed var(--border);display:flex;flex-direction:column;gap:4px;align-items:flex-start}' +
      '</style>'
    );
  }

  function bindLevelChooser() {
    $$('[data-level]').forEach(card => {
      card.addEventListener('click', () => {
        startGame(card.dataset.level);
      });
    });
  }

  /* ============================================================
     6. START GAME
     ============================================================ */
  function startGame(level) {
    const cfg = LEVELS[level];
    if (!cfg) level = 'easy';

    state.active = true;
    state.level = level;
    state.docs = pickSubset(level);
    state.shuffled = shuffle(state.docs.map(d => d.key));
    state.slots = new Array(cfg.slots).fill(null);
    state.hintsUsed = 0;
    state.attempts = 0;
    state.timer = 0;
    state.startedAt = Date.now();
    state.finishedAt = null;
    state.validated = false;
    state.dragging = null;

    // Simpan ke store
    if (global.Store) {
      Store.set('puzzle.active', true);
      Store.set('puzzle.level', level);
      Store.set('puzzle.startedAt', Date.now());
      Store.markVisited('puzzle');
    }

    startTimer();
    render();

    if (global.App) App.toast('info', '🧩 ' + t(cfg.label), t({ id: 'Susun dokumen sesuai urutan!', en: 'Arrange documents in order!', mix: 'Susun dokumen sesuai urutan!' }));
  }

  /* ============================================================
     7. TIMER
     ============================================================ */
  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      state.timer += 1;
      const cfg = LEVELS[state.level];
      // Waktu habis?
      if (state.timer >= cfg.time) {
        stopTimer();
        timeUp();
        return;
      }
      updateTimerDisplay();
    }, 1000);
  }
  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }
  function updateTimerDisplay() {
    const el = document.getElementById('pzTimer');
    if (!el) return;
    const cfg = LEVELS[state.level];
    const remaining = Math.max(0, cfg.time - state.timer);
    el.textContent = fmtTime(remaining);
    el.classList.toggle('is-warn', remaining <= 60 && remaining > 20);
    el.classList.toggle('is-danger', remaining <= 20);
  }

  function timeUp() {
    if (global.App) {
      App.toast('bad', t({ id: 'Waktu habis!', en: 'Time up!', mix: 'Waktu habis!' }), t({ id: 'Coba lagi.', en: 'Try again.', mix: 'Coba lagi.' }));
    }
    state.validated = true;
    // Hitung berapa yang sudah benar
    const correct = state.slots.filter((k, i) => k === state.docs[i].key).length;
    showResult({
      stars: 0,
      score: 0,
      correct,
      total: state.docs.length,
      timeUp: true,
    });
  }

  /* ============================================================
     8. RENDER BOARD
     ============================================================ */
  function renderBoard() {
    const cfg = LEVELS[state.level];
    const levelLabel = t(cfg.label);
    const iconOnly = cfg.iconOnly;

    return (
      '<div class="pz-hud mb-4">' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">⏱️ ' + t({ id: 'Waktu', en: 'Time', mix: 'Time' }) + '</span>' +
          '<span class="pz-hud__val" id="pzTimer">--:--</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">🎯 ' + t({ id: 'Level', en: 'Level', mix: 'Level' }) + '</span>' +
          '<span class="pz-hud__val">' + esc(levelLabel) + '</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">✅ ' + t({ id: 'Terisi', en: 'Filled', mix: 'Filled' }) + '</span>' +
          '<span class="pz-hud__val" id="pzFilled">0/' + state.docs.length + '</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">💡 ' + t({ id: 'Hint', en: 'Hint', mix: 'Hint' }) + '</span>' +
          '<span class="pz-hud__val" id="pzHintCount">' + (state.maxHints - state.hintsUsed) + '/' + state.maxHints + '</span>' +
        '</div>' +
        '<div class="pz-hud__spacer"></div>' +
        '<button class="btn btn--sm btn--ghost" id="btnPzHint">💡 ' + t({ id: 'Hint', en: 'Hint', mix: 'Hint' }) + '</button>' +
        '<button class="btn btn--sm btn--ghost" id="btnPzReset">🔄 ' + t({ id: 'Ulang', en: 'Reset', mix: 'Reset' }) + '</button>' +
        '<button class="btn btn--sm btn--danger" id="btnPzExit">✕ ' + t({ id: 'Keluar', en: 'Exit', mix: 'Exit' }) + '</button>' +
      '</div>' +

      '<div class="pz-board">' +
        /* BANK kiri */
        '<div class="pz-bank" id="pzBank">' +
          '<div class="pz-bank__title">' +
            '<span>📦 ' + t({ id: 'Kartu Tersedia', en: 'Available Cards', mix: 'Kartu' }) + '</span>' +
            '<b id="pzBankCount">' + state.shuffled.length + '</b>' +
          '</div>' +
          '<div id="pzBankList"></div>' +
        '</div>' +

        /* SLOTS kanan */
        '<div class="pz-slots" id="pzSlots">' +
          state.docs.map((_, i) => renderSlotHTML(i, iconOnly)).join('') +
        '</div>' +
      '</div>' +

      '<div id="pzActionBar" class="pz-action-bar mt-5" hidden>' +
        '<button class="btn btn--primary btn--lg" id="btnPzValidate">✅ ' + t({ id: 'Validasi Urutan', en: 'Validate Order', mix: 'Validasi' }) + '</button>' +
        '<span style="font-size:12.5px;color:var(--text-3);text-align:center">' + t({ id: 'Pastikan semua slot terisi sebelum validasi.', en: 'Fill all slots before validating.', mix: 'Isi semua slot dulu sebelum validasi.' }) + '</span>' +
      '</div>' +

      '<style>' +
      '.pz-action-bar{display:flex;flex-direction:column;align-items:center;gap:8px;padding:var(--s-5);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow-1)}' +
      '.pz-card{position:relative;touch-action:none}' +
      '.pz-card.is-locked{opacity:.5;pointer-events:none}' +
      '.pz-card.is-selected{outline:3px solid var(--primary);outline-offset:2px}' +
      '.pz-card--icon-only{padding:14px}' +
      '.pz-card--icon-only .pz-card__icon{font-size:30px}' +
      '.pz-ghost{position:fixed!important;z-index:9999!important;pointer-events:none;transform:rotate(-4deg) scale(1.05);box-shadow:0 20px 40px rgba(0,0,0,.3);opacity:.95;transition:none!important}' +
      '.pz-slot.is-hint{border-color:var(--amber);background:var(--amber-soft);animation:pulseSoft 1s ease-in-out infinite}' +
      '</style>'
    );
  }

  function renderSlotHTML(idx, iconOnly) {
    const docKey = state.slots[idx];
    return (
      '<div class="pz-slot" data-slot="' + idx + '">' +
        '<div class="pz-slot__num">' + (idx + 1) + '</div>' +
        '<div class="pz-slot__zone" data-zone="' + idx + '">' +
          (docKey ? '' : '<span>' + t({ id: 'Letakkan di sini', en: 'Drop here', mix: 'Drop here' }) + '</span>') +
        '</div>' +
      '</div>'
    );
  }

  function renderBank() {
    const list = document.getElementById('pzBankList');
    if (!list) return;
    const iconOnly = LEVELS[state.level].iconOnly;

    // Hitung key yang sudah terpakai di slot
    const used = new Set(state.slots.filter(Boolean));
    const available = state.shuffled.filter(k => !used.has(k));

    // Update counter
    const counter = document.getElementById('pzBankCount');
    if (counter) counter.textContent = available.length;

    if (!available.length) {
      list.innerHTML = '<div class="pz-empty">🎉 ' + t({ id: 'Semua kartu sudah dipasang.', en: 'All cards placed.', mix: 'Semua kartu sudah dipasang.' }) + '</div>';
    } else {
      list.innerHTML = available.map(k => renderCardHTML(k, 'bank', -1, iconOnly)).join('');
    }

    // Bind drag di bank
    list.querySelectorAll('.pz-card').forEach(card => bindCardPointer(card));
  }

  function renderSlots() {
    const container = document.getElementById('pzSlots');
    if (!container) return;
    const iconOnly = LEVELS[state.level].iconOnly;

    // Re-render seluruh slot
    container.innerHTML = state.slots.map((docKey, i) => {
      return (
        '<div class="pz-slot' + (docKey ? ' is-filled' : '') + '" data-slot="' + i + '">' +
          '<div class="pz-slot__num">' + (i + 1) + '</div>' +
          '<div class="pz-slot__zone" data-zone="' + i + '">' +
            (docKey
              ? renderCardHTML(docKey, 'slot', i, iconOnly)
              : '<span>' + t({ id: 'Letakkan di sini', en: 'Drop here', mix: 'Drop here' }) + '</span>') +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Bind pointer untuk kartu di slot (bisa diambil kembali)
    container.querySelectorAll('.pz-card').forEach(card => bindCardPointer(card));

    // Bind drop target di zone
    container.querySelectorAll('.pz-slot__zone').forEach(zone => {
      bindDropZone(zone);
    });

    // Update filled counter
    const filled = state.slots.filter(Boolean).length;
    const filledEl = document.getElementById('pzFilled');
    if (filledEl) filledEl.textContent = filled + '/' + state.docs.length;

    // Tampilkan action bar kalau semua terisi
    const bar = document.getElementById('pzActionBar');
    if (bar) bar.hidden = !(filled === state.docs.length && filled > 0);
  }

  function renderCardHTML(docKey, from, slotIdx, iconOnly) {
    const doc = state.docs.find(d => d.key === docKey);
    if (!doc) return '';
    const body = iconOnly
      ? ''
      : (
        '<div class="pz-card__body">' +
          '<div class="pz-card__name">' + esc(t(doc.name)) + '</div>' +
          '<div class="pz-card__hint">' + t({ id: 'Tahap ', en: 'Stage ', mix: 'Tahap ' }) + doc.stage + '</div>' +
        '</div>'
      );
    return (
      '<div class="pz-card' + (iconOnly ? ' pz-card--icon-only' : '') + '" ' +
        'data-key="' + esc(doc.key) + '" data-from="' + from + '" data-slot="' + slotIdx + '" ' +
        'style="--accent:' + stageColor(doc.stage) + '">' +
        '<div class="pz-card__icon">' + doc.icon + '</div>' +
        body +
      '</div>'
    );
  }

  function stageColor(stage) {
    return ['#1e5f8e', '#1d7a8c', '#2a8e6c', '#b9772c', '#8f4e8c'][stage - 1] || '#2a7de1';
  }

  /* ============================================================
     9. POINTER DRAG & DROP
     ============================================================ */
  function bindCardPointer(card) {
    card.addEventListener('pointerdown', onCardPointerDown);
  }

  function onCardPointerDown(e) {
    if (state.validated) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const docKey = card.dataset.key;
    const from = card.dataset.from;
    const slotIdx = Number(card.dataset.slot);

    // Kalau di slot, klik cepat = ambil kembali tanpa drag
    state.dragging = {
      key: docKey,
      from,
      slotIdx,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
      originRect: rect,
    };
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;

    // Set pointer capture
    try { card.setPointerCapture(e.pointerId); } catch (_) {}

    // Listen global moves
    document.addEventListener('pointermove', onCardPointerMove);
    document.addEventListener('pointerup', onCardPointerUp);
    document.addEventListener('pointercancel', onCardPointerUp);

    e.preventDefault();
  }

  function onCardPointerMove(e) {
    if (!state.dragging) return;
    const dx = e.clientX - state.dragging.startX;
    const dy = e.clientY - state.dragging.startY;
    const dist = Math.hypot(dx, dy);

    // Threshold drag
    if (!state.dragging.hasMoved && dist < 6) return;

    if (!state.dragging.hasMoved) {
      state.dragging.hasMoved = true;
      createGhost(e);
    }

    // Pindahkan ghost
    if (state.ghostEl) {
      state.ghostEl.style.left = (e.clientX - state.offsetX) + 'px';
      state.ghostEl.style.top  = (e.clientY - state.offsetY) + 'px';
    }

    // Highlight drop target
    highlightDropTarget(e.clientX, e.clientY);
  }

  function createGhost(e) {
    const original = document.querySelector('.pz-card[data-key="' + state.dragging.key + '"][data-from="' + state.dragging.from + '"]');
    const source = original || state.dragging.element;
    if (!source) return;
    const rect = state.dragging.originRect;
    const ghost = source.cloneNode(true);
    ghost.classList.add('pz-ghost');
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    document.body.appendChild(ghost);
    state.ghostEl = ghost;

    // Sembunyikan kartu asli
    if (source) source.style.opacity = '0.3';
    state.dragging.element = source;
  }

  function highlightDropTarget(x, y) {
    // Hapus highlight lama
    $$('.pz-slot.is-over').forEach(s => s.classList.remove('is-over'));
    const el = document.elementFromPoint(x, y);
    if (!el) return;
    const slot = el.closest('.pz-slot');
    if (slot) slot.classList.add('is-over');
  }

  function onCardPointerUp(e) {
    document.removeEventListener('pointermove', onCardPointerMove);
    document.removeEventListener('pointerup', onCardPointerUp);
    document.removeEventListener('pointercancel', onCardPointerUp);

    if (!state.dragging) return;
    const d = state.dragging;

    // Clean up ghost
    if (state.ghostEl) {
      state.ghostEl.remove();
      state.ghostEl = null;
    }
    if (d.element) d.element.style.opacity = '';

    // Cari target
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el ? el.closest('.pz-slot') : null;
    $$('.pz-slot.is-over').forEach(s => s.classList.remove('is-over'));

    // Kalau tidak pindah (klik saja)
    if (!d.hasMoved) {
      handleTap(d);
    } else {
      // Drop
      if (slot) {
        const targetIdx = Number(slot.dataset.slot);
        dropCard(d.key, d.from, d.slotIdx, targetIdx);
      } else if (d.from === 'slot') {
        // Drop di luar → kembalikan ke bank
        returnToBank(d.slotIdx);
      }
    }

    state.dragging = null;
  }

  function handleTap(d) {
    // Tap = klik cepat. Kalau di bank → cari slot kosong pertama & taruh.
    // Kalau di slot → kembalikan ke bank.
    if (d.from === 'bank') {
      const emptyIdx = state.slots.indexOf(null);
      if (emptyIdx === -1) {
        if (global.App) App.toast('warn', t({ id: 'Tidak ada slot kosong', en: 'No empty slot', mix: 'Nggak ada slot kosong' }));
        return;
      }
      dropCard(d.key, 'bank', -1, emptyIdx);
    } else if (d.from === 'slot') {
      returnToBank(d.slotIdx);
    }
  }

  function dropCard(docKey, from, fromSlotIdx, toSlotIdx) {
    if (state.validated) return;
    // Kalau drop ke slot yang sama
    if (from === 'slot' && fromSlotIdx === toSlotIdx) return;

    const targetKey = state.slots[toSlotIdx];

    // Update slot target
    state.slots[toSlotIdx] = docKey;

    // Kalau dari slot lain
    if (from === 'slot' && fromSlotIdx >= 0) {
      state.slots[fromSlotIdx] = targetKey || null;
      // Kalau target ada isinya, tukar posisi
      if (targetKey && fromSlotIdx !== toSlotIdx) {
        // Sudah ditukar di atas
      }
    }

    // Rerender + bind
    renderBank();
    renderSlots();

    // Sound? Feedback kecil
    playClick();
  }

  function returnToBank(slotIdx) {
    if (slotIdx < 0 || slotIdx >= state.slots.length) return;
    if (!state.slots[slotIdx]) return;
    state.slots[slotIdx] = null;
    renderBank();
    renderSlots();
  }

  /* ============================================================
     10. BIND BOARD
     ============================================================ */
  function bindBoard() {
    // Validate
    const btnVal = document.getElementById('btnPzValidate');
    if (btnVal) btnVal.addEventListener('click', validate);

    // Hint
    const btnHint = document.getElementById('btnPzHint');
    if (btnHint) btnHint.addEventListener('click', useHint);

    // Reset
    const btnReset = document.getElementById('btnPzReset');
    if (btnReset) btnReset.addEventListener('click', resetGame);

    // Exit
    const btnExit = document.getElementById('btnPzExit');
    if (btnExit) btnExit.addEventListener('click', confirmExit);

    // Update timer display pertama kali
    setTimeout(updateTimerDisplay, 100);
  }

  function updateHUD() {
    const hintEl = document.getElementById('pzHintCount');
    if (hintEl) hintEl.textContent = (state.maxHints - state.hintsUsed) + '/' + state.maxHints;
    updateTimerDisplay();
  }

  /* ============================================================
     11. HINT
     ============================================================ */
  function useHint() {
    if (state.validated) return;
    if (state.hintsUsed >= state.maxHints) {
      if (global.App) App.toast('warn', t({ id: 'Hint habis', en: 'No hints left', mix: 'Hint habis' }));
      return;
    }

    // Cari slot pertama yang kosong/salah
    let targetIdx = -1;
    for (let i = 0; i < state.docs.length; i++) {
      if (state.slots[i] !== state.docs[i].key) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) {
      if (global.App) App.toast('ok', t({ id: 'Semua sudah benar!', en: 'All correct!', mix: 'Semua benar!' }));
      return;
    }

    const correctKey = state.docs[targetIdx].key;

    // 1) Kembalikan kartu yang salah di slot ini ke bank
    if (state.slots[targetIdx] && state.slots[targetIdx] !== correctKey) {
      state.slots[targetIdx] = null;
    }

    // 2) Cari kartu correctKey di slot lain, kalau ada pindahkan ke bank
    for (let i = 0; i < state.slots.length; i++) {
      if (i !== targetIdx && state.slots[i] === correctKey) {
        state.slots[i] = null;
      }
    }

    // 3) Taruh correctKey di targetIdx
    state.slots[targetIdx] = correctKey;

    state.hintsUsed++;
    updateHUD();
    renderBank();
    renderSlots();

    // Highlight slot
    const slotEl = document.querySelector('.pz-slot[data-slot="' + targetIdx + '"]');
    if (slotEl) {
      slotEl.classList.add('is-hint');
      setTimeout(() => slotEl.classList.remove('is-hint'), 2500);
    }

    if (global.App) {
      App.toast('info', '💡 ' + t({ id: 'Hint dipakai', en: 'Hint used', mix: 'Hint dipakai' }),
        t({ id: 'Slot ' + (targetIdx + 1) + ' sudah diisi otomatis.', en: 'Slot ' + (targetIdx + 1) + ' auto-filled.', mix: 'Slot ' + (targetIdx + 1) + ' auto-isi.' }));
    }
  }

  /* ============================================================
     12. VALIDASI
     ============================================================ */
  function validate() {
    if (state.validated) return;
    const filled = state.slots.filter(Boolean).length;
    if (filled < state.docs.length) {
      if (global.App) App.toast('warn', t({ id: 'Masih ada slot kosong', en: 'Some slots are empty', mix: 'Masih ada slot kosong' }));
      return;
    }

    state.attempts++;
    state.validated = true;

    // Cek setiap slot
    let correctCount = 0;
    const wrongIndices = [];
    state.slots.forEach((key, i) => {
      const ok = key === state.docs[i].key;
      if (ok) correctCount++;
      else wrongIndices.push(i);
    });

    // Update tampilan
    $$('.pz-slot').forEach((slot, i) => {
      const ok = state.slots[i] === state.docs[i].key;
      slot.classList.toggle('is-correct', ok);
      slot.classList.toggle('is-wrong', !ok);
    });

    if (correctCount === state.docs.length) {
      // SUKSES
      stopTimer();
      state.finishedAt = Date.now();
      setTimeout(() => success(), 700);
    } else {
      // GAGAL — beri kesempatan coba lagi
      playWrong();
      if (global.App) {
        App.toast('bad',
          '❌ ' + t({ id: 'Belum tepat', en: 'Not quite', mix: 'Belum tepat' }),
          correctCount + '/' + state.docs.length + ' ' + t({ id: 'sudah benar', en: 'correct', mix: 'benar' })
        );
      }
      // Beri kesempatan: reset status validasi setelah 2 detik (kecuali user menekan ulang)
      setTimeout(() => {
        state.validated = false;
        $$('.pz-slot').forEach(s => s.classList.remove('is-correct', 'is-wrong'));
        // Sembunyikan action bar? Tidak, biarkan user perbaiki lalu validasi lagi
      }, 2400);
    }
  }

  function playClick() {
    if (!state.soundOn || !global.AudioContext) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 440;
      o.type = 'sine';
      g.gain.value = 0.05;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.stop(ctx.currentTime + 0.09);
    } catch (_) {}
  }

  function playWrong() {
    if (!state.soundOn || !global.AudioContext) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 180;
      o.type = 'sawtooth';
      g.gain.value = 0.06;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.stop(ctx.currentTime + 0.26);
    } catch (_) {}
  }

  function playWin() {
    if (!state.soundOn || !global.AudioContext) return;
    try {
      const ctx = new AudioContext();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = freq;
        o.type = 'sine';
        g.gain.value = 0.06;
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        o.stop(ctx.currentTime + i * 0.12 + 0.32);
      });
    } catch (_) {}
  }

  /* ============================================================
     13. SUKSES + SKOR
     ============================================================ */
  function success() {
    const cfg = LEVELS[state.level];
    const elapsed = state.timer;
    const remaining = Math.max(0, cfg.time - elapsed);

    // Hitung bintang
    let stars = 3;
    if (state.hintsUsed >= 3 || elapsed > cfg.time * 0.75) stars = 1;
    else if (state.hintsUsed >= 1 || elapsed > cfg.time * 0.5) stars = 2;

    // Skor
    const baseScore = { easy: 100, medium: 200, hard: 350 }[state.level];
    const timeBonus = Math.round((remaining / cfg.time) * baseScore * 0.5);
    const hintPenalty = state.hintsUsed * 20;
    const attemptPenalty = Math.max(0, state.attempts - 1) * 30;
    const finalScore = Math.max(20, baseScore + timeBonus - hintPenalty - attemptPenalty);

    playWin();
    if (global.App && App.confetti) App.confetti({ count: 100, duration: 3 });

    // Simpan ke Store
    if (global.Store) {
      const oldBest = Store.get('puzzle.levels.' + state.level) || { stars: 0, time: null, score: 0 };
      const isNewBest = finalScore > (oldBest.score || 0) || (finalScore === oldBest.score && (!oldBest.time || elapsed < oldBest.time));
      if (isNewBest) {
        Store.set('puzzle.levels.' + state.level, { stars, time: elapsed, score: finalScore });
      }
      const totalBest = Math.max(
        Store.get('puzzle.best') || 0,
        finalScore
      );
      Store.set('puzzle.best', totalBest);
      Store.addScore(finalScore, 'puzzle', 'Level: ' + state.level);
      Store.markDone('puzzle');
      Store.log('puzzle:finish', { level: state.level, time: elapsed, score: finalScore, stars });

      if (stars === 3) Store.unlockBadge('puzzle_master');
      if (state.level === 'hard' && stars >= 2) Store.unlockBadge('puzzle_hard');
      if (state.hintsUsed === 0) Store.unlockBadge('puzzle_no_hint');
    }

    showResult({
      stars,
      score: finalScore,
      correct: state.docs.length,
      total: state.docs.length,
      elapsed,
      isNewBest: finalScore > 0,
    });
  }

  function showResult(result) {
    const cfg = LEVELS[state.level];
    const starsHtml = [1, 2, 3].map(i =>
      '<span class="star' + (result.stars >= i ? ' is-on' : '') + '" style="font-size:44px">★</span>'
    ).join('');

    // Overlay modal via App.openModal
    const html =
      '<div style="text-align:center">' +
        '<div style="font-size:72px;line-height:1;margin-bottom:8px">' +
          (result.timeUp ? '⏰' : result.stars === 3 ? '🏆' : result.stars === 2 ? '🎉' : '👍') +
        '</div>' +
        '<h3 style="font-size:22px;font-weight:800;margin:8px 0 12px">' +
          (result.timeUp
            ? t({ id: 'Waktu Habis!', en: 'Time Up!', mix: 'Waktu Habis!' })
            : result.stars === 3
              ? t({ id: 'Sempurna!', en: 'Perfect!', mix: 'Sempurna!' })
              : result.stars === 2
                ? t({ id: 'Bagus!', en: 'Nice!', mix: 'Bagus!' })
                : t({ id: 'Selesai!', en: 'Done!', mix: 'Selesai!' })) +
        '</h3>' +
        (result.timeUp
          ? '<div style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">' + result.correct + '/' + result.total + ' ' + t({ id: 'dokumen sudah benar', en: 'documents correct', mix: 'dokumen benar' }) + '</div>'
          : '<div class="stars" style="justify-content:center;margin-bottom:16px">' + starsHtml + '</div>') +

        (!result.timeUp
          ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:16px 0">' +
              '<div style="padding:12px;background:var(--surface-2);border-radius:var(--r-md)">' +
                '<div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:800;letter-spacing:.4px">' + t({ id: 'Skor', en: 'Score', mix: 'Skor' }) + '</div>' +
                '<div style="font-size:24px;font-weight:800;color:var(--primary);font-family:var(--ff-mono);margin-top:4px">+' + result.score + '</div>' +
              '</div>' +
              '<div style="padding:12px;background:var(--surface-2);border-radius:var(--r-md)">' +
                '<div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:800;letter-spacing:.4px">' + t({ id: 'Waktu', en: 'Time', mix: 'Time' }) + '</div>' +
                '<div style="font-size:24px;font-weight:800;color:var(--amber);font-family:var(--ff-mono);margin-top:4px">' + fmtTime(result.elapsed) + '</div>' +
              '</div>' +
              '<div style="padding:12px;background:var(--surface-2);border-radius:var(--r-md)">' +
                '<div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:800;letter-spacing:.4px">' + t({ id: 'Hint', en: 'Hints', mix: 'Hint' }) + '</div>' +
                '<div style="font-size:24px;font-weight:800;color:var(--violet);font-family:var(--ff-mono);margin-top:4px">' + state.hintsUsed + '/' + state.maxHints + '</div>' +
              '</div>' +
            '</div>'
          : '') +

        (result.isNewBest
          ? '<div class="callout callout--ok" style="margin-top:12px"><div class="callout__icon">🎖️</div><div class="callout__body" style="text-align:left"><b>' + t({ id: 'Best baru!', en: 'New best!', mix: 'New best!' }) + '</b><p>' + t({ id: 'Kamu mengalahkan skor sebelumnya.', en: 'You beat your previous score.', mix: 'Kamu kalahkan skor sebelumnya.' }) + '</p></div></div>'
          : '') +
      '</div>';

    const footer =
      '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Lihat Papan', en: 'View Board', mix: 'Lihat Board' }) + '</button>' +
      '<button class="btn btn--outline" id="btnPzChangeLevel">🎯 ' + t({ id: 'Ganti Level', en: 'Change Level', mix: 'Ganti Level' }) + '</button>' +
      (result.timeUp || result.stars < 3
        ? '<button class="btn btn--primary" id="btnPzRetry">🔄 ' + t({ id: 'Coba Lagi', en: 'Retry', mix: 'Retry' }) + '</button>'
        : '<button class="btn btn--primary" id="btnPzNextLevel">➡️ ' + t({ id: 'Level Berikutnya', en: 'Next Level', mix: 'Next Level' }) + '</button>');

    if (global.App) {
      App.openModal({
        title: t({ id: 'Hasil Puzzle', en: 'Puzzle Result', mix: 'Hasil Puzzle' }),
        html,
        footer,
        onFooter: (a, btn) => {
          if (btn.id === 'btnPzRetry') {
            App.closeModal();
            resetGame();
          } else if (btn.id === 'btnPzChangeLevel') {
            App.closeModal();
            state.active = false;
            if (global.Store) Store.set('puzzle.active', false);
            render();
          } else if (btn.id === 'btnPzNextLevel') {
            App.closeModal();
            const order = ['easy', 'medium', 'hard'];
            const next = order[order.indexOf(state.level) + 1];
            if (next) startGame(next);
            else { state.active = false; render(); }
          } else {
            App.closeModal();
          }
        },
      });
    }
  }

  /* ============================================================
     14. RESET / EXIT
     ============================================================ */
  function resetGame() {
    stopTimer();
    const lvl = state.level;
    state.active = false;
    if (global.Store) Store.set('puzzle.active', false);
    startGame(lvl);
  }

  function confirmExit() {
    if (global.Store) Store.set('puzzle.active', false);
    stopTimer();
    state.active = false;
    render();
    if (global.App) App.navigate('beranda');
  }

  /* ============================================================
     15. INIT
     ============================================================ */
  function init() {
    render();
    document.addEventListener('i18n:change', () => {
      const active = document.querySelector('.view.is-active');
      if (active && active.dataset.view === 'puzzle') {
        if (state.active) {
          // Update label tanpa reset board
          updateHUD();
        } else {
          render();
        }
      }
    });
    document.addEventListener('route:change', (e) => {
      if (e.detail && e.detail.view !== 'puzzle' && state.active) {
        // Hentikan timer saat keluar
        stopTimer();
      } else if (e.detail && e.detail.view === 'puzzle') {
        if (state.active) {
          // Restart timer
          startTimer();
          updateTimerDisplay();
        } else {
          render();
        }
      }
    });
    // Bersihkan saat unload
    global.addEventListener('beforeunload', stopTimer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- EXPORT ---------- */
  global.Puzzle = {
    render,
    startGame,
    useHint,
    validate,
    LEVELS,
    ORDER,
    _state: state,
  };

})(window);