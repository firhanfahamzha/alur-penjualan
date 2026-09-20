/* ============================================================
   I18N.JS — Sistem Terjemahan 3 Mode (id / en / mix)
   ============================================================
   Cara pakai:
     I18N.t('nav.beranda')      → string sesuai bahasa aktif
     I18N.set('en')             → ganti bahasa
     I18N.apply(document.body)  → auto-render [data-i18n]
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- KAMUS ---------- */
  const DICT = {
    /* ====== APP ====== */
    'app.name':        { id: 'Order-to-Cash Lab',        en: 'Order-to-Cash Lab',        mix: 'Order-to-Cash Lab' },
    'app.tagline':     { id: 'Simulasi Alur Penjualan',  en: 'Sales Flow Simulator',     mix: 'Simulasi Sales Flow' },
    'app.ready':       { id: 'Siap!',                    en: 'Ready!',                   mix: 'Ready, bre!' },
    'app.loading':     { id: 'Memuat…',                  en: 'Loading…',                 mix: 'Loading…' },

    /* ====== TOPBAR ====== */
    'top.search':      { id: 'Cari dokumen, istilah, skenario…', en: 'Search documents, terms, scenarios…', mix: 'Cari dokumen, terms, skenario…' },
    'top.theme':       { id: 'Tema',                     en: 'Theme',                    mix: 'Theme' },
    'top.lang':        { id: 'Bahasa',                   en: 'Language',                 mix: 'Bahasa / Language' },
    'top.facilitator': { id: 'Mode Fasilitator',         en: 'Facilitator Mode',         mix: 'Mode Fasilitator' },
    'top.menu':        { id: 'Menu',                     en: 'Menu',                     mix: 'Menu' },

    /* ====== TEMA ====== */
    'theme.light':     { id: '☀️ Terang',                en: '☀️ Light',                 mix: '☀️ Light / Terang' },
    'theme.dark':      { id: '🌙 Gelap',                 en: '🌙 Dark',                  mix: '🌙 Dark / Gelap' },
    'theme.sepia':     { id: '📜 Sepia',                 en: '📜 Sepia',                 mix: '📜 Sepia' },
    'theme.auto':      { id: '🖥️ Ikuti Sistem',          en: '🖥️ Follow System',        mix: '🖥️ Auto (System)' },

    /* ====== BAHASA ====== */
    'lang.id':         { id: '🇮🇩 Bahasa Indonesia',     en: '🇮🇩 Bahasa Indonesia',     mix: '🇮🇩 Indonesia' },
    'lang.en':         { id: '🇬🇧 English',              en: '🇬🇧 English',              mix: '🇬🇧 English' },
    'lang.mix':        { id: '🔀 Campur',                en: '🔀 Mixed',                 mix: '🔀 Campur (ID+EN)' },

    /* ====== SIDEBAR ====== */
    'side.mode':       { id: 'Mode',                     en: 'Modes',                    mix: 'Mode' },
    'side.extra':      { id: 'Ekstra',                   en: 'Extras',                   mix: 'Extras' },
    'side.identity':   { id: 'Identitas Latihan',        en: 'Practice Identity',        mix: 'Practice Identity' },
    'side.progress':   { id: 'Progres sesi',             en: 'Session progress',         mix: 'Session Progress' },

    /* ====== NAVIGASI ====== */
    'nav.beranda':     { id: 'Beranda',                  en: 'Home',                     mix: 'Home' },
    'nav.beranda.sub': { id: 'Briefing misi & role',     en: 'Mission brief & roles',    mix: 'Briefing & roles' },
    'nav.materi':      { id: 'Materi Alur',              en: 'Flow Material',            mix: 'Flow Material' },
    'nav.materi.sub':  { id: '5 tahap Order-to-Cash',    en: '5 stages of Order-to-Cash',mix: '5 stages O2C' },
    'nav.roleplay':    { id: 'Simulasi Peran',           en: 'Roleplay',                 mix: 'Roleplay' },
    'nav.roleplay.sub':{ id: 'Penjual ⇄ Pembeli',        en: 'Seller ⇄ Buyer',           mix: 'Seller ⇄ Buyer' },
    'nav.puzzle':      { id: 'Puzzle Dokumen',           en: 'Document Puzzle',          mix: 'Document Puzzle' },
    'nav.puzzle.sub':  { id: 'Susun urutan yang benar',  en: 'Order the documents',      mix: 'Susun urutan benar' },
    'nav.detektif':    { id: 'Detektif Audit',           en: 'Audit Detective',          mix: 'Audit Detective' },
    'nav.detektif.sub':{ id: 'Temukan ketidakcocokan',   en: 'Find the mismatch',        mix: 'Cari mismatch' },
    'nav.pencapaian':  { id: 'Pencapaian',               en: 'Achievements',             mix: 'Achievements' },
    'nav.pencapaian.sub': { id: 'Badge & progres',       en: 'Badges & progress',        mix: 'Badges & progress' },
    'nav.pustaka':     { id: 'Pustaka Dokumen',          en: 'Document Library',         mix: 'Doc Library' },
    'nav.pustaka.sub': { id: '18 template siap pakai',   en: '18 ready templates',       mix: '18 templates' },
    'nav.pengaturan':  { id: 'Pengaturan',               en: 'Settings',                 mix: 'Settings' },
    'nav.pengaturan.sub': { id: 'Preferensi & reset',    en: 'Preferences & reset',      mix: 'Preferensi & reset' },

    /* ====== HERO ====== */
    'hero.live':       { id: '● Sesi Latihan Aktif',     en: '● Training Session Live',  mix: '● Live Session' },
    'hero.scale':      { id: 'Skala Perusahaan Besar',   en: 'Large-Scale Company',      mix: 'Big-Scale Company' },
    'hero.o2c':        { id: 'Order-to-Cash',            en: 'Order-to-Cash',            mix: 'O2C' },
    'hero.title1':     { id: 'Simulasi Alur Penjualan',  en: 'Sales Flow Simulation',    mix: 'Simulasi Sales Flow' },
    'hero.title2':     { id: 'Interaktif',               en: 'Interactive',              mix: 'Interactive' },
    'hero.lead':       {
      id: 'Dari <b>Quotation</b> Firhan Fahamzha hingga <b>Invoice</b> yang lunas — jalani peran, susun dokumen, dan bongkar jejak audit. Semua dalam satu lab.',
      en: 'From <b>Quotation</b> by Firhan Fahamzha to a paid <b>Invoice</b> — play roles, arrange documents, and crack the audit trail. All in one lab.',
      mix: 'Dari <b>Quotation</b> Firhan Fahamzha sampai <b>Invoice</b> lunas — jalani peran, susun dokumen, buka audit trail. All in one lab.'
    },
    'hero.ctaRole':    { id: 'Mulai Simulasi Peran',     en: 'Start Roleplay',           mix: 'Start Roleplay' },
    'hero.ctaMateri':  { id: 'Pelajari Alur Dulu',       en: 'Study the Flow First',     mix: 'Learn Flow First' },
    'hero.ctaResume':  { id: 'Lanjutkan Sesi',           en: 'Resume Session',           mix: 'Resume Session' },
    'hero.statStages': { id: 'Tahapan Alur',             en: 'Flow Stages',              mix: 'Flow Stages' },
    'hero.statDocs':   { id: 'Jenis Dokumen',            en: 'Document Types',           mix: 'Doc Types' },
    'hero.statModes':  { id: 'Mode Interaktif',          en: 'Interactive Modes',        mix: 'Interactive Modes' },
    'hero.statLevels': { id: 'Tingkat Kesulitan',        en: 'Difficulty Levels',        mix: 'Difficulty Levels' },

    /* ====== SECTION ====== */
    'section.pickAdventure': { id: 'Pilih Petualanganmu', en: 'Pick Your Adventure',     mix: 'Pick Your Adventure' },
    'section.pickSub': { id: 'Empat mode, satu cerita — bebas kamu eksplorasi sesukamu.', en: 'Four modes, one story — explore freely.', mix: 'Empat mode, satu cerita — bebas eksplor!' },
    'section.story':   { id: 'Cerita di Balik Simulasi', en: 'Story Behind the Simulation', mix: 'Story Behind Simulation' },
    'section.storySub':{ id: 'Firhan Fahamzha baru saja menerima inquiry besar dari Kopi Senja Group.', en: 'Firhan Fahamzha just received a huge inquiry from Kopi Senja Group.', mix: 'Firhan Fahamzha baru dapat inquiry gede dari Kopi Senja Group.' },
    'section.flow':    { id: 'Kilas Alur (Order-to-Cash)', en: 'Flow Overview (Order-to-Cash)', mix: 'Flow Overview (O2C)' },
    'section.flowSub': { id: 'Lima babak, satu tujuan: uang masuk dan tercatat rapi.', en: 'Five acts, one goal: money in, books clean.', mix: 'Five acts, one goal: uang masuk, buku rapi.' },

    /* ====== MODE CARDS ====== */
    'mode.materi.desc':    { id: 'Kupas 5 tahap Order-to-Cash beserta dokumen aslinya. Ada contoh nomor, tanggal, dan fungsi tiap kertas.', en: 'Dive into 5 Order-to-Cash stages with real documents. Sample numbers, dates, and purpose.', mix: 'Kupas 5 tahap O2C + dokumen asli. Ada nomor, tanggal, & fungsi.' },
    'mode.materi.b1':      { id: 'Accordion interaktif 5 tahap', en: 'Interactive 5-stage accordion', mix: 'Accordion 5 tahap' },
    'mode.materi.b2':      { id: '18 kartu dokumen detail',       en: '18 detailed doc cards',          mix: '18 doc cards' },
    'mode.materi.b3':      { id: 'Diagram mini alur',             en: 'Mini flow diagram',              mix: 'Mini flow diagram' },
    'mode.roleplay.desc':  { id: 'Jadi Penjual atau Pembeli. Susun dokumen sungguhan dari inquiry sampai kuitansi — lengkap dengan negosiasi harga.', en: 'Be a Seller or Buyer. Build real documents from inquiry to receipt — with price negotiation.', mix: 'Jadi Seller atau Buyer. Susun dokumen asli dari inquiry sampai kuitansi + nego harga.' },
    'mode.roleplay.b1':    { id: 'Panel ganda Penjual ⇄ Pembeli', en: 'Dual panel Seller ⇄ Buyer',     mix: 'Dual panel Seller ⇄ Buyer' },
    'mode.roleplay.b2':    { id: 'Form dokumen berisi data nyata', en: 'Document forms with real data', mix: 'Form dokumen + data real' },
    'mode.roleplay.b3':    { id: 'Ronde negosiasi diskon',         en: 'Discount negotiation round',    mix: 'Round nego diskon' },
    'mode.puzzle.desc':    { id: 'Dokumen diacak, urutannya hilang. Susun ulang jadi cerita transaksi yang logis — drag, lepas, validasi.', en: 'Shuffled docs, missing order. Rearrange into a logical transaction — drag, drop, validate.', mix: 'Dokumen diacak. Susun jadi cerita transaksi logis — drag, drop, validate.' },
    'mode.puzzle.b1':      { id: '3 tingkat kesulitan',            en: '3 difficulty levels',           mix: '3 difficulty levels' },
    'mode.puzzle.b2':      { id: 'Timer, hint, skor bintang',      en: 'Timer, hints, star score',      mix: 'Timer, hints, stars' },
    'mode.puzzle.b3':      { id: 'Mode buta nama (ikon saja)',     en: 'Blind mode (icons only)',       mix: 'Icon-only mode' },
    'mode.detektif.desc':  { id: 'Satu bendel penjualan punya jebakan. Temukan selisih qty, diskon hilang, tanggal mundur — sebelum auditor menemukannya.', en: 'One sales bundle has traps. Spot qty mismatch, missing discount, backwards dates — before the auditor does.', mix: 'Satu bundle ada traps. Temukan mismatch qty, diskon hilang, tanggal mundur — sebelum auditor.' },
    'mode.detektif.b1':    { id: '3–9 error acak per ronde',       en: '3–9 random errors per round',   mix: '3–9 random errors' },
    'mode.detektif.b2':    { id: 'Pilih alasan cross-check',       en: 'Pick the cross-check reason',   mix: 'Pilih alasan cross-check' },
    'mode.detektif.b3':    { id: 'Laporan akhir edukatif',         en: 'Educational final report',      mix: 'Edukatif final report' },

    /* ====== STORY ====== */
    'story.title':   { id: '500 kg Arabika Gayo · Incoterms FOB Medan', en: '500 kg Gayo Arabica · Incoterms FOB Medan', mix: '500 kg Gayo Arabica · FOB Medan' },
    'story.p1':      { id: 'Firhan sebagai Direktur PT Firhan Fahamzha Global harus memutuskan margin, syarat pembayaran (NET 30 atau DP 30%), dan jadwal kirim. Di sisi lain, Nadia dari Kopi Senja Group harus menekan harga, memastikan lead time, dan mengamankan kualitas.', en: 'As Director of PT Firhan Fahamzha Global, Firhan must decide margin, payment terms (NET 30 or 30% DP), and delivery schedule. On the other side, Nadia from Kopi Senja Group must push price down and lock in quality.', mix: 'Firhan, Direktur PT Firhan Fahamzha Global, harus tentukan margin, payment terms (NET 30 / DP 30%), dan jadwal kirim. Nadia dari Kopi Senja Group harus tekan harga dan kunci kualitas.' },
    'story.p2':      { id: 'Di setiap langkah, ada dokumen yang harus diterbitkan dan dipertukarkan. Kalau salah urut atau salah isi, dampaknya kerasa di pembukuan — dan di denda kontrak.', en: 'Every step has documents to issue and exchange. Get the order or the data wrong, and it shows in the books — and in contract penalties.', mix: 'Tiap langkah ada dokumen yang harus diterbitkan & ditukar. Salah urut atau salah isi = chaos di pembukuan + denda.' },
    'story.cta':     { id: 'Jalani Ceritanya →', en: 'Play the Story →', mix: 'Play Story →' },

    /* ====== CALLOUT FASILITATOR ====== */
    'fac.inline.title': { id: 'Untuk Fasilitator', en: 'For Facilitators', mix: 'For Facilitators' },
    'fac.inline.body':  { id: 'Buka <b>Mode Fasilitator</b> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>) untuk mengatur jumlah error, mengacak ulang data dokumen, membuka kunci mode, dan mengekspor hasil sesi (JSON/CSV). Cocok untuk sesi 2 jam atau workshop maraton.', en: 'Open <b>Facilitator Mode</b> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>) to set error counts, reshuffle document data, unlock modes, and export session results (JSON/CSV).', mix: 'Buka <b>Facilitator Mode</b> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>) untuk atur error count, reshuffle data, unlock mode, & export hasil (JSON/CSV).' },
    'fac.inline.cta':   { id: 'Buka Mode Fasilitator', en: 'Open Facilitator Mode', mix: 'Open Facilitator' },

    /* ====== FLOWLINE ====== */
    'flow.1':   { id: 'Pra-Penjualan & Penawaran',   en: 'Pre-Sales & Quotation',   mix: 'Pre-Sales & Quotation' },
    'flow.1i':  { id: 'Inquiry → Kalkulasi → Quotation → Negosiasi', en: 'Inquiry → Costing → Quotation → Negotiation', mix: 'Inquiry → Kalkulasi → Quotation → Nego' },
    'flow.2':   { id: 'Pemesanan & Kredit/Kontrak',  en: 'Order & Credit/Contract', mix: 'Order & Credit/Contract' },
    'flow.2i':  { id: 'PO → Sales Order → Credit Check → Kontrak',   en: 'PO → Sales Order → Credit Check → Contract',   mix: 'PO → SO → Credit Check → Contract' },
    'flow.3':   { id: 'Pemenuhan & Pengiriman',      en: 'Fulfillment & Delivery',  mix: 'Fulfillment & Delivery' },
    'flow.3i':  { id: 'Picking → Packing → Delivery Order → POD',    en: 'Picking → Packing → Delivery Order → POD',     mix: 'Picking → Packing → DO → POD' },
    'flow.4':   { id: 'Penagihan & Pembayaran',      en: 'Invoicing & Payment',     mix: 'Invoicing & Payment' },
    'flow.4i':  { id: 'Proforma → Invoice → Remittance → Bank',      en: 'Proforma → Invoice → Remittance → Bank',       mix: 'Proforma → Invoice → Remittance → Bank' },
    'flow.5':   { id: 'Pasca-Penjualan & Arsip',     en: 'Post-Sales & Archive',    mix: 'Post-Sales & Archive' },
    'flow.5i':  { id: 'RMA → Credit Note → Revenue → Arsip',         en: 'RMA → Credit Note → Revenue → Archive',        mix: 'RMA → Credit Note → Revenue → Archive' },

    /* ====== UMUM ====== */
    'common.close':    { id: 'Tutup',           en: 'Close',           mix: 'Close' },
    'common.save':     { id: 'Simpan',          en: 'Save',            mix: 'Save' },
    'common.cancel':   { id: 'Batal',           en: 'Cancel',          mix: 'Cancel' },
    'common.confirm':  { id: 'Konfirmasi',      en: 'Confirm',         mix: 'Confirm' },
    'common.next':     { id: 'Lanjut',          en: 'Next',            mix: 'Next' },
    'common.prev':     { id: 'Sebelumnya',      en: 'Previous',        mix: 'Back' },
    'common.finish':   { id: 'Selesai',         en: 'Finish',          mix: 'Finish' },
    'common.reset':    { id: 'Reset',           en: 'Reset',           mix: 'Reset' },
    'common.start':    { id: 'Mulai',           en: 'Start',           mix: 'Start' },
    'common.retry':    { id: 'Coba Lagi',       en: 'Retry',           mix: 'Retry' },
    'common.continue': { id: 'Lanjutkan',       en: 'Continue',        mix: 'Continue' },
    'common.back':     { id: 'Kembali',         en: 'Back',            mix: 'Back' },
    'common.yes':      { id: 'Ya',              en: 'Yes',             mix: 'Ya' },
    'common.no':       { id: 'Tidak',           en: 'No',              mix: 'No' },
    'common.loading':  { id: 'Memuat…',         en: 'Loading…',        mix: 'Loading…' },
    'common.empty':    { id: 'Belum ada data',  en: 'No data yet',     mix: 'No data yet' },
    'common.locked':   { id: 'Terkunci',        en: 'Locked',          mix: 'Locked' },
    'common.unlocked': { id: 'Terbuka',         en: 'Unlocked',        mix: 'Unlocked' },

    /* ====== TOAST ====== */
    'toast.saved':     { id: 'Berhasil disimpan',    en: 'Saved successfully',   mix: 'Saved!' },
    'toast.copied':    { id: 'Disalin ke clipboard', en: 'Copied to clipboard',  mix: 'Copied!' },
    'toast.resetOk':   { id: 'Data sesi direset',    en: 'Session reset',        mix: 'Session reset' },
    'toast.wrong':     { id: 'Belum tepat',          en: 'Not quite',            mix: 'Not quite' },
    'toast.correct':   { id: 'Tepat sekali!',        en: 'Correct!',             mix: 'Correct!' },
    'toast.badgeGot':  { id: 'Badge baru terbuka!',  en: 'New badge unlocked!',  mix: 'New badge!' },
    'toast.langSet':   { id: 'Bahasa diperbarui',    en: 'Language updated',     mix: 'Language updated' },
    'toast.themeSet':  { id: 'Tema diperbarui',      en: 'Theme updated',        mix: 'Theme updated' },

    /* ====== PENGATURAN ====== */
    'set.appearance':  { id: 'Tampilan',           en: 'Appearance',         mix: 'Appearance' },
    'set.appearance.d':{ id: 'Tema dan bahasa',    en: 'Theme and language', mix: 'Theme & language' },
    'set.data':        { id: 'Data Sesi',          en: 'Session Data',       mix: 'Session Data' },
    'set.data.d':      { id: 'Simpan, ekspor, reset', en: 'Save, export, reset', mix: 'Save, export, reset' },
    'set.access':      { id: 'Aksesibilitas',      en: 'Accessibility',      mix: 'A11y' },
    'set.access.d':    { id: 'Reduced motion, kontras', en: 'Reduced motion, contrast', mix: 'Motion & contrast' },

    /* ====== EMPTY STATE ====== */
    'empty.title':     { id: 'Belum ada apa-apa',  en: 'Nothing here yet',   mix: 'Nothing here yet' },
    'empty.msg':       { id: 'Mulai dari Beranda atau pilih mode di sidebar.', en: 'Start from Home or pick a mode in the sidebar.', mix: 'Mulai dari Home atau pilih mode di sidebar.' },

    /* ====== UNTUK MODUL LAIN (placeholder, diisi part berikutnya) ====== */
    'rp.title':        { id: 'Simulasi Peran',         en: 'Roleplay Simulation',    mix: 'Roleplay' },
    'rp.chooseRole':   { id: 'Pilih peranmu',          en: 'Choose your role',       mix: 'Pilih role' },
    'rp.seller':       { id: 'Penjual',                en: 'Seller',                 mix: 'Seller' },
    'rp.buyer':        { id: 'Pembeli',                en: 'Buyer',                  mix: 'Buyer' },
    'rp.yourTurn':     { id: 'Giliranmu',              en: 'Your turn',              mix: 'Your turn' },
    'rp.waiting':      { id: 'Menunggu…',              en: 'Waiting…',               mix: 'Waiting…' },
    'rp.pass':         { id: 'Serahkan ke',            en: 'Pass to',                mix: 'Pass to' },

    'pz.title':        { id: 'Puzzle Alur Dokumen',    en: 'Document Flow Puzzle',   mix: 'Doc Flow Puzzle' },
    'pz.time':         { id: 'Waktu',                  en: 'Time',                   mix: 'Time' },
    'pz.score':        { id: 'Skor',                   en: 'Score',                  mix: 'Score' },
    'pz.hint':         { id: 'Petunjuk',               en: 'Hint',                   mix: 'Hint' },
    'pz.check':        { id: 'Validasi',               en: 'Validate',               mix: 'Validate' },
    'pz.bank':         { id: 'Kartu Tersedia',         en: 'Available Cards',        mix: 'Cards Left' },

    'det.title':       { id: 'Detektif Audit',         en: 'Audit Detective',        mix: 'Audit Detective' },
    'det.find':        { id: 'Temukan anomali',        en: 'Find the anomaly',       mix: 'Find anomaly' },
    'det.why':         { id: 'Kenapa ini salah?',      en: 'Why is this wrong?',     mix: 'Why wrong?' },
    'det.report':      { id: 'Laporan Akhir',          en: 'Final Report',           mix: 'Final Report' },
  };

  /* ---------- STATE ---------- */
  const state = {
    current: 'mix',       // 'id' | 'en' | 'mix'
    listeners: new Set(),
    fallbackLang: 'id',
  };

  /* ---------- FUNGSI INTI ---------- */

  function t(key, vars) {
    const entry = DICT[key];
    let text;

    if (!entry) {
      // Kembalikan key kalau tidak ditemukan (mudah debug)
      if (global.console && console.warn) console.warn('[i18n] missing key:', key);
      return key;
    }

    if (state.current === 'id' && entry.id) text = entry.id;
    else if (state.current === 'en' && entry.en) text = entry.en;
    else if (state.current === 'mix' && entry.mix) text = entry.mix;
    else text = entry[state.fallbackLang] || entry.id || entry.en || key;

    // Interpolasi {var}
    if (vars && typeof vars === 'object') {
      text = text.replace(/\{(\w+)\}/g, (m, k) =>
        Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m
      );
    }
    return text;
  }

  function set(lang) {
    if (!['id', 'en', 'mix'].includes(lang)) lang = 'mix';
    if (state.current === lang) return;
    state.current = lang;
    applyAll();
    emit();
  }

  function get() {
    return state.current;
  }

  /* ---------- RENDER OTOMATIS ---------- */
  // Elemen dengan data-i18n → textContent
  // Elemen dengan data-i18n-html → innerHTML (untuk <b>, <kbd>)
  // Elemen dengan data-i18n-attr → atribut (contoh: data-i18n-attr="placeholder:top.search")
  function apply(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const txt = t(key);
      if (el.textContent !== txt) el.textContent = txt;
    });

    scope.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      const html = t(key);
      if (el.innerHTML !== html) el.innerHTML = html;
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      if (!spec) return;
      // format: "attr:key, attr2:key2"
      spec.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });

    // Update <html lang>
    const htmlLang = state.current === 'en' ? 'en' : 'id';
    if (document.documentElement.getAttribute('lang') !== htmlLang) {
      document.documentElement.setAttribute('lang', htmlLang);
    }
  }

  function applyAll() {
    apply(document);
    // Tandai body
    document.documentElement.setAttribute('data-lang', state.current);
  }

  /* ---------- EVENT ---------- */
  function onChange(fn) {
    state.listeners.add(fn);
    return () => state.listeners.delete(fn);
  }
  function emit() {
    const payload = { lang: state.current };
    state.listeners.forEach(fn => {
      try { fn(payload); } catch (e) { console.error('[i18n] listener error', e); }
    });
    // Broadcast supaya modul lain bisa dengar
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: payload }));
  }

  /* ---------- EXPORT KE WINDOW ---------- */
  global.I18N = {
    t,
    set,
    get,
    apply,
    applyAll,
    onChange,
    dict: DICT,
    _state: state,
  };

})(window);