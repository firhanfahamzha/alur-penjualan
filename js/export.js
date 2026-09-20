/* ============================================================
   EXPORT.JS — Ekspor JSON, CSV, Sertifikat, Copy
   ============================================================
   API:
     Export.downloadJSON()
     Export.downloadCSV()
     Export.copyJSON()
     Export.printCertificate()
     Export.getSummaryText()
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- UTIL ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = () => {
    const d = new Date();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
           pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  };

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 120);
  }

  function toast(ok, msg) {
    if (global.App && App.toast) App.toast(ok ? 'ok' : 'bad', msg, '');
  }

  /* ============================================================
     1. JSON EXPORT
     ============================================================ */
  function buildExportPayload() {
    const st = Store.get();
    return {
      meta: {
        app: 'Order-to-Cash Interactive Lab',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        sessionId: st.session.id,
      },
      session: st.session,
      company: st.company,
      product: st.product,
      score: st.score,
      progress: st.progress,
      badges: st.badges,
      roleplay: st.roleplay,
      puzzle: st.puzzle,
      detektif: st.detektif,
      prefs: st.prefs,
      facilitator: st.facilitator,
      activity: st.activity,
    };
  }

  function downloadJSON() {
    const payload = buildExportPayload();
    const filename = 'o2c-lab-' + stamp() + '.json';
    download(filename, JSON.stringify(payload, null, 2), 'application/json');
    toast(true, '📥 JSON diunduh');
  }

  function copyJSON() {
    const json = JSON.stringify(buildExportPayload(), null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(() => {
        toast(true, '📋 JSON disalin ke clipboard');
      }).catch(() => fallbackCopy(json));
    } else {
      fallbackCopy(json);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(true, '📋 Disalin');
    } catch (_) { toast(false, 'Gagal menyalin'); }
    ta.remove();
  }

  /* ============================================================
     2. CSV EXPORT (Activity Log)
     ============================================================ */
  function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadCSV() {
    const st = Store.get();
    const rows = [];

    // Header
    rows.push(['waktu', 'event', 'data'].map(csvEscape).join(','));

    (st.activity || []).forEach(a => {
      rows.push([
        new Date(a.t).toISOString(),
        a.event || '',
        a.data ? JSON.stringify(a.data) : '',
      ].map(csvEscape).join(','));
    });

    // Tambah ringkasan skor di bawah
    rows.push('');
    rows.push(['# RINGKASAN', '', ''].join(','));
    rows.push(['Total Poin', st.score.total, ''].join(','));
    Object.keys(st.score.byMode).forEach(m => {
      rows.push([('Poin ' + m), st.score.byMode[m], ''].join(','));
    });
    rows.push(['Badge Terbuka', Object.keys(st.badges.unlocked).length, ''].join(','));

    // Riwayat skor
    rows.push('');
    rows.push(['# RIWAYAT SKOR', '', ''].join(','));
    rows.push(['waktu', 'mode', 'delta', 'alasan'].map(csvEscape).join(','));
    (st.score.history || []).forEach(h => {
      rows.push([
        new Date(h.t).toISOString(),
        h.mode || '',
        h.delta,
        h.reason || '',
      ].map(csvEscape).join(','));
    });

    const csv = '\uFEFF' + rows.join('\n'); // BOM untuk Excel
    download('o2c-lab-' + stamp() + '.csv', csv, 'text/csv;charset=utf-8');
    toast(true, '📊 CSV diunduh');
  }

  /* ============================================================
     3. SUMMARY TEXT
     ============================================================ */
  function getSummaryText() {
    const st = Store.get();
    const lvl = global.Gamifikasi ? Gamifikasi.getLevel(st.score.total) : { current: { name: { id: 'Pemula' } } };
    const unlocked = Object.keys(st.badges.unlocked).length;

    const lines = [
      '════════════════════════════════════════════',
      '   ORDER-TO-CASH INTERACTIVE LAB — LAPORAN',
      '════════════════════════════════════════════',
      '',
      'Sesi ID     : ' + st.session.id,
      'Dimulai     : ' + new Date(st.session.startedAt).toLocaleString('id-ID'),
      'Peserta     : Firhan Fahamzha Global (simulasi)',
      '',
      '─────────────────────────────────────────────',
      '  RINGKASAN SKOR',
      '─────────────────────────────────────────────',
      'Total Poin  : ' + st.score.total,
      'Level       : ' + (lvl.current.name.id || 'Pemula'),
      'Badge       : ' + unlocked + ' / 14',
      '',
      'Per Mode:',
      '  • Materi     : ' + (st.score.byMode.materi || 0) + ' poin',
      '  • Roleplay   : ' + (st.score.byMode.roleplay || 0) + ' poin',
      '  • Puzzle     : ' + (st.score.byMode.puzzle || 0) + ' poin',
      '  • Detektif   : ' + (st.score.byMode.detektif || 0) + ' poin',
      '',
      '─────────────────────────────────────────────',
      '  BADGE TERBUKA',
      '─────────────────────────────────────────────',
    ];

    if (global.BADGES) {
      Object.keys(global.BADGES).forEach(id => {
        const unlockedAt = st.badges.unlocked[id];
        if (unlockedAt) {
          lines.push('  ✅ ' + global.BADGES[id].icon + ' ' + (global.BADGES[id].name.id || id));
        }
      });
    }

    lines.push('');
    lines.push('─────────────────────────────────────────────');
    lines.push('  DIBUAT OTOMATIS — ' + new Date().toLocaleString('id-ID'));
    lines.push('  PT Firhan Fahamzha Global · Divisi Pelatihan');
    lines.push('════════════════════════════════════════════');

    return lines.join('\n');
  }

  function copySummary() {
    fallbackCopy(getSummaryText());
  }

  /* ============================================================
     4. SERTIFIKAT (via modal cetak)
     ============================================================ */
  function printCertificate() {
    const st = Store.get();
    const lvl = global.Gamifikasi ? Gamifikasi.getLevel(st.score.total) : { current: { name: { id: 'Pemula' } } };
    const unlocked = Object.keys(st.badges.unlocked).length;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const certId = 'FFG-CERT-' + st.session.id.slice(-6).toUpperCase();

    const html =
      '<div id="certificate" style="padding:40px;background:#fffdf6;color:#1a2a3e;border:8px double #b9772c;border-radius:12px;text-align:center;font-family:serif">' +
        '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a7551;font-weight:700;margin-bottom:16px">Certificate of Completion</div>' +
        '<div style="font-size:36px;font-weight:800;letter-spacing:-1px;color:#1e5f8e;margin-bottom:6px">Order-to-Cash Lab</div>' +
        '<div style="font-size:13px;color:#6a5636;margin-bottom:30px">PT Firhan Fahamzha Global · Divisi Pelatihan</div>' +

        '<div style="border-top:1px solid #d4c396;border-bottom:1px solid #d4c396;padding:24px 0;margin-bottom:24px">' +
          '<div style="font-size:12px;color:#8a7551;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:10px">Diberikan kepada</div>' +
          '<div style="font-size:30px;font-weight:800;font-family:Georgia,serif;color:#1a2a3e;margin-bottom:10px;font-style:italic">Peserta Simulasi</div>' +
          '<div style="font-size:12px;color:#6a5636;line-height:1.6;max-width:520px;margin:0 auto">' +
            'telah menyelesaikan <b>Simulasi Alur Penjualan Order-to-Cash</b> dengan hasil:' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px;max-width:520px;margin-left:auto;margin-right:auto">' +
          '<div><div style="font-size:11px;color:#8a7551;text-transform:uppercase;letter-spacing:.8px;font-weight:700">Skor</div><div style="font-size:28px;font-weight:800;color:#8a5a1f;font-family:monospace">' + st.score.total + '</div></div>' +
          '<div><div style="font-size:11px;color:#8a7551;text-transform:uppercase;letter-spacing:.8px;font-weight:700">Level</div><div style="font-size:20px;font-weight:800;color:#2a7de1;margin-top:6px">' + (lvl.current.name.id || 'Pemula') + '</div></div>' +
          '<div><div style="font-size:11px;color:#8a7551;text-transform:uppercase;letter-spacing:.8px;font-weight:700">Badge</div><div style="font-size:28px;font-weight:800;color:#b9772c;font-family:monospace">' + unlocked + '</div></div>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-around;align-items:flex-end;margin-top:40px;padding-top:24px;border-top:1px dashed #d4c396">' +
          '<div style="text-align:center">' +
            '<div style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:#1a2a3e;margin-bottom:4px">Firhan Fahamzha</div>' +
            '<div style="font-size:10.5px;color:#8a7551;letter-spacing:.5px;text-transform:uppercase;font-weight:700">Direktur</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div style="font-size:10.5px;color:#8a7551;letter-spacing:.5px;text-transform:uppercase;font-weight:700">Diberikan</div>' +
            '<div style="font-size:13px;color:#1a2a3e;font-weight:700;margin-top:4px">' + today + '</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div style="font-size:10.5px;color:#8a7551;letter-spacing:.5px;text-transform:uppercase;font-weight:700">No. Sertifikat</div>' +
            '<div style="font-family:monospace;font-size:12px;color:#1a2a3e;font-weight:700;margin-top:4px">' + certId + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<style>@media print { body * { display: none !important; } #certPrintArea, #certPrintArea * { display: block !important; } .no-print { display: none !important; } }</style>' +

      '<div class="mt-3" style="text-align:center">' +
        '<button class="btn btn--primary" id="certPrintBtn">🖨️ ' + (global.I18N ? I18N.t('common.print') || 'Cetak' : 'Cetak') + '</button>' +
      '</div>';

    if (!global.App) return;
    App.openModal({
      title: '📜 ' + t({ id: 'Sertifikat', en: 'Certificate', mix: 'Sertifikat' }),
      html: '<div id="certPrintArea">' + html + '</div>',
      footer:
        '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Tutup', en: 'Close', mix: 'Tutup' }) + '</button>' +
        '<button class="btn btn--primary" id="certPrintFooter">🖨️ Print</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'certPrintFooter') {
          window.print();
        }
      },
    });

    setTimeout(() => {
      const b = document.getElementById('certPrintBtn');
      if (b) b.addEventListener('click', () => window.print());
    }, 60);
  }

  const t = (obj) => {
    if (!obj) return '';
    const lang = (global.I18N && I18N.get && I18N.get()) || 'mix';
    return obj[lang] || obj.mix || obj.id || obj.en || '';
  };

  /* ============================================================
     5. EXPORT MODULE
     ============================================================ */
  global.Export = {
    downloadJSON,
    downloadCSV,
    copyJSON,
    copySummary,
    printCertificate,
    getSummaryText,
    buildExportPayload,
  };

})(window);