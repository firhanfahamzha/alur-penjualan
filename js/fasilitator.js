/* ============================================================
   FASILITATOR.JS — Panel Kontrol Fasilitator (Ctrl+Shift+F)
   ============================================================
   Fitur:
   - Atur jumlah error untuk Detektif (override)
   - Reshuffle data dokumen (regenerate)
   - Unlock semua mode / hide score untuk latihan kelompok
   - Lihat statistik live
   - Reset pilihan
   - Shortcut: Ctrl+Shift+F
   ============================================================ */

(function (global) {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const t = (obj) => {
    if (!obj) return '';
    const lang = (global.I18N && I18N.get && I18N.get()) || 'mix';
    return obj[lang] || obj.mix || obj.id || obj.en || '';
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  /* ============================================================
     1. RENDER PANEL
     ============================================================ */
  function render() {
    const fac = Store.get('facilitator') || {};
    const st = Store.get();

    const html =
      '<div class="fac-panel">' +

        '<div class="alert alert--info">' +
          '<div class="alert__icon">🛡️</div>' +
          '<div class="alert__body">' +
            '<b>' + t({ id: 'Mode Fasilitator', en: 'Facilitator Mode', mix: 'Facilitator Mode' }) + '</b>' +
            '<div>' + t({ id: 'Atur sesi latihan, kunci/hide skor, dan reset massal. Perubahan tersimpan otomatis.', en: 'Tune the training session, lock/hide scores, and mass reset. Changes are saved.', mix: 'Atur sesi, hide skor, reset massal. Tersimpan otomatis.' }) + '</div>' +
          '</div>' +
        '</div>' +

        /* Statistik cepat */
        '<div class="settings-block">' +
          '<div class="settings-block__title">📊 ' + t({ id: 'Statistik Sesi', en: 'Session Stats', mix: 'Statistik Sesi' }) + '</div>' +
          '<div class="settings-row"><div class="settings-row__label">' + t({ id: 'ID Sesi', en: 'Session ID', mix: 'Session ID' }) + '</div><div><code style="font-size:11.5px">' + esc(st.session.id) + '</code></div></div>' +
          '<div class="settings-row"><div class="settings-row__label">' + t({ id: 'Total Poin', en: 'Total Score', mix: 'Total Skor' }) + '</div><div><b>' + st.score.total + '</b></div></div>' +
          '<div class="settings-row"><div class="settings-row__label">' + t({ id: 'Badge terbuka', en: 'Badges unlocked', mix: 'Badge terbuka' }) + '</div><div><b>' + Object.keys(st.badges.unlocked).length + '</b> / 14</div></div>' +
          '<div class="settings-row"><div class="settings-row__label">' + t({ id: 'Dokumen di roleplay', en: 'Roleplay docs', mix: 'Docs roleplay' }) + '</div><div><b>' + ((st.roleplay.docsCreated || []).length + (st.roleplay.docsReceived || []).length) + '</b></div></div>' +
          '<div class="settings-row"><div class="settings-row__label">' + t({ id: 'Aktivitas tercatat', en: 'Logged events', mix: 'Log aktivitas' }) + '</div><div><b>' + (st.activity.length || 0) + '</b></div></div>' +
        '</div>' +

        /* Override Detektif */
        '<div class="settings-block">' +
          '<div class="settings-block__title">🕵️ ' + t({ id: 'Detektif Audit', en: 'Audit Detective', mix: 'Detektif' }) + '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Jumlah Error', en: 'Error Count', mix: 'Jumlah Error' }) + '<small>' + t({ id: 'Override (0 = auto by level)', en: 'Override (0 = auto by level)', mix: 'Override (0 = auto)' }) + '</small></div>' +
            '<input type="number" class="input" id="facErrorCount" style="width:90px;min-height:36px" min="0" max="15" value="' + (fac.errorCount || 0) + '">' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Seed Acak', en: 'Random Seed', mix: 'Seed Acak' }) + '<small>' + t({ id: 'Kosong = random tiap ronde', en: 'Empty = random per round', mix: 'Kosong = random' }) + '</small></div>' +
            '<div style="display:flex;gap:6px">' +
              '<input type="text" class="input" id="facSeed" style="width:120px;min-height:36px" value="' + esc(fac.seed || '') + '" placeholder="seed">' +
              '<button class="btn btn--sm btn--ghost" id="facSeedGen" title="Generate">🎲</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Kunci Mode */
        '<div class="settings-block">' +
          '<div class="settings-block__title">🔓 ' + t({ id: 'Kontrol Sesi', en: 'Session Control', mix: 'Kontrol Sesi' }) + '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Sembunyikan Skor', en: 'Hide Score', mix: 'Hide Skor' }) + '<small>' + t({ id: 'Untuk latihan non-kompetitif', en: 'For non-competitive training', mix: 'Latihan non-kompetitif' }) + '</small></div>' +
            '<label class="switch"><input type="checkbox" id="facHideScore" ' + (fac.hideScore ? 'checked' : '') + '><span class="switch__track"></span></label>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Buka Semua Mode', en: 'Unlock All Modes', mix: 'Buka Semua Mode' }) + '<small>' + t({ id: 'Bebas eksplorasi tanpa urutan', en: 'Free exploration', mix: 'Bebas eksplorasi' }) + '</small></div>' +
            '<button class="btn btn--sm btn--ghost" id="facUnlockAll">🔓 ' + t({ id: 'Buka', en: 'Unlock', mix: 'Buka' }) + '</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row__label">' + t({ id: 'Reset Pencapaian', en: 'Reset Achievements', mix: 'Reset Pencapaian' }) + '</div>' +
            '<button class="btn btn--sm btn--ghost" id="facResetBadges">🔄 ' + t({ id: 'Reset', en: 'Reset', mix: 'Reset' }) + '</button>' +
          '</div>' +
        '</div>' +

        /* Export */
        '<div class="settings-block">' +
          '<div class="settings-block__title">📥 ' + t({ id: 'Ekspor Hasil', en: 'Export Results', mix: 'Ekspor Hasil' }) + '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
            '<button class="btn btn--sm btn--primary" id="facExpJSON">📥 JSON</button>' +
            '<button class="btn btn--sm btn--ghost" id="facExpCSV">📊 CSV</button>' +
            '<button class="btn btn--sm btn--ghost" id="facExpCert">📜 ' + t({ id: 'Sertifikat', en: 'Certificate', mix: 'Sertifikat' }) + '</button>' +
            '<button class="btn btn--sm btn--ghost" id="facCopyJSON">📋 Copy</button>' +
          '</div>' +
        '</div>' +

        /* Zona Bahaya */
        '<div class="fac-danger">' +
          '<div class="fac-danger__title">' + t({ id: '⚠️ Zona Bahaya', en: '⚠️ Danger Zone', mix: '⚠️ Zona Bahaya' }) + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            '<button class="btn btn--sm btn--outline" id="facReseedDoc" style="justify-content:flex-start">🎲 ' + t({ id: 'Regenerate Data Dokumen', en: 'Regenerate Document Data', mix: 'Regenerate Data' }) + '</button>' +
            '<button class="btn btn--sm btn--outline" id="facResetProgress" style="justify-content:flex-start">🔄 ' + t({ id: 'Reset Progres (keep prefs)', en: 'Reset Progress (keep prefs)', mix: 'Reset Progres' }) + '</button>' +
            '<button class="btn btn--sm btn--danger" id="facResetAll" style="justify-content:flex-start">💥 ' + t({ id: 'HARD Reset Semua', en: 'HARD Reset All', mix: 'HARD Reset' }) + '</button>' +
          '</div>' +
        '</div>' +

      '</div>';

    if (!global.App) return;
    App.openModal({
      title: '🛡️ ' + t({ id: 'Panel Fasilitator', en: 'Facilitator Panel', mix: 'Fasilitator Panel' }),
      html,
      footer:
        '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Tutup', en: 'Close', mix: 'Tutup' }) + '</button>' +
        '<button class="btn btn--primary" id="facSave">💾 ' + t({ id: 'Simpan', en: 'Save', mix: 'Simpan' }) + '</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'facSave') {
          applyChanges();
          App.closeModal();
          App.toast('ok', t({ id: 'Tersimpan', en: 'Saved', mix: 'Saved' }), '');
        }
      },
    });

    setTimeout(bindPanel, 40);
  }

  /* ============================================================
     2. BIND AKSI PANEL
     ============================================================ */
  function bindPanel() {
    const seedGen = document.getElementById('facSeedGen');
    if (seedGen) seedGen.addEventListener('click', () => {
      const s = Math.random().toString(36).slice(2, 10);
      const inp = document.getElementById('facSeed');
      if (inp) inp.value = s;
    });

    const hide = document.getElementById('facHideScore');
    if (hide) hide.addEventListener('change', () => {
      Store.set('facilitator.hideScore', hide.checked);
      const chip = document.getElementById('scoreChip');
      if (chip) chip.style.opacity = hide.checked ? '0.25' : '1';
      App.toast('info', hide.checked ? '🔒 Skor disembunyikan' : '🔓 Skor ditampilkan', '');
    });

    const unlock = document.getElementById('facUnlockAll');
    if (unlock) unlock.addEventListener('click', () => {
      const all = ['beranda', 'materi', 'roleplay', 'puzzle', 'detektif', 'pencapaian', 'pustaka', 'pengaturan'];
      Store.set('facilitator.unlockedModes', all);
      App.toast('ok', '🔓 ' + t({ id: 'Semua mode terbuka', en: 'All modes unlocked', mix: 'Semua terbuka' }), '');
    });

    const rBadges = document.getElementById('facResetBadges');
    if (rBadges) rBadges.addEventListener('click', () => {
      Store.set('badges', { unlocked: {}, progress: {} });
      App.toast('ok', t({ id: 'Badge direset', en: 'Badges reset', mix: 'Badge reset' }), '');
    });

    const eJSON = document.getElementById('facExpJSON');
    if (eJSON && global.Export) eJSON.addEventListener('click', () => Export.downloadJSON());
    const eCSV = document.getElementById('facExpCSV');
    if (eCSV && global.Export) eCSV.addEventListener('click', () => Export.downloadCSV());
    const eCert = document.getElementById('facExpCert');
    if (eCert && global.Export) eCert.addEventListener('click', () => Export.printCertificate());
    const cJSON = document.getElementById('facCopyJSON');
    if (cJSON && global.Export) cJSON.addEventListener('click', () => Export.copyJSON());

    const reseed = document.getElementById('facReseedDoc');
    if (reseed) reseed.addEventListener('click', () => {
      // Force re-generate dengan mengosongkan cache
      Store.set('facilitator.seed', Math.random().toString(36).slice(2, 10));
      App.toast('ok', '🎲 ' + t({ id: 'Data akan di-regenerate di sesi berikutnya', en: 'Data will regenerate on next session', mix: 'Data akan regenerate' }), '');
    });

    const rProg = document.getElementById('facResetProgress');
    if (rProg) rProg.addEventListener('click', () => {
      Store.resetProgress();
      App.toast('ok', t({ id: 'Progres direset', en: 'Progress reset', mix: 'Progres reset' }), '');
      setTimeout(() => location.reload(), 500);
    });

    const rAll = document.getElementById('facResetAll');
    if (rAll) rAll.addEventListener('click', () => {
      if (confirm('HARD RESET — semua data akan hilang. Yakin?')) {
        Store.reset(false);
        localStorage.removeItem('o2c.lab.state.v1');
        location.reload();
      }
    });
  }

  function applyChanges() {
    const ec = document.getElementById('facErrorCount');
    const seed = document.getElementById('facSeed');
    const hide = document.getElementById('facHideScore');
    if (ec) Store.set('facilitator.errorCount', Number(ec.value) || 0);
    if (seed) Store.set('facilitator.seed', seed.value.trim() || null);
    if (hide) Store.set('facilitator.hideScore', hide.checked);
  }

  /* ============================================================
     3. TOGGLE PANEL
     ============================================================ */
  function toggle() {
    // Kalau sudah terbuka (modal title = fasilitator), tutup
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    if (modal && !modal.hidden && title && /Fasilitator/i.test(title.textContent)) {
      if (global.App) App.closeModal();
      return;
    }
    render();
  }

  /* ============================================================
     4. INIT
     ============================================================ */
  function init() {
    document.addEventListener('facilitator:toggle', toggle);
    // Terapkan hide score saat boot
    const hide = Store.get('facilitator.hideScore');
    if (hide) {
      const chip = document.getElementById('scoreChip');
      if (chip) chip.style.opacity = '0.25';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.Fasilitator = { render, toggle };

})(window);