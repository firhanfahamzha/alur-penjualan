/* ============================================================
   APP.JS — Bootstrap, Router, Theme, Search, Toast, Modal,
            Confetti, Ripple, Count-up, Keyboard shortcuts
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- SHORTCUTS ---------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ============================================================
     1. SPLASH
     ============================================================ */
  function bootSplash() {
    const splash = $('#splash');
    const bar = $('#splashBar');
    if (!splash || !bar) return;

    let pct = 0;
    const target = 100;
    const step = () => {
      pct += Math.random() * 14 + 6;
      if (pct > target) pct = target;
      bar.style.width = pct + '%';
      if (pct < target) {
        setTimeout(step, 120 + Math.random() * 180);
      } else {
        setTimeout(() => {
          splash.classList.add('is-done');
          splash.setAttribute('aria-hidden', 'true');
        }, 320);
      }
    };
    setTimeout(step, 200);
  }

  /* ============================================================
     2. THEME
     ============================================================ */
  const MEDIA_QUERY = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveTheme(pref) {
    if (pref === 'auto') {
      return MEDIA_QUERY && MEDIA_QUERY.matches ? 'dark' : 'light';
    }
    return pref || 'light';
  }

  function applyTheme(pref) {
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', pref);
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const colors = { light: '#0b1e33', dark: '#0a1422', sepia: '#f5efe1' };
      meta.setAttribute('content', colors[resolved] || '#0b1e33');
    }
  }

  function initTheme() {
    const pref = Store.get('prefs.theme') || 'light';
    applyTheme(pref);

    if (MEDIA_QUERY) {
      MEDIA_QUERY.addEventListener('change', () => {
        if (Store.get('prefs.theme') === 'auto') applyTheme('auto');
      });
    }

    // Klik menu tema
    $$('[data-theme-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.themeSet;
        Store.set('prefs.theme', val);
        applyTheme(val);
        markActive('theme', val);
        closeAllDropdowns();
        toast('info', I18N.t('toast.themeSet'), I18N.t('theme.' + val));
      });
    });

    markActive('theme', pref);
  }

  function markActive(kind, val) {
    const attr = kind === 'theme' ? 'data-theme-set' : 'data-lang-set';
    $$('[' + attr + ']').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute(attr) === val);
    });
  }

  /* ============================================================
     3. LANGUAGE
     ============================================================ */
  function initLang() {
    const lang = Store.get('prefs.lang') || 'mix';
    I18N.set(lang);
    I18N.applyAll();
    markActive('lang', lang);

    $$('[data-lang-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.langSet;
        Store.set('prefs.lang', val);
        I18N.set(val);
        I18N.applyAll();
        markActive('lang', val);
        closeAllDropdowns();
        toast('info', I18N.t('toast.langSet'), I18N.t('lang.' + val));
      });
    });
  }

  /* ============================================================
     4. DROPDOWN
     ============================================================ */
  function initDropdowns() {
    $$('.dropdown').forEach(dd => {
      const btn = dd.querySelector('button[aria-haspopup]');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dd.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        closeAllDropdowns(dd);
      });
    });

    document.addEventListener('click', () => closeAllDropdowns());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllDropdowns();
    });
  }

  function closeAllDropdowns(except) {
    $$('.dropdown.is-open').forEach(dd => {
      if (except && dd === except) return;
      dd.classList.remove('is-open');
      const b = dd.querySelector('button[aria-haspopup]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  /* ============================================================
     5. SIDEBAR MOBILE
     ============================================================ */
  function initSidebar() {
    const burger = $('#btnBurger');
    const sidebar = $('#sidebar');
    const scrim = $('#sidebarScrim');
    if (!burger || !sidebar) return;

    const toggle = (open) => {
      const willOpen = typeof open === 'boolean' ? open : !sidebar.classList.contains('is-open');
      sidebar.classList.toggle('is-open', willOpen);
      if (scrim) scrim.hidden = !willOpen;
    };

    burger.addEventListener('click', () => toggle());
    if (scrim) scrim.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggle(false);
    });

    // Tutup saat klik nav item (mobile)
    $$('.nav__item', sidebar).forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 980) toggle(false);
      });
    });
  }

  /* ============================================================
     6. ROUTER (pergantian view)
     ============================================================ */
  const ROUTES = ['beranda', 'materi', 'roleplay', 'puzzle', 'detektif', 'pencapaian', 'pustaka', 'pengaturan'];
  let currentView = 'beranda';

  function navigate(view, opts) {
    if (!ROUTES.includes(view)) view = 'beranda';
    if (view === currentView && !(opts && opts.force)) return;

    // Simpan scroll view lama
    const oldEl = $('.view.is-active');
    if (oldEl) {
      const oldName = oldEl.dataset.view;
      if (oldName) Store.set('ui.scrollPositions.' + oldName, global.scrollY || 0);
    }

    // Sembunyikan semua
    $$('.view').forEach(v => v.classList.remove('is-active'));

    // Tampilkan target
    const target = $('.view[data-view="' + view + '"]');
    if (target) {
      target.classList.add('is-active');
      // Restore scroll
      const savedY = Store.get('ui.scrollPositions.' + view) || 0;
      requestAnimationFrame(() => global.scrollTo({ top: savedY, behavior: 'instant' }));
    }

    // Update nav item
    $$('.nav__item').forEach(item => {
      item.classList.toggle('is-active', item.dataset.nav === view);
    });

    currentView = view;
    Store.set('ui.lastView', view);
    Store.markVisited(view);
    Store.log('navigate', { view });

    // Update hash
    if (history.replaceState) {
      history.replaceState(null, '', '#' + view);
    }

    // Trigger event
    document.dispatchEvent(new CustomEvent('route:change', {
      detail: { view, opts }
    }));

    // Update progress bar mini
    updateProgressMini();

    // Update document title
    updateDocTitle(view);
  }

  function updateDocTitle(view) {
    const base = 'Order-to-Cash Lab';
    const labels = {
      beranda: 'Beranda', materi: 'Materi Alur', roleplay: 'Simulasi Peran',
      puzzle: 'Puzzle Dokumen', detektif: 'Detektif Audit',
      pencapaian: 'Pencapaian', pustaka: 'Pustaka Dokumen', pengaturan: 'Pengaturan',
    };
    document.title = (labels[view] ? labels[view] + ' · ' : '') + base;
  }

  function initRouter() {
    // Klik semua elemen dengan data-nav
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-nav]');
      if (!el) return;
      const view = el.dataset.nav;
      if (!view) return;
      e.preventDefault();
      const target = el.dataset.target;
      navigate(view);
      // Kalau ada target sub-elemen (misal step accordion), emit event
      if (target) {
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('navigate:target', {
            detail: { view, target }
          }));
        }, 200);
      }
    });

    // Hash awal
    const hash = (location.hash || '').replace('#', '');
    if (hash && ROUTES.includes(hash)) navigate(hash);
    else navigate(Store.get('ui.lastView') || 'beranda', { force: true });

    // Back/forward
    global.addEventListener('hashchange', () => {
      const h = (location.hash || '').replace('#', '');
      if (h && ROUTES.includes(h) && h !== currentView) navigate(h);
    });
  }

  function getCurrentView() { return currentView; }

  /* ============================================================
     7. PROGRESS MINI (sidebar footer)
     ============================================================ */
  function updateProgressMini() {
    const p = Store.get('progress');
    const keyModes = ['materi', 'roleplay', 'puzzle', 'detektif'];
    let done = 0;
    keyModes.forEach(m => { if (p[m] && p[m].done) done++; });
    const pct = Math.round((done / keyModes.length) * 100);
    const fill = $('#progressFill');
    const label = $('#progressPct');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
  }

  /* ============================================================
     8. SKOR CHIP
     ============================================================ */
  function initScoreChip() {
    const chip = $('#scoreChip');
    const val = $('#scoreValue');
    if (!chip || !val) return;

    const render = () => {
      const total = Store.get('score.total') || 0;
      val.textContent = total;
    };
    render();

    document.addEventListener('score:change', (e) => {
      render();
      const delta = e.detail.delta || 0;
      if (delta > 0) floatScore('+' + delta, chip);
      // Animasi chip
      chip.classList.remove('attention');
      void chip.offsetWidth;
      chip.classList.add('attention');
    });

    chip.addEventListener('click', () => navigate('pencapaian'));
  }

  function floatScore(text, anchor) {
    if (!Store.get('prefs.confetti')) return;
    const rect = anchor.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'score-float';
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top  = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  /* ============================================================
     9. TOAST
     ============================================================ */
  const TOAST_ICONS = {
    ok: '✅', bad: '❌', warn: '⚠️', info: 'ℹ️', star: '⭐', gift: '🎁', trophy: '🏆',
  };

  function toast(type, title, msg, opts) {
    const wrap = $('#toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    el.setAttribute('role', 'status');

    const icon = (opts && opts.icon) || TOAST_ICONS[type] || 'ℹ️';
    el.innerHTML =
      '<div class="toast__icon">' + icon + '</div>' +
      '<div class="toast__body">' +
        '<div class="toast__title"></div>' +
        '<div class="toast__msg"></div>' +
      '</div>';

    el.querySelector('.toast__title').textContent = title || '';
    el.querySelector('.toast__msg').textContent = msg || '';

    wrap.appendChild(el);

    const life = (opts && opts.duration) || 3800;
    const close = () => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    };
    setTimeout(close, life);
    el.addEventListener('click', close);

    return close;
  }

  /* ============================================================
     10. MODAL
     ============================================================ */
  let modalPrevFocus = null;

  function openModal(opts) {
    const modal = $('#modal');
    const title = $('#modalTitle');
    const body = $('#modalBody');
    const foot = $('#modalFoot');
    if (!modal) return;

    modalPrevFocus = document.activeElement;
    title.textContent = opts.title || '';
    body.innerHTML = opts.html || opts.text || '';
    foot.innerHTML = opts.footer || '';

    modal.hidden = false;
    requestAnimationFrame(() => {
      const focusable = modal.querySelector('input, textarea, select, button');
      if (focusable) focusable.focus();
    });

    // Handle klik tombol di footer
    if (typeof opts.onFooter === 'function') {
      foot.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', (e) => {
          opts.onFooter(b.dataset.action || '', b, e);
        });
      });
    }
    return modal;
  }

  function closeModal() {
    const modal = $('#modal');
    if (!modal) return;
    modal.hidden = true;
    if (modalPrevFocus && modalPrevFocus.focus) modalPrevFocus.focus();
    modalPrevFocus = null;
  }

  function initModal() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    });
  }

  /* ============================================================
     11. CONFETTI
     ============================================================ */
  const CONFETTI_COLORS = ['#2a7de1', '#1d7a8c', '#2a8e6c', '#b9772c', '#8f4e8c', '#4fd1c5', '#ffd18c', '#f5b93e'];

  function confetti(opts) {
    if (!Store.get('prefs.confetti')) return;
    const layer = $('#confettiLayer');
    if (!layer) return;

    const count = (opts && opts.count) || 80;
    const duration = (opts && opts.duration) || 2.8;
    const origin = (opts && opts.origin) || null;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const size = 6 + Math.random() * 8;
      piece.style.width = size + 'px';
      piece.style.height = (size * 1.4) + 'px';
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.left = (origin ? origin.x + (Math.random() * 200 - 100) : Math.random() * 100) + '%';
      piece.style.top = (origin ? origin.y : -10) + 'px';
      const dur = duration * (0.7 + Math.random() * 0.6);
      piece.style.animationDuration = dur + 's';
      piece.style.animationDelay = (Math.random() * 0.3) + 's';
      // Variasi bentuk
      if (Math.random() > 0.7) piece.style.borderRadius = '50%';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), (dur + 1) * 1000);
    }
  }

  /* ============================================================
     12. RIPPLE (efek klik tombol)
     ============================================================ */
  function initRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn || btn.disabled) return;
      if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple-elt';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  /* ============================================================
     13. COUNT-UP (angka hero)
     ============================================================ */
  function initCountUp() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        animateCount(el, 0, parseInt(el.dataset.count, 10) || 0, 900);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  function animateCount(el, from, to, ms) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     14. SEARCH GLOBAL
     ============================================================ */
  let SEARCH_INDEX = [];

  function buildSearchIndex() {
    SEARCH_INDEX = [];
    // Materi (dari window.MATERI_DATA kalau ada)
    if (global.MATERI_DATA && Array.isArray(global.MATERI_DATA.stages)) {
      global.MATERI_DATA.stages.forEach((s, i) => {
        SEARCH_INDEX.push({
          type: 'stage', view: 'materi', target: s.id,
          icon: s.icon || '📚',
          title: s.title || ('Tahap ' + (i + 1)),
          text: (s.subtitle || '') + ' ' + (s.process || []).join(' '),
        });
        (s.docs || []).forEach(d => {
          SEARCH_INDEX.push({
            type: 'doc', view: 'materi', target: s.id,
            icon: d.icon || '📄',
            title: d.name || '',
            text: (d.desc || '') + ' ' + (d.note || ''),
          });
        });
      });
    }
    // Mode
    [
      { view: 'beranda', icon: '🏠', title: 'Beranda', text: 'home briefing misi role perusahaan' },
      { view: 'materi', icon: '📚', title: 'Materi Alur', text: 'tahap order to cash quotation invoice' },
      { view: 'roleplay', icon: '🎭', title: 'Simulasi Peran', text: 'penjual pembeli seller buyer nego' },
      { view: 'puzzle', icon: '🧩', title: 'Puzzle Dokumen', text: 'drag drop susun urutan dokumen' },
      { view: 'detektif', icon: '🕵️', title: 'Detektif Audit', text: 'temukan kesalahan audit mismatch' },
      { view: 'pencapaian', icon: '🏆', title: 'Pencapaian', text: 'badge skor achievement' },
      { view: 'pustaka', icon: '🗂️', title: 'Pustaka Dokumen', text: 'template dokumen cetak' },
      { view: 'pengaturan', icon: '⚙️', title: 'Pengaturan', text: 'settings theme bahasa reset' },
    ].forEach(x => SEARCH_INDEX.push({ ...x, type: 'mode' }));
  }

  function initSearch() {
    const input = $('#globalSearch');
    const box = $('#searchResults');
    if (!input || !box) return;

    let debounce = null;

    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => runSearch(input.value.trim()), 140);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) runSearch(input.value.trim());
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { input.blur(); box.hidden = true; input.value = ''; }
      if (e.key === 'Enter') {
        const first = box.querySelector('.search-results__item');
        if (first) first.click();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.searchbox')) box.hidden = true;
    });

    // Shortcut "/"
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !/input|textarea/i.test(e.target.tagName)) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  function runSearch(q) {
    const box = $('#searchResults');
    if (!box) return;
    if (!q) { box.hidden = true; box.innerHTML = ''; return; }

    const ql = q.toLowerCase();
    const results = SEARCH_INDEX.filter(item => {
      return (item.title + ' ' + item.text).toLowerCase().includes(ql);
    }).slice(0, 12);

    if (!results.length) {
      box.innerHTML = '<div class="search-results__empty">' + I18N.t('common.empty') + '</div>';
      box.hidden = false;
      return;
    }

    box.innerHTML = results.map((r, i) => {
      const t = escapeHtml(r.title);
      const hl = t.replace(new RegExp(escapeRegex(q), 'ig'), m => '<em>' + m + '</em>');
      return (
        '<div class="search-results__item" data-idx="' + i + '">' +
          '<span>' + (r.icon || '•') + '</span>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:700;font-size:13.5px">' + hl + '</div>' +
            '<div style="font-size:11.5px;color:var(--text-3)">' + (r.type) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    box.querySelectorAll('.search-results__item').forEach((el, i) => {
      el.addEventListener('click', () => {
        const r = results[i];
        navigate(r.view);
        if (r.target) {
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('navigate:target', {
              detail: { view: r.view, target: r.target }
            }));
          }, 220);
        }
        box.hidden = true;
        $('#globalSearch').value = '';
      });
    });

    box.hidden = false;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ============================================================
     15. KEYBOARD SHORTCUTS
     ============================================================ */
  function initShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+F → fasilitator
      if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('facilitator:toggle'));
      }
      // Ctrl+K → search
      if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const inp = $('#globalSearch');
        if (inp) { inp.focus(); inp.select(); }
      }
      // Alt+1..8 → navigasi
      if (e.altKey && /^[1-8]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (ROUTES[idx]) navigate(ROUTES[idx]);
      }
    });

    // Tampilkan tombol lanjutkan kalau ada progres
    const btnResume = $('#btnLanjutkan');
    if (btnResume) {
      const last = Store.get('ui.lastView');
      const hasProgress = Store.get('score.total') > 0 ||
        ['materi', 'roleplay', 'puzzle', 'detektif'].some(m => Store.get('progress.' + m + '.visited'));
      if (hasProgress && last && last !== 'beranda') {
        btnResume.hidden = false;
        btnResume.addEventListener('click', () => navigate(last));
      }
    }
  }

  /* ============================================================
     16. BADGE UNLOCKED LISTENER (global)
     ============================================================ */
  function initBadgeToasts() {
    document.addEventListener('badge:unlocked', (e) => {
      const id = e.detail.id;
      const meta = (global.BADGES && global.BADGES[id]) || null;
      toast('gift',
        I18N.t('toast.badgeGot'),
        meta ? (meta.name || id) : id,
        { icon: meta && meta.icon || '🎁', duration: 5200 }
      );
      confetti({ count: 40, duration: 2.2 });
    });
  }

  /* ============================================================
     17. I18N RE-RENDER
     ============================================================ */
  function initI18nApply() {
    document.addEventListener('i18n:change', () => {
      I18N.applyAll();
      // Broadcast agar modul lain bisa re-render
      document.dispatchEvent(new CustomEvent('app:rerender'));
    });
  }

  /* ============================================================
     18. FASILITATOR TOMBOL
     ============================================================ */
  function initFacilitatorBtn() {
    const btn = $('#btnFacilitator');
    const inlineBtn = $('#btnFacilitatorInline');
    const handler = () => document.dispatchEvent(new CustomEvent('facilitator:toggle'));
    if (btn) btn.addEventListener('click', handler);
    if (inlineBtn) inlineBtn.addEventListener('click', handler);
  }

  /* ============================================================
     19. PREFERS REDUCED MOTION
     ============================================================ */
  function initReducedMotion() {
    const pref = Store.get('prefs.reducedMotion');
    if (pref) document.documentElement.setAttribute('data-reduced-motion', 'true');
  }

  /* ============================================================
     20. VISIBILITY PAUSE (hemat resource)
     ============================================================ */
  function initVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Store._persistNow();
      }
    });
  }

  /* ============================================================
     21. BOOT
     ============================================================ */
  function boot() {
    bootSplash();
    initTheme();
    initLang();
    initDropdowns();
    initSidebar();
    initModal();
    initScoreChip();
    initRipple();
    initCountUp();
    buildSearchIndex();
    initSearch();
    initShortcuts();
    initBadgeToasts();
    initI18nApply();
    initFacilitatorBtn();
    initReducedMotion();
    initVisibility();
    initRouter();
    updateProgressMini();

    // Siapkan panggung untuk modul lain
    document.dispatchEvent(new CustomEvent('app:ready'));

    // Log awal
    if (!Store.get('session.startedAt')) {
      Store.set('session.startedAt', Date.now());
    }
    Store.log('app:boot', { ua: navigator.userAgent.slice(0, 80) });
  }

  /* ---------- Expose API GLOBAL ---------- */
  global.App = {
    boot,
    navigate,
    getCurrentView,
    toast,
    openModal,
    closeModal,
    confetti,
    floatScore,
    buildSearchIndex,
    updateProgressMini,
    $, $$,
  };

  /* ---------- Auto-boot setelah DOM siap ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);