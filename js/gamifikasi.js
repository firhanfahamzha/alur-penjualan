/* ============================================================
   GAMIFIKASI.JS — Badge, Level, Pencapaian, Pengaturan,
                    Chart Skor, Riwayat Sesi
   ============================================================
   Render:
   - #achievementsMount  (Pencapaian)
   - #settingsMount      (Pengaturan)
   Auto-listen event badge:unlocked & score:change
   ============================================================ */

(function (global) {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ============================================================
     1. DEFINISI BADGE (14 badge)
     ============================================================ */
  const BADGES = {
    first_step: {
      icon: '👣',
      name: { id: 'Langkah Pertama', en: 'First Step', mix: 'First Step' },
      desc: { id: 'Kunjungi 3 mode berbeda.', en: 'Visit 3 different modes.', mix: 'Kunjungi 3 mode.' },
      check: (st) => countVisited(st) >= 3,
    },
    mode_explorer: {
      icon: '🧭',
      name: { id: 'Penjelajah Mode', en: 'Mode Explorer', mix: 'Mode Explorer' },
      desc: { id: 'Kunjungi semua mode.', en: 'Visit all modes.', mix: 'Kunjungi semua mode.' },
      check: (st) => countVisited(st) >= 8,
    },
    materi_explorer: {
      icon: '📚',
      name: { id: 'Penjelajah Materi', en: 'Material Explorer', mix: 'Material Explorer' },
      desc: { id: 'Buka semua 5 tahap alur.', en: 'Open all 5 flow stages.', mix: 'Buka semua 5 tahap.' },
      check: (st) => (st.progress.materi.opened || []).length >= 5,
    },
    roleplay_closer: {
      icon: '🎬',
      name: { id: 'Closing!', en: 'Closing!', mix: 'Closing!' },
      desc: { id: 'Selesaikan seluruh siklus Roleplay.', en: 'Complete the full Roleplay cycle.', mix: 'Selesai Roleplay lengkap.' },
      check: (st) => !!st.progress.roleplay.done,
    },
    roleplay_seller: {
      icon: '🧑‍💼',
      name: { id: 'Sisi Penjual', en: 'Seller Side', mix: 'Seller Side' },
      desc: { id: 'Main sebagai Penjual.', en: 'Play as Seller.', mix: 'Main jadi Seller.' },
      check: (st) => st.roleplay && st.roleplay.role === 'seller',
    },
    roleplay_buyer: {
      icon: '🧑‍💻',
      name: { id: 'Sisi Pembeli', en: 'Buyer Side', mix: 'Buyer Side' },
      desc: { id: 'Main sebagai Pembeli.', en: 'Play as Buyer.', mix: 'Main jadi Buyer.' },
      check: (st) => st.roleplay && st.roleplay.role === 'buyer',
    },
    nego_master: {
      icon: '💬',
      name: { id: 'Negosiator', en: 'Negotiator', mix: 'Negosiator' },
      desc: { id: 'Berhasil menegosiasikan harga sebagai Pembeli.', en: 'Successfully negotiated price as Buyer.', mix: 'Berhasil nego harga sebagai Buyer.' },
      check: (st) => st.roleplay && st.roleplay.negotiation && st.roleplay.negotiation.asking,
    },
    puzzle_master: {
      icon: '🧩',
      name: { id: 'Puzzle Master', en: 'Puzzle Master', mix: 'Puzzle Master' },
      desc: { id: 'Dapat 3 bintang di puzzle apa pun.', en: 'Get 3 stars in any puzzle.', mix: '3 bintang di puzzle mana pun.' },
      check: (st) => Object.values(st.puzzle.levels || {}).some(l => l.stars === 3),
    },
    puzzle_no_hint: {
      icon: '⚡',
      name: { id: 'Tanpa Hint', en: 'No Hint', mix: 'No Hint' },
      desc: { id: 'Selesaikan puzzle tanpa satu hint pun.', en: 'Finish puzzle without any hint.', mix: 'Selesai puzzle tanpa hint.' },
      check: (st) => Object.values(st.puzzle.levels || {}).some(l => l.stars === 3 && l.score > 0),
    },
    puzzle_hard: {
      icon: '💎',
      name: { id: 'Puzzle Hard', en: 'Puzzle Hard', mix: 'Puzzle Hard' },
      desc: { id: 'Selesaikan puzzle level hard dengan ≥2 bintang.', en: 'Finish Hard puzzle with ≥2 stars.', mix: 'Hard puzzle ≥2 bintang.' },
      check: (st) => st.puzzle.levels && st.puzzle.levels.hard && st.puzzle.levels.hard.stars >= 2,
    },
    detective_eagle: {
      icon: '🦅',
      name: { id: 'Mata Elang', en: 'Eagle Eye', mix: 'Eagle Eye' },
      desc: { id: 'Selesaikan Detektif tanpa salah klik.', en: 'Finish Detective with zero wrong clicks.', mix: 'Detektif tanpa salah klik.' },
      check: (st) => !!st.badges.unlocked.detective_eagle,
    },
    audit_perfect: {
      icon: '🎯',
      name: { id: 'Audit Sempurna', en: 'Perfect Audit', mix: 'Perfect Audit' },
      desc: { id: 'Temukan semua error + alasan benar + tanpa salah klik.', en: 'All errors + correct reasons + zero wrong clicks.', mix: 'Semua error + alasan benar + 0 salah klik.' },
      check: (st) => !!st.badges.unlocked.audit_perfect,
    },
    score_1000: {
      icon: '💯',
      name: { id: 'Seribu Poin', en: 'Thousand Club', mix: '1000 Poin' },
      desc: { id: 'Kumpulkan 1000 poin total.', en: 'Collect 1000 total points.', mix: 'Kumpulkan 1000 poin.' },
      check: (st) => st.score.total >= 1000,
    },
    all_modes: {
      icon: '🏅',
      name: { id: 'Selesai Semua', en: 'All Clear', mix: 'All Clear' },
      desc: { id: 'Selesaikan Materi, Roleplay, Puzzle, & Detektif.', en: 'Complete Materi, Roleplay, Puzzle, & Detective.', mix: 'Selesai semua 4 mode.' },
      check: (st) => ['materi', 'roleplay', 'puzzle', 'detektif'].every(m => st.progress[m].done),
    },
  };

  function countVisited(st) {
    return ['beranda', 'materi', 'roleplay', 'puzzle', 'detektif', 'pencapaian', 'pustaka', 'pengaturan']
      .filter(m => st.progress[m] && st.progress[m].visited).length;
  }

  /* ============================================================
     2. LEVEL SYSTEM
     ============================================================ */
  const LEVELS_TABLE = [
    { min: 0,    name: { id: 'Pemula',       en: 'Newbie',       mix: 'Newbie' },    icon: '🌱', color: '#2a8e6c' },
    { min: 100,  name: { id: 'Pelajar',      en: 'Apprentice',   mix: 'Apprentice' },icon: '📘', color: '#1d7a8c' },
    { min: 300,  name: { id: 'Praktisi',     en: 'Practitioner', mix: 'Practitioner'}, icon: '💼', color: '#2a7de1' },
    { min: 600,  name: { id: 'Spesialis',    en: 'Specialist',   mix: 'Specialist' },icon: '🔬', color: '#8f4e8c' },
    { min: 1000, name: { id: 'Ahli',         en: 'Expert',       mix: 'Expert' },    icon: '⭐', color: '#b9772c' },
    { min: 1500, name: { id: 'Master',       en: 'Master',       mix: 'Master' },    icon: '👑', color: '#d64545' },
    { min: 2500, name: { id: 'Grandmaster',  en: 'Grandmaster',  mix: 'Grandmaster' }, icon: '🏆', color: '#f5b93e' },
  ];

  function getLevel(score) {
    let current = LEVELS_TABLE[0];
    for (const l of LEVELS_TABLE) {
      if (score >= l.min) current = l;
      else break;
    }
    const idx = LEVELS_TABLE.indexOf(current);
    const next = LEVELS_TABLE[idx + 1] || null;
    const curMin = current.min;
    const nextMin = next ? next.min : curMin;
    const range = Math.max(1, nextMin - curMin);
    const pct = next ? Math.min(100, Math.round(((score - curMin) / range) * 100)) : 100;
    return { current, next, pct, curMin, nextMin, idx };
  }

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
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };
  const fmtDateShort = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' +
           d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  /* ============================================================
     4. CHECK & UNLOCK BADGE OTOMATIS
     ============================================================ */
  function checkAllBadges() {
    if (!global.Store) return;
    const st = Store.get();
    let newlyUnlocked = [];
    Object.keys(BADGES).forEach(id => {
      if (Store.isBadgeUnlocked(id)) return;
      try {
        if (BADGES[id].check(st)) {
          Store.unlockBadge(id);
          newlyUnlocked.push(id);
        }
      } catch (_) {}
    });
    return newlyUnlocked;
  }

  /* ============================================================
     5. RENDER PENCAPAIAN
     ============================================================ */
  function renderAchievements() {
    const mount = document.getElementById('achievementsMount');
    if (!mount) return;

    const st = Store.get();
    const total = st.score.total || 0;
    const lvl = getLevel(total);
    const unlockedCount = Object.keys(st.badges.unlocked || {}).length;
    const totalBadges = Object.keys(BADGES).length;
    const progressPct = Math.round((unlockedCount / totalBadges) * 100);

    mount.innerHTML =
      /* Level Card */
      '<div class="card mb-5" style="background:linear-gradient(135deg,var(--primary-soft),var(--teal-soft));padding:var(--s-6)">' +
        '<div style="display:flex;gap:var(--s-5);flex-wrap:wrap;align-items:center">' +
          '<div style="font-size:64px;line-height:1;background:var(--bg-elev);width:96px;height:96px;border-radius:var(--r-xl);display:grid;place-items:center;box-shadow:var(--shadow-2);color:' + lvl.current.color + '">' +
            lvl.current.icon +
          '</div>' +
          '<div style="flex:1;min-width:240px">' +
            '<div style="font-size:11px;font-weight:900;letter-spacing:.8px;color:' + lvl.current.color + ';text-transform:uppercase">' +
              t({ id: 'Level Kamu', en: 'Your Level', mix: 'Level Kamu' }) +
            '</div>' +
            '<div style="font-size:26px;font-weight:800;color:var(--text);margin:4px 0 8px">' +
              esc(t(lvl.current.name)) +
            '</div>' +
            '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--text-2)">' +
              '<span>💯 <b>' + total + '</b> ' + t({ id: 'poin', en: 'points', mix: 'poin' }) + '</span>' +
              '<span>🏅 <b>' + unlockedCount + '/' + totalBadges + '</b> ' + t({ id: 'badge', en: 'badges', mix: 'badge' }) + '</span>' +
            '</div>' +
            (lvl.next
              ? '<div style="margin-top:12px">' +
                  '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-3);margin-bottom:4px;font-weight:700">' +
                    '<span>' + esc(t(lvl.next.name)) + ' 🎯</span>' +
                    '<span>' + (lvl.nextMin - total) + ' ' + t({ id: 'poin lagi', en: 'to go', mix: 'poin lagi' }) + '</span>' +
                  '</div>' +
                  '<div class="progress progress--thick"><div class="progress__bar" style="width:' + lvl.pct + '%"></div></div>' +
                '</div>'
              : '<div style="margin-top:12px;font-size:12.5px;color:' + lvl.current.color + ';font-weight:800">🎉 ' + t({ id: 'Level maksimum tercapai!', en: 'Max level reached!', mix: 'Level maks!' }) + '</div>') +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Badge Grid */
      '<div class="section">' +
        '<div class="section__head">' +
          '<h2 class="section__title">🏅 Badge Koleksi</h2>' +
          '<p class="section__sub">' +
            t({ id: 'Buka badge dengan menyelesaikan aksi di setiap mode.', en: 'Unlock badges by completing actions in each mode.', mix: 'Buka badge dengan selesaikan aksi di tiap mode.' }) +
            ' <b>' + progressPct + '%</b>' +
          '</p>' +
        '</div>' +
        '<div class="badge-grid">' +
          Object.keys(BADGES).map(id => renderBadgeCard(id, st)).join('') +
        '</div>' +
      '</div>' +

      /* Chart Skor */
      '<div class="section mt-5">' +
        '<div class="section__head">' +
          '<h2 class="section__title">📈 Riwayat Skor</h2>' +
          '<p class="section__sub">' + t({ id: '30 aksi terakhir', en: 'Last 30 actions', mix: '30 aksi terakhir' }) + '</p>' +
        '</div>' +
        '<div class="card card--flat" style="padding:var(--s-5)">' +
          renderScoreChart(st) +
        '</div>' +
      '</div>' +

      /* Riwayat Sesi */
      '<div class="section mt-5">' +
        '<div class="section__head">' +
          '<h2 class="section__title">🗂️ Riwayat Sesi</h2>' +
          '<p class="section__sub">' + t({ id: 'Aksi terbaru kamu', en: 'Your recent activity', mix: 'Aktivitas terbaru' }) + '</p>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<table class="table table--compact">' +
            '<thead><tr>' +
              '<th>' + t({ id: 'Waktu', en: 'Time', mix: 'Waktu' }) + '</th>' +
              '<th>' + t({ id: 'Aksi', en: 'Action', mix: 'Aksi' }) + '</th>' +
              '<th>' + t({ id: 'Mode', en: 'Mode', mix: 'Mode' }) + '</th>' +
              '<th class="num">' + t({ id: 'Delta', en: 'Delta', mix: 'Delta' }) + '</th>' +
            '</tr></thead>' +
            '<tbody>' +
              (st.score.history.length
                ? st.score.history.slice().reverse().slice(0, 15).map(h =>
                    '<tr>' +
                      '<td style="font-size:12px;color:var(--text-3)">' + fmtDateShort(h.t) + '</td>' +
                      '<td>' + esc(h.reason || '—') + '</td>' +
                      '<td><span class="badge badge--' + (h.mode || 'primary') + '">' + esc(h.mode || '—') + '</span></td>' +
                      '<td class="num" style="color:' + (h.delta >= 0 ? 'var(--green)' : 'var(--red)') + ';font-weight:800">' +
                        (h.delta > 0 ? '+' : '') + h.delta +
                      '</td>' +
                    '</tr>'
                  ).join('')
                : '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-3)">' +
                    t({ id: 'Belum ada riwayat. Main dulu yuk!', en: 'No history yet. Play first!', mix: 'Belum ada riwayat.' }) +
                  '</td></tr>') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  function renderBadgeCard(id, st) {
    const b = BADGES[id];
    const unlocked = !!st.badges.unlocked[id];
    const unlockedAt = st.badges.unlocked[id];
    return (
      '<div class="ach-card' + (unlocked ? ' is-unlocked' : '') + '" data-badge="' + id + '">' +
        (unlocked ? '' : '<div class="ach-card__lock">🔒</div>') +
        '<div class="ach-card__icon">' + b.icon + '</div>' +
        '<div class="ach-card__name">' + esc(t(b.name)) + '</div>' +
        '<div class="ach-card__desc">' + esc(t(b.desc)) + '</div>' +
        (unlockedAt ? '<div style="margin-top:8px;font-size:10.5px;color:var(--amber);font-weight:800;letter-spacing:.3px;text-transform:uppercase">✓ ' + fmtDateShort(unlockedAt) + '</div>' : '') +
      '</div>'
    );
  }

  function renderScoreChart(st) {
    const history = st.score.history.slice(-30);
    if (history.length < 2) {
      return '<div style="text-align:center;padding:var(--s-7);color:var(--text-3);font-size:13px">' +
        t({ id: 'Butuh minimal 2 aksi untuk menampilkan grafik.', en: 'At least 2 actions needed to render a chart.', mix: 'Butuh minimal 2 aksi untuk grafik.' }) +
        '</div>';
    }

    // Bangun kumulatif
    const cum = [0];
    history.forEach(h => cum.push(cum[cum.length - 1] + h.delta));
    const max = Math.max(...cum, 1);
    const min = Math.min(...cum, 0);
    const range = max - min || 1;

    const w = 800;
    const h = 220;
    const padX = 30;
    const padY = 20;

    const pts = cum.map((v, i) => {
      const x = padX + (i / (cum.length - 1)) * (w - padX * 2);
      const y = h - padY - ((v - min) / range) * (h - padY * 2);
      return { x, y, v };
    });

    const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
    const areaPath = linePath + ' L' + pts[pts.length - 1].x + ',' + (h - padY) + ' L' + pts[0].x + ',' + (h - padY) + ' Z';

    return (
      '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto;display:block" preserveAspectRatio="none">' +
        '<defs>' +
          '<linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35"/>' +
            '<stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>' +
          '</linearGradient>' +
        '</defs>' +
        /* Grid */
        [0, 0.25, 0.5, 0.75, 1].map(r =>
          '<line x1="' + padX + '" x2="' + (w - padX) + '" y1="' + (padY + r * (h - padY * 2)) + '" y2="' + (padY + r * (h - padY * 2)) + '" stroke="var(--border)" stroke-dasharray="2 4" stroke-width="1"/>'
        ).join('') +
        /* Area */
        '<path d="' + areaPath + '" fill="url(#chartGrad)"/>' +
        /* Line */
        '<path d="' + linePath + '" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        /* Points */
        pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1).map(p =>
          '<circle cx="' + p.x + '" cy="' + p.y + '" r="3.5" fill="var(--bg-elev)" stroke="var(--primary)" stroke-width="2"/>'
        ).join('') +
        /* Label y */
        '<text x="' + padX + '" y="' + (padY - 4) + '" fill="var(--text-3)" font-size="10" font-family="var(--ff-mono)">' + max + '</text>' +
        '<text x="' + padX + '" y="' + (h - 4) + '" fill="var(--text-3)" font-size="10" font-family="var(--ff-mono)">' + min + '</text>' +
      '</svg>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--text-3);font-family:var(--ff-mono)">' +
        '<span>' + fmtDateShort(history[0].t) + '</span>' +
        '<span>' + fmtDateShort(history[history.length - 1].t) + '</span>' +
      '</div>'
    );
  }

  /* ============================================================
     6. RENDER PENGATURAN
     ============================================================ */
  function renderSettings() {
    const mount = document.getElementById('settingsMount');
    if (!mount) return;

    const st = Store.get();
    const prefs = st.prefs || {};

    mount.innerHTML =
      '<div class="settings-grid">' +

        /* --- Tampilan --- */
        '<div class="settings-block">' +
          '<div class="settings-block__title">🎨 ' + t({ id: 'Tampilan', en: 'Appearance', mix: 'Appearance' }) + '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Tema', en: 'Theme', mix: 'Theme' }) + '<small>' + t({ id: 'Warna antarmuka', en: 'Interface colors', mix: 'Warna UI' }) + '</small></div>' +
            '<div class="segmented" data-setting="theme">' +
              '<button data-set-theme="light" class="' + (prefs.theme === 'light' ? 'is-active' : '') + '">☀️</button>' +
              '<button data-set-theme="dark" class="' + (prefs.theme === 'dark' ? 'is-active' : '') + '">🌙</button>' +
              '<button data-set-theme="sepia" class="' + (prefs.theme === 'sepia' ? 'is-active' : '') + '">📜</button>' +
              '<button data-set-theme="auto" class="' + (prefs.theme === 'auto' ? 'is-active' : '') + '">🖥️</button>' +
            '</div>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Bahasa', en: 'Language', mix: 'Language' }) + '<small>' + t({ id: 'Pilih bahasa UI', en: 'UI language', mix: 'Bahasa UI' }) + '</small></div>' +
            '<div class="segmented" data-setting="lang">' +
              '<button data-set-lang="id" class="' + (prefs.lang === 'id' ? 'is-active' : '') + '">🇮🇩 ID</button>' +
              '<button data-set-lang="en" class="' + (prefs.lang === 'en' ? 'is-active' : '') + '">🇬🇧 EN</button>' +
              '<button data-set-lang="mix" class="' + (prefs.lang === 'mix' ? 'is-active' : '') + '">🔀 Mix</button>' +
            '</div>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Efek Suara', en: 'Sound Effects', mix: 'Sound' }) + '<small>' + t({ id: 'Beep saat aksi', en: 'Beep on action', mix: 'Beep' }) + '</small></div>' +
            '<label class="switch"><input type="checkbox" id="prefSound" ' + (prefs.sound ? 'checked' : '') + '><span class="switch__track"></span></label>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Confetti', en: 'Confetti', mix: 'Confetti' }) + '<small>' + t({ id: 'Animasi kemenangan', en: 'Victory animation', mix: 'Animasi menang' }) + '</small></div>' +
            '<label class="switch"><input type="checkbox" id="prefConfetti" ' + (prefs.confetti ? 'checked' : '') + '><span class="switch__track"></span></label>' +
          '</div>' +
        '</div>' +

        /* --- Data Sesi --- */
        '<div class="settings-block">' +
          '<div class="settings-block__title">💾 ' + t({ id: 'Data Sesi', en: 'Session Data', mix: 'Session Data' }) + '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'ID Sesi', en: 'Session ID', mix: 'Session ID' }) + '<small>' + esc(st.session.id) + '</small></div>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Dimulai', en: 'Started', mix: 'Mulai' }) + '<small>' + fmtDateShort(st.session.startedAt) + '</small></div>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Total Poin', en: 'Total Points', mix: 'Total Poin' }) + '<small>' + st.score.total + ' poin</small></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
            '<button class="btn btn--sm btn--primary" id="btnSetExportJSON">📥 JSON</button>' +
            '<button class="btn btn--sm btn--ghost" id="btnSetExportCSV">📊 CSV</button>' +
            '<button class="btn btn--sm btn--ghost" id="btnSetCopy">📋 Copy</button>' +
          '</div>' +
        '</div>' +

        /* --- Reset --- */
        '<div class="settings-block">' +
          '<div class="settings-block__title">⚠️ ' + t({ id: 'Zona Bahaya', en: 'Danger Zone', mix: 'Zona Bahaya' }) + '</div>' +
          '<p style="font-size:12.5px;color:var(--text-2);line-height:1.6;margin-bottom:12px">' +
            t({ id: 'Aksi di bawah ini tidak bisa dibatalkan. Backup dulu lewat tombol ekspor di atas.', en: 'Actions below cannot be undone. Backup first via export above.', mix: 'Aksi di bawah ini tidak bisa dibatalkan. Backup dulu via export.' }) +
          '</p>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            '<button class="btn btn--sm btn--outline" id="btnResetProgress" style="justify-content:flex-start">🔄 ' + t({ id: 'Reset Progres & Skor', en: 'Reset Progress & Score', mix: 'Reset Progres & Skor' }) + '</button>' +
            '<button class="btn btn--sm btn--danger" id="btnResetAll" style="justify-content:flex-start">💥 ' + t({ id: 'Reset Semua (termasuk preferensi)', en: 'Reset All (including preferences)', mix: 'Reset Semua' }) + '</button>' +
          '</div>' +
        '</div>' +

        /* --- Aksesibilitas --- */
        '<div class="settings-block">' +
          '<div class="settings-block__title">♿ ' + t({ id: 'Aksesibilitas', en: 'Accessibility', mix: 'A11y' }) + '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Reduced Motion', en: 'Reduced Motion', mix: 'Reduced Motion' }) + '<small>' + t({ id: 'Kurangi animasi', en: 'Reduce animations', mix: 'Kurangi animasi' }) + '</small></div>' +
            '<label class="switch"><input type="checkbox" id="prefReducedMotion" ' + (prefs.reducedMotion ? 'checked' : '') + '><span class="switch__track"></span></label>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Info Teknis', en: 'Technical Info', mix: 'Info Teknis' }) + '<small>v1.0 · ' + (navigator.platform || 'web') + '</small></div>' +
          '</div>' +
        '</div>' +

      '</div>';

    bindSettings();
  }

  function bindSettings() {
    // Theme
    $$('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.setTheme;
        Store.set('prefs.theme', v);
        const resolved = v === 'auto'
          ? (global.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : v;
        document.documentElement.setAttribute('data-theme', resolved);
        $$('[data-set-theme]').forEach(b => b.classList.toggle('is-active', b === btn));
        if (global.App) App.toast('info', I18N.t('toast.themeSet'), I18N.t('theme.' + v));
      });
    });
    // Language
    $$('[data-set-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.setLang;
        Store.set('prefs.lang', v);
        if (global.I18N) I18N.set(v);
        $$('[data-set-lang]').forEach(b => b.classList.toggle('is-active', b === btn));
        if (global.App) App.toast('info', I18N.t('toast.langSet'), I18N.t('lang.' + v));
      });
    });
    // Switch sederhana
    const bindSwitch = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        Store.set('prefs.' + key, el.checked);
      });
    };
    bindSwitch('prefSound', 'sound');
    bindSwitch('prefConfetti', 'confetti');
    bindSwitch('prefReducedMotion', 'reducedMotion');
    document.addEventListener('i18n:change', () => {
      const rm = document.getElementById('prefReducedMotion');
      if (rm) {
        document.documentElement.setAttribute('data-reduced-motion', Store.get('prefs.reducedMotion') ? 'true' : 'false');
      }
    });

    // Export & reset
    const bE = document.getElementById('btnSetExportJSON');
    if (bE && global.Export) bE.addEventListener('click', () => Export.downloadJSON());
    const bC = document.getElementById('btnSetExportCSV');
    if (bC && global.Export) bC.addEventListener('click', () => Export.downloadCSV());
    const bCopy = document.getElementById('btnSetCopy');
    if (bCopy && global.Export) bCopy.addEventListener('click', () => Export.copyJSON());

    const bRP = document.getElementById('btnResetProgress');
    if (bRP) bRP.addEventListener('click', () => confirmReset(false));
    const bRA = document.getElementById('btnResetAll');
    if (bRA) bRA.addEventListener('click', () => confirmReset(true));
  }

  function confirmReset(all) {
    if (!global.App) return;
    App.openModal({
      title: t({ id: 'Reset Data?', en: 'Reset Data?', mix: 'Reset Data?' }),
      html: '<div class="callout callout--bad"><div class="callout__icon">⚠️</div><div class="callout__body">' +
        '<b>' + (all ? t({ id: 'Reset Semua', en: 'Reset All', mix: 'Reset Semua' }) : t({ id: 'Reset Progres', en: 'Reset Progress', mix: 'Reset Progres' })) + '</b>' +
        '<p>' + (all
          ? t({ id: 'Semua data termasuk preferensi, skor, badge, dan riwayat akan dihapus.', en: 'All data including preferences, score, badges, and history will be erased.', mix: 'Semua data termasuk preferensi, skor, badge, & riwayat akan dihapus.' })
          : t({ id: 'Skor, badge, dan riwayat akan dihapus. Preferensi (tema, bahasa) tetap tersimpan.', en: 'Score, badges, and history will be erased. Preferences stay.', mix: 'Skor, badge, & riwayat dihapus. Preferensi tetap.'))
        + '</p></div></div>',
      footer:
        '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>' +
        '<button class="btn btn--danger" id="btnConfirmReset">💥 ' + t({ id: 'Ya, Reset', en: 'Yes, Reset', mix: 'Ya, Reset' }) + '</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'btnConfirmReset') {
          if (all) Store.reset(false);
          else Store.resetProgress();
          App.closeModal();
          App.toast('ok', t({ id: 'Data direset', en: 'Data reset', mix: 'Data direset' }), '');
          setTimeout(() => location.reload(), 600);
        }
      },
    });
  }

  /* ============================================================
     7. INIT & EVENT LISTENERS
     ============================================================ */
  function init() {
    renderAchievements();
    renderSettings();

    document.addEventListener('route:change', (e) => {
      if (!e.detail) return;
      if (e.detail.view === 'pencapaian') renderAchievements();
      if (e.detail.view === 'pengaturan') renderSettings();
    });
    document.addEventListener('i18n:change', () => {
      const active = document.querySelector('.view.is-active');
      if (!active) return;
      if (active.dataset.view === 'pencapaian') renderAchievements();
      if (active.dataset.view === 'pengaturan') renderSettings();
    });
    document.addEventListener('score:change', () => {
      // Cek unlock badge baru
      checkAllBadges();
      // Re-render kalau lagi di halaman pencapaian
      const active = document.querySelector('.view.is-active');
      if (active && active.dataset.view === 'pencapaian') {
        renderAchievements();
      }
    });
    document.addEventListener('store:change', () => {
      const active = document.querySelector('.view.is-active');
      if (active && active.dataset.view === 'pencapaian') renderAchievements();
    });

    // Cek awal
    setTimeout(checkAllBadges, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- EXPORT ---------- */
  global.BADGES = BADGES;
  global.Gamifikasi = {
    render: () => { renderAchievements(); renderSettings(); },
    renderAchievements,
    renderSettings,
    checkAllBadges,
    getLevel,
    LEVELS_TABLE,
    BADGES,
  };

})(window);