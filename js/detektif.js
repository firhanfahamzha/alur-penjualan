/* ============================================================
   DETEKTIF.JS — Audit Detective
   ============================================================
   Fitur:
   - 3 tingkat kesulitan (3/6/9 error)
   - Bendel dokumen realistik yang saling terkait
   - 15 template error: qty mismatch, harga beda, diskon hilang,
     tanggal mundur, nomor PO tidak konsisten, PPN salah, dsb.
   - Klik sel data yang janggal → MCQ "kenapa salah?"
   - Skor: +50 benar, −15 salah klik, −20 alasan salah
   - Laporan akhir edukatif per error
   - Badge detektif
   ============================================================ */

(function (global) {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ============================================================
     1. KONFIGURASI
     ============================================================ */
  const LEVELS = {
    easy:   { errorCount: 3, time: 300, label: { id: 'Pemula',  en: 'Easy',   mix: 'Easy' },   multiplier: 1.0 },
    medium: { errorCount: 6, time: 480, label: { id: 'Menengah', en: 'Medium', mix: 'Medium' }, multiplier: 1.5 },
    hard:   { errorCount: 9, time: 720, label: { id: 'Mahir',   en: 'Hard',   mix: 'Hard' },   multiplier: 2.2 },
  };

  /* ============================================================
     2. TEMPLATE ERROR (15 jenis)
     ============================================================
     Setiap error punya:
       - id
       - docKey & field  (untuk identifikasi sel)
       - apply(bundle)   (mutasi bundle)
       - correctReason
       - distractors [3]
       - explanation
     ============================================================ */
  const ERROR_TEMPLATES = [
    /* 1. Qty DO ≠ PO */
    {
      id: 'qty_do_ne_po',
      docKey: 'do', field: 'qty',
      apply: (b) => { b.do.qty = b.po.qty - 40; b.do.qtyRaw = b.po.qty - 40; },
      correctReason: { id: 'Qty Surat Jalan tidak sama dengan qty Purchase Order', en: 'Delivery Order qty differs from PO qty', mix: 'Qty DO ≠ qty PO' },
      distractors: [
        { id: 'Harga satuan salah', en: 'Wrong unit price', mix: 'Harga salah' },
        { id: 'Nomor dokumen salah format', en: 'Wrong document number format', mix: 'Format nomor salah' },
        { id: 'Tanggal pengiriman mundur', en: 'Backdated delivery date', mix: 'Tanggal mundur' },
      ],
      explanation: {
        id: 'Surat Jalan adalah bukti fisik barang keluar. Qty harus persis sama dengan PO. Kalau beda tanpa berita acara, ini anomali audit.',
        en: 'Delivery Order is proof of goods leaving. Qty must match PO exactly. Any diff without a discrepancy note is an audit anomaly.',
        mix: 'DO = bukti fisik barang keluar. Qty wajib sama PO. Beda tanpa berita acara = anomali.',
      },
    },

    /* 2. Harga Invoice ≠ PO */
    {
      id: 'price_inv_ne_po',
      docKey: 'invoice', field: 'unitPrice',
      apply: (b) => { b.invoice.unitPrice = b.po.unitPrice + 6500; b.invoice.unitPriceRaw = b.po.unitPrice + 6500; },
      correctReason: { id: 'Harga di Invoice berbeda dengan harga di PO', en: 'Invoice price differs from PO price', mix: 'Harga Invoice ≠ harga PO' },
      distractors: [
        { id: 'PPN tidak dihitung', en: 'VAT not calculated', mix: 'PPN tidak dihitung' },
        { id: 'Alamat pengiriman salah', en: 'Wrong shipping address', mix: 'Alamat kirim salah' },
        { id: 'Sales order tidak dikunci', en: 'Sales order not locked', mix: 'SO tidak dikunci' },
      ],
      explanation: {
        id: 'Invoice harus mengutip harga dari PO. Beda Rp 1 pun wajib ada Credit/Debit Note.',
        en: 'Invoice must quote the PO price. Even a Rp 1 diff needs a Credit/Debit Note.',
        mix: 'Invoice wajib kutip harga PO. Beda Rp 1 pun butuh CN/DN.',
      },
    },

    /* 3. Nomor PO tidak konsisten */
    {
      id: 'po_ref_mismatch',
      docKey: 'invoice', field: 'poRef',
      apply: (b) => { b.invoice.poRef = 'PO/KSG/2025/9999'; },
      correctReason: { id: 'Ref. PO di Invoice tidak cocok dengan PO asli', en: 'Invoice PO ref does not match the original PO', mix: 'Ref PO Invoice ≠ PO asli' },
      distractors: [
        { id: 'PPN salah persen', en: 'Wrong VAT rate', mix: 'PPN salah' },
        { id: 'Kurs mata uang tidak dicantumkan', en: 'Currency rate not stated', mix: 'Kurs tidak dicantumkan' },
        { id: 'Invoice tidak ada cap', en: 'Invoice has no stamp', mix: 'Invoice tanpa cap' },
      ],
      explanation: {
        id: 'Nomor PO adalah jangkar. Kalau invoice mengutip nomor berbeda, rekonsiliasi & penelusuran audit jadi kacau.',
        en: 'The PO number is the anchor. A different ref breaks reconciliation & audit traceability.',
        mix: 'Nomor PO itu jangkar. Ref beda = rekonsiliasi kacau.',
      },
    },

    /* 4. PPN salah persen */
    {
      id: 'ppn_wrong_rate',
      docKey: 'invoice', field: 'vatRate',
      apply: (b) => { b.invoice.vatRate = 0.10; },
      correctReason: { id: 'PPN di Invoice 10%, seharusnya 11% sesuai tarif yang berlaku', en: 'Invoice VAT is 10%, should be 11% under current rate', mix: 'PPN 10%, seharusnya 11%' },
      distractors: [
        { id: 'PPN dihitung dari total bukan DPP', en: 'VAT computed on total, not DPP', mix: 'PPN dari total bukan DPP' },
        { id: 'PPN dua kali dihitung', en: 'VAT double-counted', mix: 'PPN double' },
        { id: 'PPN tidak dipungut', en: 'VAT not collected', mix: 'PPN tidak dipungut' },
      ],
      explanation: {
        id: 'Per April 2022 tarif PPN Indonesia 11%. Tarif salah → SPT masa salah → sanksi pajak.',
        en: 'Since April 2022 Indonesia\'s VAT is 11%. Wrong rate → wrong return → tax penalty.',
        mix: 'Sejak April 2022 PPN Indonesia 11%. Salah rate → SPT salah → sanksi.',
      },
    },

    /* 5. Tanggal POD mundur dari DO */
    {
      id: 'pod_backdated',
      docKey: 'pod', field: 'date',
      apply: (b) => { b.pod.date = b.do.date; b.pod.dateRaw = b.do.dateRaw - 86400000; /* 1 hari sebelum DO */ },
      correctReason: { id: 'Tanggal POD lebih awal dari tanggal Surat Jalan (mustahil)', en: 'POD date is earlier than the Delivery Order date (impossible)', mix: 'POD mundur dari DO (mustahil)' },
      distractors: [
        { id: 'POD tidak ditandatangani', en: 'POD unsigned', mix: 'POD tidak ttd' },
        { id: 'POD tanpa cap perusahaan', en: 'POD missing company stamp', mix: 'POD tanpa cap' },
        { id: 'Nama penerima tidak jelas', en: 'Receiver name unclear', mix: 'Nama penerima tidak jelas' },
      ],
      explanation: {
        id: 'Barang tidak mungkin diterima sebelum dikirim. Tanggal mundur = tanda dokumen dibuat belakangan (backdated) untuk mengelabui periode.',
        en: 'Goods cannot be received before shipped. Backdated docs signal window-dressing.',
        mix: 'Barang nggak mungkin diterima sebelum dikirim. Tanggal mundur = backdated untuk mengelabui periode.',
      },
    },

    /* 6. Diskon nego tidak diterapkan */
    {
      id: 'discount_missing',
      docKey: 'invoice', field: 'discount',
      apply: (b) => { b.invoice.discount = 0; b._discountExpected = 0.05; },
      correctReason: { id: 'Diskon 5% hasil negosiasi tidak diterapkan di Invoice', en: '5% negotiated discount not applied to the Invoice', mix: 'Diskon 5% nego hilang di Invoice' },
      distractors: [
        { id: 'Diskon dihitung dua kali', en: 'Discount double-counted', mix: 'Diskon double' },
        { id: 'Diskon tanpa persetujuan', en: 'Discount without approval', mix: 'Diskon tanpa approval' },
        { id: 'Diskon di atas plafon', en: 'Discount exceeds cap', mix: 'Diskon di atas plafon' },
      ],
      explanation: {
        id: 'Setiap diskon harus dikutip dari kesepakatan tertulis (PO/kontrak/email resmi). Tidak diterapkan → pembeli merasa ditipu.',
        en: 'Every discount must trace to written agreement. Missing application = buyer feels cheated.',
        mix: 'Diskon wajib kutip kesepakatan tertulis. Kalau hilang = pembeli merasa dicurangi.',
      },
    },

    /* 7. DO tanpa ref PO */
    {
      id: 'do_missing_po_ref',
      docKey: 'do', field: 'poRef',
      apply: (b) => { b.do.poRef = '—'; },
      correctReason: { id: 'Surat Jalan tidak mencantumkan nomor PO', en: 'Delivery Order missing PO reference', mix: 'DO tanpa ref PO' },
      distractors: [
        { id: 'DO tidak ada nomor', en: 'DO has no number', mix: 'DO tanpa nomor' },
        { id: 'DO ditandatangani gudang', en: 'DO signed by warehouse', mix: 'DO ditandatangani gudang' },
        { id: 'DO tidak menyebut driver', en: 'DO missing driver name', mix: 'DO tanpa driver' },
      ],
      explanation: {
        id: 'Tanpa ref PO, DO tidak bisa ditelusuri ke pesanan. Ini melemahkan audit trail dan menyulitkan matching.',
        en: 'Without a PO ref, DO cannot be traced to the order. Weakens audit trail & matching.',
        mix: 'Tanpa ref PO, DO nggak bisa ditelusuri. Audit trail lemah, matching susah.',
      },
    },

    /* 8. Remittance ≠ Invoice total */
    {
      id: 'remittance_mismatch',
      docKey: 'remittance', field: 'amount',
      apply: (b) => { b.remittance.amount = b.invoice.total - 1200000; },
      correctReason: { id: 'Jumlah transfer Remittance tidak sama dengan total Invoice', en: 'Remittance transfer amount differs from Invoice total', mix: 'Remittance ≠ total Invoice' },
      distractors: [
        { id: 'Remittance tanpa nomor invoice', en: 'Remittance missing invoice number', mix: 'Remittance tanpa no. invoice' },
        { id: 'Bank pengirim berbeda', en: 'Different remitting bank', mix: 'Bank pengirim beda' },
        { id: 'Tanggal transfer setelah jatuh tempo', en: 'Transfer date after due date', mix: 'Transfer setelah jatuh tempo' },
      ],
      explanation: {
        id: 'Ketidakcocokan sisa Rp 1 pun harus dijelaskan. Umumnya karena potongan biaya transfer atau retur yang belum dicatat.',
        en: 'Even Rp 1 mismatch must be explained — usually bank fees or unrecorded returns.',
        mix: 'Selisih Rp 1 pun wajib dijelaskan. Biasanya biaya transfer / retur belum dicatat.',
      },
    },

    /* 9. Rekening bank berbeda */
    {
      id: 'bank_account_mismatch',
      docKey: 'remittance', field: 'bankAccount',
      apply: (b) => { b.remittance.bankAccount = 'BCA — 9999-8888'; b._expectedBank = 'Bank Mandiri — 122-00-5566-7788'; },
      correctReason: { id: 'Rekening bank tujuan berbeda dengan yang di kontrak', en: 'Bank account differs from the one in the contract', mix: 'Rekening tujuan ≠ kontrak' },
      distractors: [
        { id: 'Nama bank disingkat', en: 'Bank name abbreviated', mix: 'Nama bank disingkat' },
        { id: 'Swift code tidak dicantumkan', en: 'Missing SWIFT code', mix: 'SWIFT tidak ada' },
        { id: 'Rekening atas nama pihak ketiga', en: 'Account under third party', mix: 'Rekening pihak ketiga' },
      ],
      explanation: {
        id: 'Perubahan rekening = risiko fraud klasik. Wajib ada konfirmasi resmi via telepon/verifikasi.',
        en: 'Changed bank account = classic fraud risk. Requires formal confirmation.',
        mix: 'Ganti rekening = risiko fraud klasik. Wajib konfirmasi resmi.',
      },
    },

    /* 10. Subtotal ≠ qty × harga */
    {
      id: 'subtotal_math_error',
      docKey: 'invoice', field: 'subtotal',
      apply: (b) => { b.invoice.subtotal = b.invoice.qty * b.invoice.unitPrice - 500000; },
      correctReason: { id: 'Subtotal tidak sama dengan qty × harga satuan (salah hitung)', en: 'Subtotal ≠ qty × unit price (math error)', mix: 'Subtotal ≠ qty × harga' },
      distractors: [
        { id: 'PPN salah hitung', en: 'VAT miscalculated', mix: 'PPN salah' },
        { id: 'Pembulatan terlalu besar', en: 'Rounding too aggressive', mix: 'Pembulatan terlalu besar' },
        { id: 'Diskon ganda', en: 'Discount applied twice', mix: 'Diskon dobel' },
      ],
      explanation: {
        id: 'Subtotal = qty × harga. Selisih di sini tidak wajar — bukan pembulatan, ini salah input atau salah rumus.',
        en: 'Subtotal = qty × price. Diff here is not rounding — it\'s an input or formula error.',
        mix: 'Subtotal = qty × harga. Selisih di sini bukan pembulatan — salah input / rumus.',
      },
    },

    /* 11. Credit Note > Invoice */
    {
      id: 'credit_note_exceeds',
      docKey: 'creditNote', field: 'amount',
      apply: (b) => { b.creditNote.amount = b.invoice.total + 3000000; },
      correctReason: { id: 'Nilai Credit Note melebihi nilai Invoice yang dikoreksi', en: 'Credit Note amount exceeds the Invoice it corrects', mix: 'CN > Invoice yang dikoreksi' },
      distractors: [
        { id: 'CN tanpa ref invoice', en: 'CN missing invoice ref', mix: 'CN tanpa ref invoice' },
        { id: 'CN tanpa RMA', en: 'CN missing RMA', mix: 'CN tanpa RMA' },
        { id: 'CN dengan tanggal mundur', en: 'CN backdated', mix: 'CN mundur' },
      ],
      explanation: {
        id: 'Credit Note hanya boleh mengurangi, bukan melebihi. Kalau melebihi → itu bukan retur, itu transaksi baru / potensi fraud.',
        en: 'A Credit Note can only reduce, not exceed. Exceeding = it\'s a new transaction / fraud risk.',
        mix: 'CN hanya mengurangi, bukan melebihi. Kalau lebih = transaksi baru / fraud.',
      },
    },

    /* 12. Quotation kadaluarsa */
    {
      id: 'quotation_expired',
      docKey: 'po', field: 'quotationRef',
      apply: (b) => { b._quotationValidityDays = 14; b._poDelayDays = 22; },
      correctReason: { id: 'PO merujuk Quotation yang sudah kadaluarsa (masa berlaku 14 hari, PO datang setelah 22 hari)', en: 'PO references an expired Quotation (14-day validity, PO arrived after 22 days)', mix: 'PO merujuk Quotation kadaluarsa' },
      distractors: [
        { id: 'Quotation tidak ditandatangani', en: 'Quotation unsigned', mix: 'Quotation tanpa ttd' },
        { id: 'Nomor Quotation salah format', en: 'Quotation number format wrong', mix: 'Nomor Quotation salah format' },
        { id: 'Quotation tanpa PPN', en: 'Quotation without VAT', mix: 'Quotation tanpa PPN' },
      ],
      explanation: {
        id: 'Kalau PO datang setelah masa berlaku Quotation, harga harus dikonfirmasi ulang. Kalau tidak, seller bisa menolak order.',
        en: 'If PO arrives after the quotation validity, price must be reconfirmed. Otherwise the seller may reject the order.',
        mix: 'PO setelah masa berlaku Quotation → harga wajib konfirmasi ulang. Kalau nggak, seller bisa tolak.',
      },
    },

    /* 13. Warehouse SO ≠ DO */
    {
      id: 'warehouse_mismatch',
      docKey: 'do', field: 'warehouse',
      apply: (b) => { b.do.warehouse = 'WH-Jakarta-03'; b._soWarehouse = 'WH-Takengon-01'; },
      correctReason: { id: 'Gudang asal di DO berbeda dengan yang terkunci di Sales Order', en: 'Origin warehouse in DO differs from the one locked in Sales Order', mix: 'Gudang DO ≠ gudang SO' },
      distractors: [
        { id: 'Alamat tujuan salah', en: 'Wrong destination address', mix: 'Alamat tujuan salah' },
        { id: 'Kode gudang salah format', en: 'Warehouse code wrong format', mix: 'Kode gudang salah format' },
        { id: 'Gudang tidak disebutkan', en: 'Warehouse not stated', mix: 'Gudang tidak disebut' },
      ],
      explanation: {
        id: 'SO mengunci stok dari gudang tertentu. Kalau DO ambil dari gudang lain, bisa jadi stok over-commit atau dipindah tanpa catat.',
        en: 'SO locks stock from a specific warehouse. A different DO origin may indicate over-commit or unrecorded transfer.',
        mix: 'SO kunci stok dari gudang tertentu. DO dari gudang lain = over-commit / pindah tanpa catat.',
      },
    },

    /* 14. Invoice tanggal sebelum POD */
    {
      id: 'invoice_before_pod',
      docKey: 'invoice', field: 'date',
      apply: (b) => { b.invoice.dateRaw = b.pod.dateRaw - 5 * 86400000; b.invoice.date = formatDate(new Date(b.pod.dateRaw - 5 * 86400000)); },
      correctReason: { id: 'Tanggal Invoice lebih awal dari tanggal POD (barang belum diterima tapi sudah ditagih)', en: 'Invoice date is earlier than POD (billed before goods received)', mix: 'Invoice mundur dari POD' },
      distractors: [
        { id: 'Invoice belum ada tanda tangan', en: 'Invoice unsigned', mix: 'Invoice tanpa ttd' },
        { id: 'Invoice tanpa e-Faktur', en: 'Invoice missing e-Faktur', mix: 'Invoice tanpa e-Faktur' },
        { id: 'Invoice tanpa stempel', en: 'Invoice missing stamp', mix: 'Invoice tanpa cap' },
      ],
      explanation: {
        id: 'Penagihan ideal setelah POD. Kalau invoice mundur dari POD, ini tanda pengakuan pendapatan terlalu cepat (revenue recognition issue).',
        en: 'Ideal invoicing follows POD. Backdating before POD = premature revenue recognition.',
        mix: 'Penagihan ideal setelah POD. Invoice mundur = revenue recognition terlalu cepat.',
      },
    },

    /* 15. Jatuh tempo sudah lewat */
    {
      id: 'due_date_past',
      docKey: 'invoice', field: 'dueDate',
      apply: (b) => { const d = new Date(); d.setDate(d.getDate() - 10); b.invoice.dueDate = formatDate(d); },
      correctReason: { id: 'Jatuh tempo Invoice sudah lewat saat diterima klien', en: 'Invoice due date already passed on delivery', mix: 'Jatuh tempo Invoice sudah lewat' },
      distractors: [
        { id: 'Jatuh tempo tanpa tanggal', en: 'Due date missing', mix: 'Jatuh tempo kosong' },
        { id: 'Jatuh tempo dihitung dari PO bukan Invoice', en: 'Due date counted from PO not Invoice', mix: 'Jatuh tempo dari PO, bukan Invoice' },
        { id: 'Jatuh tempo sama dengan tanggal kirim', en: 'Due date equals shipping date', mix: 'Due date = tgl kirim' },
      ],
      explanation: {
        id: 'Jatuh tempo lahir dari tanggal Invoice + NET terms. Kalau mundur, klien tidak punya waktu membayar sesuai kontrak → jadi piutang macet.',
        en: 'Due date = Invoice date + NET terms. A past due date leaves no time → stalled receivable.',
        mix: 'Due date = tgl Invoice + NET. Kalau mundur, klien nggak punya waktu bayar → piutang macet.',
      },
    },
  ];

  /* ============================================================
     3. STATE RUNTIME
     ============================================================ */
  const state = {
    active: false,
    level: 'easy',
    bundle: null,
    foundErrors: new Set(),     // error.id yang sudah ditemukan
    foundWithWrongReason: new Set(),
    wrongClicks: 0,
    timer: 0,
    timerInterval: null,
    startedAt: null,
    finishedAt: null,
    highlightedCells: new Set(),  // cell key (docKey::field) yang sudah diklik & benar
  };

  /* ============================================================
     4. UTIL
     ============================================================ */
  const t = (obj) => {
    if (!obj) return '';
    const lang = (global.I18N && I18N.get && I18N.get()) || 'mix';
    return obj[lang] || obj.mix || obj.id || obj.en || '';
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
  const fmtIDR = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };
  const formatDate = (d) => {
    const dd = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dd.getTime())) return String(d);
    return dd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ============================================================
     5. GENERATOR BUNDLE
     ============================================================ */
  function buildBundle(level) {
    const cfg = LEVELS[level];
    const year = new Date().getFullYear();

    // Tanggal dasar (mundur dari hari ini biar ada konteks real-time)
    const today = new Date();
    const d = (offset) => {
      const dd = new Date(today);
      dd.setDate(dd.getDate() + offset);
      return dd;
    };

    // Dokumen (nilai dasar yang konsisten dulu)
    const qty = 500;
    const unitPrice = 278500;
    const discountRate = 0.05; // nego diskon
    const effectivePrice = Math.round(unitPrice * (1 - discountRate));
    const subtotal = qty * effectivePrice;
    const vatRate = 0.11;
    const vat = Math.round(subtotal * vatRate);
    const total = subtotal + vat;
    const dpRate = 0.3;
    const dp = Math.round(total * dpRate);

    const poNumber = `PO/KSG/${year}/0231`;
    const quotationNumber = `QUO/FFG/${year}/0231`;
    const doNumber = `DO/FFG/${year}/0231`;
    const invoiceNumber = `INV/FFG/${year}/0231`;

    const dates = {
      rfq: d(-25),
      quotation: d(-22),
      po: d(-18),
      so: d(-17),
      picking: d(-10),
      do: d(-9),
      pod: d(-5),
      invoice: d(-4),
      remittance: d(0),
    };

    // Dokumen builder
    const bundle = {
      _raw: { qty, unitPrice, effectivePrice, discountRate, subtotal, vat, vatRate, total, dp, dpRate },
      _numbers: { poNumber, quotationNumber, doNumber, invoiceNumber },
      errors: [],

      rfq: {
        key: 'rfq', icon: '📄', num: `RFQ/KSG/${year}/0147`, date: formatDate(dates.rfq),
        title: 'RFQ dari Pembeli',
        rows: [
          { field: 'qty',     label: 'Volume',       value: qty + ' kg' },
          { field: 'targetPrice', label: 'Target Harga', value: fmtIDR(260000) + ' / kg' },
          { field: 'deadline',label: 'Batas Penawaran', value: formatDate(d(-15)) },
          { field: 'notes',   label: 'Catatan',      value: 'Mohon sertakan COO & hasil uji lab' },
        ],
      },

      quotation: {
        key: 'quotation', icon: '📑', num: quotationNumber, date: formatDate(dates.quotation),
        title: 'Quotation / Penawaran',
        rows: [
          { field: 'qty',       label: 'Qty',          value: qty + ' kg' },
          { field: 'unitPrice', label: 'Harga Satuan', value: fmtIDR(unitPrice) + ' / kg' },
          { field: 'discount',  label: 'Diskon',       value: (discountRate * 100) + '%' },
          { field: 'subtotal',  label: 'Subtotal',     value: fmtIDR(subtotal) },
          { field: 'vat',       label: 'PPN 11%',      value: fmtIDR(vat) },
          { field: 'total',     label: 'Grand Total',  value: fmtIDR(total) },
          { field: 'validity',  label: 'Berlaku',      value: '14 hari' },
        ],
      },

      po: {
        key: 'po', icon: '📥', num: poNumber, date: formatDate(dates.po),
        title: 'Purchase Order (PO)',
        rows: [
          { field: 'quotationRef', label: 'Ref. Quotation', value: quotationNumber },
          { field: 'qty',          label: 'Qty',            value: qty + ' kg' },
          { field: 'unitPrice',    label: 'Harga Sepakat',  value: fmtIDR(effectivePrice) + ' / kg' },
          { field: 'discount',     label: 'Diskon Nego',    value: (discountRate * 100) + '%' },
          { field: 'subtotal',     label: 'Subtotal',       value: fmtIDR(subtotal) },
          { field: 'vat',          label: 'PPN 11%',        value: fmtIDR(vat) },
          { field: 'total',        label: 'Total',          value: fmtIDR(total) },
          { field: 'dp',           label: 'DP 30%',         value: fmtIDR(dp) },
        ],
      },

      so: {
        key: 'so', icon: '🔄', num: `SO/FFG/${year}/0188`, date: formatDate(dates.so),
        title: 'Sales Order (Internal)',
        rows: [
          { field: 'poRef',     label: 'Ref. PO',      value: poNumber },
          { field: 'warehouse', label: 'Gudang Asal',  value: 'WH-Takengon-01' },
          { field: 'qty',       label: 'Qty Locked',   value: qty + ' kg' },
          { field: 'picking',   label: 'Picking Date', value: formatDate(dates.picking) },
        ],
      },

      picking: {
        key: 'picking', icon: '📋', num: `PCK/WH-TAK/${year}/0891`, date: formatDate(dates.picking),
        title: 'Picking List',
        rows: [
          { field: 'soRef',  label: 'Ref. SO',  value: `SO/FFG/${year}/0188` },
          { field: 'qty',    label: 'Qty Target', value: qty + ' kg (9 karung × 60 kg)' },
          { field: 'picked', label: 'Qty Ambil', value: qty + ' kg — lengkap ✅' },
        ],
      },

      do: {
        key: 'do', icon: '🚛', num: doNumber, date: formatDate(dates.do),
        title: 'Delivery Order / Surat Jalan',
        rows: [
          { field: 'poRef',     label: 'Ref. PO',   value: poNumber },
          { field: 'qty',       label: 'Qty',       value: qty + ' kg', qtyRaw: qty },
          { field: 'warehouse', label: 'Gudang',    value: 'WH-Takengon-01' },
          { field: 'driver',    label: 'Driver',    value: 'Sugeng Riyadi' },
          { field: 'vehicle',   label: 'Kendaraan', value: 'B 9123 XYZ' },
          { field: 'eta',       label: 'ETA',       value: formatDate(dates.pod) },
        ],
      },

      pod: {
        key: 'pod', icon: '✅', num: `POD/FFG/${year}/0231`, date: formatDate(dates.pod),
        title: 'Proof of Delivery (POD)',
        rows: [
          { field: 'doRef',     label: 'Ref. DO',   value: doNumber },
          { field: 'date',      label: 'Waktu Terima', value: formatDate(dates.pod), dateRaw: dates.pod.getTime() },
          { field: 'receivedBy',label: 'Diterima Oleh', value: 'Rizky Hidayat' },
          { field: 'qty',       label: 'Qty Terima', value: qty + ' kg ✅' },
          { field: 'condition', label: 'Kondisi',   value: 'Baik — 9 karung utuh' },
        ],
      },

      invoice: {
        key: 'invoice', icon: '📄', num: invoiceNumber, date: formatDate(dates.invoice),
        title: 'Invoice / Faktur Penjualan',
        rows: [
          { field: 'poRef',     label: 'Ref. PO',      value: poNumber },
          { field: 'qty',       label: 'Qty',          value: qty + ' kg' },
          { field: 'unitPrice', label: 'Harga',        value: fmtIDR(effectivePrice) + ' / kg', unitPriceRaw: effectivePrice },
          { field: 'discount',  label: 'Diskon',       value: (discountRate * 100) + '%' },
          { field: 'subtotal',  label: 'Subtotal',     value: fmtIDR(subtotal) },
          { field: 'vatRate',   label: 'PPN',          value: (vatRate * 100) + '%', vatRateRaw: vatRate },
          { field: 'vat',       label: 'Nilai PPN',    value: fmtIDR(vat) },
          { field: 'dp',        label: 'Dikurangi DP', value: '− ' + fmtIDR(dp) },
          { field: 'total',     label: 'Total Tagihan',value: fmtIDR(total - dp + vat), dueDateRaw: null, dateRaw: dates.invoice.getTime() },
          { field: 'dueDate',   label: 'Jatuh Tempo',  value: formatDate(d(-4 + 30)) },
        ],
      },

      remittance: {
        key: 'remittance', icon: '✉️', num: `RM/KSG/${year}/0412`, date: formatDate(dates.remittance),
        title: 'Remittance Advice',
        rows: [
          { field: 'invoiceRef',  label: 'Invoice Dibayar', value: invoiceNumber },
          { field: 'amount',      label: 'Jumlah Transfer', value: fmtIDR(total - dp + vat) },
          { field: 'bank',        label: 'Bank Pengirim',   value: 'BCA' },
          { field: 'bankAccount', label: 'Rekening Tujuan', value: 'Bank Mandiri — 122-00-5566-7788' },
          { field: 'ref',         label: 'Berita Transfer', value: invoiceNumber },
        ],
      },

      creditNote: {
        key: 'creditNote', icon: '📝', num: `CN/FFG/${year}/0057`, date: formatDate(d(-2)),
        title: 'Credit Note (Retur)',
        rows: [
          { field: 'invoiceRef', label: 'Ref. Invoice', value: invoiceNumber },
          { field: 'rmaRef',     label: 'Ref. RMA',     value: `RMA/FFG/${year}/0019` },
          { field: 'reason',     label: 'Alasan',       value: 'Retur 60 kg — kualitas' },
          { field: 'amount',     label: 'Nilai CN',     value: fmtIDR(Math.round(60 * effectivePrice)) },
        ],
      },
    };

    // Konteks internal untuk error
    bundle._soWarehouse = 'WH-Takengon-01';
    bundle._expectedBank = 'Bank Mandiri — 122-00-5566-7788';
    bundle._discountExpected = discountRate;
    bundle._quotationValidityDays = 14;
    bundle._poDelayDays = 22; // PO 22 hari setelah quotation → kadaluarsa

    // Pilih error secara acak sesuai level
    const pool = ERROR_TEMPLATES.slice();
    const shuffledPool = shuffle(pool);
    const chosen = shuffledPool.slice(0, cfg.errorCount);

    chosen.forEach((tpl, idx) => {
      // Terapkan error
      try { tpl.apply(bundle); } catch (_) {}

      bundle.errors.push({
        id: tpl.id,
        index: idx,
        docKey: tpl.docKey,
        field: tpl.field,
        correctReason: tpl.correctReason,
        distractors: tpl.distractors,
        explanation: tpl.explanation,
        cellKey: tpl.docKey + '::' + tpl.field,
      });
    });

    // Pastikan nilai-nilai setelah mutation tampil dengan format benar
    // (khusus tanggal & angka, regenerasi labelnya)
    normalizeBundleDisplay(bundle);

    return bundle;
  }

  function normalizeBundleDisplay(bundle) {
    // Update tampilan nilai berdasarkan raw value jika ada
    const fixRow = (doc, field, fn) => {
      const r = doc.rows.find(x => x.field === field);
      if (r) r.value = fn(r, doc);
    };

    // DO qty
    fixRow(bundle.do, 'qty', (r) => r.qtyRaw != null ? (r.qtyRaw + ' kg') : r.value);

    // Invoice unit price
    fixRow(bundle.invoice, 'unitPrice', (r) =>
      r.unitPriceRaw != null ? (fmtIDR(r.unitPriceRaw) + ' / kg') : r.value);

    // Invoice VAT
    fixRow(bundle.invoice, 'vatRate', (r) =>
      r.vatRateRaw != null ? (Math.round(r.vatRateRaw * 100) + '%') : r.value);

    // Invoice date
    fixRow(bundle.invoice, 'date', (r) =>
      r.dateRaw != null ? formatDate(new Date(r.dateRaw)) : r.value);

    // POD date
    fixRow(bundle.pod, 'date', (r) =>
      r.dateRaw != null ? formatDate(new Date(r.dateRaw)) : r.value);

    // Invoice subtotal — recompute jika error subtotal ada
    const subtotalErr = bundle.errors.find(e => e.id === 'subtotal_math_error');
    if (subtotalErr) {
      const q = bundle._raw.qty;
      const p = bundle.invoice.rows.find(r => r.field === 'unitPrice').unitPriceRaw;
      fixRow(bundle.invoice, 'subtotal', () => fmtIDR(q * p - 500000));
    }

    // Remittance amount
    const remErr = bundle.errors.find(e => e.id === 'remittance_mismatch');
    if (remErr) {
      fixRow(bundle.remittance, 'amount', (r, d) => {
        const invTotalRow = bundle.invoice.rows.find(x => x.field === 'total');
        const base = bundle._raw.total - bundle._raw.dp + bundle._raw.vat;
        return fmtIDR(base - 1200000);
      });
    }

    // Credit Note amount
    const cnErr = bundle.errors.find(e => e.id === 'credit_note_exceeds');
    if (cnErr) {
      const base = bundle._raw.total - bundle._raw.dp + bundle._raw.vat;
      fixRow(bundle.creditNote, 'amount', () => fmtIDR(base + 3000000));
    }

    // PO quotationRef → kosong (expired)
    const expErr = bundle.errors.find(e => e.id === 'quotation_expired');
    if (expErr) {
      // Tambah catatan visual di quotation: "berlaku s.d. X" yang sudah lewat
      const validityRow = bundle.quotation.rows.find(r => r.field === 'validity');
      if (validityRow) {
        validityRow.value = '14 hari — berakhir ' + formatDate(new Date(Date.now() - 21 * 86400000));
      }
    }

    // Bank account
    const bankErr = bundle.errors.find(e => e.id === 'bank_account_mismatch');
    if (bankErr) {
      fixRow(bundle.remittance, 'bankAccount', () => 'BCA — 9999-8888');
    }
  }

  /* ============================================================
     6. RENDER ROOT
     ============================================================ */
  function render() {
    const mount = document.getElementById('detektifMount');
    if (!mount) return;

    if (!state.active) {
      mount.innerHTML = renderLevelChooser();
      bindLevelChooser();
    } else {
      mount.innerHTML = renderBoard();
      bindBoard();
    }
  }

  /* ============================================================
     7. LEVEL CHOOSER
     ============================================================ */
  function renderLevelChooser() {
    const best = (global.Store && Store.get('detektif.bestLevel')) || null;
    const bestScore = (global.Store && Store.get('detektif.score')) || 0;

    const cards = ['easy', 'medium', 'hard'].map(lvl => {
      const cfg = LEVELS[lvl];
      const icon = lvl === 'easy' ? '🔍' : lvl === 'medium' ? '🔎' : '🎯';
      const colour = lvl === 'easy' ? 'green' : lvl === 'medium' ? 'amber' : 'red';
      return (
        '<div class="det-level-card det-level-card--' + lvl + '" data-level="' + lvl + '">' +
          '<div class="det-level-card__icon">' + icon + '</div>' +
          '<div class="det-level-card__title">' + esc(t(cfg.label)) + '</div>' +
          '<div class="det-level-card__sub">' + cfg.errorCount + ' ' + t({ id: 'error tersembunyi', en: 'hidden errors', mix: 'error tersembunyi' }) + '</div>' +
          '<ul class="det-level-card__features">' +
            '<li>⏱️ ' + Math.floor(cfg.time / 60) + ' ' + t({ id: 'menit', en: 'min', mix: 'menit' }) + '</li>' +
            '<li>🎯 ' + t({ id: 'Skor × ' + cfg.multiplier, en: 'Score × ' + cfg.multiplier, mix: 'Skor × ' + cfg.multiplier }) + '</li>' +
            '<li>' + (lvl === 'hard' ? '📚 Semua jenis error' : '📘 ' + cfg.errorCount + ' jenis error') + '</li>' +
          '</ul>' +
          '<button class="btn btn--' + colour + ' btn--block">' + t({ id: 'Mulai', en: 'Start', mix: 'Start' }) + '</button>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="det-intro mb-5">' +
        '<div class="card card--flat" style="background:linear-gradient(135deg,var(--violet-soft),var(--primary-soft))">' +
          '<div class="card__body" style="display:flex;gap:var(--s-5);flex-wrap:wrap;align-items:flex-start">' +
            '<div style="font-size:48px;line-height:1">🕵️</div>' +
            '<div style="flex:1;min-width:260px">' +
              '<div style="font-size:18px;font-weight:800;margin-bottom:6px">' + t({ id: 'Jadi Auditor Internal', en: 'Become an Internal Auditor', mix: 'Jadi Auditor Internal' }) + '</div>' +
              '<p style="font-size:13.5px;line-height:1.65;color:var(--text-2);margin:0 0 12px">' +
                t({
                  id: 'Kamu menerima bendel dokumen penjualan lengkap. Beberapa data sengaja dibuat tidak konsisten. Klik sel data yang janggal, lalu pilih alasan cross-check-mu. Kalau salah klik, skor berkurang.',
                  en: 'You receive a full sales document bundle. Some data is intentionally inconsistent. Click any suspicious cell, then pick your cross-check reason. Wrong click = score penalty.',
                  mix: 'Kamu terima bendel dokumen penjualan. Beberapa data sengaja tidak konsisten. Klik sel yang janggal, pilih alasan cross-check. Salah klik = skor berkurang.'
                }) +
              '</p>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
                '<span class="chip">📄 9 dokumen</span>' +
                '<span class="chip">🔍 3–9 error per ronde</span>' +
                '<span class="chip">❓ Pilih alasan cross-check</span>' +
                '<span class="chip">📊 Laporan edukatif</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        (best || bestScore > 0
          ? '<div class="callout callout--ok mt-5"><div class="callout__icon">🏅</div><div class="callout__body"><b>' + t({ id: 'Rekor kamu', en: 'Your best', mix: 'Rekor kamu' }) + '</b><p>' + (best ? t(LEVELS[best].label) + ' · ' : '') + bestScore + ' ' + t({ id: 'poin', en: 'points', mix: 'poin' }) + '</p></div></div>'
          : '') +

        '<div class="det-level-grid mt-5">' + cards + '</div>' +
      '</div>' +

      '<style>' +
      '.det-level-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--s-4)}' +
      '.det-level-card{padding:var(--s-5);border:1.5px solid var(--border);border-radius:var(--r-lg);background:var(--surface);display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:all .25s}' +
      '.det-level-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-3)}' +
      '.det-level-card--easy:hover{border-color:var(--green)}' +
      '.det-level-card--medium:hover{border-color:var(--amber)}' +
      '.det-level-card--hard:hover{border-color:var(--red)}' +
      '.det-level-card__icon{font-size:38px;line-height:1}' +
      '.det-level-card__title{font-size:17px;font-weight:800;color:var(--text)}' +
      '.det-level-card__sub{font-size:12px;color:var(--text-3);margin-bottom:6px}' +
      '.det-level-card__features{list-style:none;padding:0;margin:6px 0;display:flex;flex-direction:column;gap:5px}' +
      '.det-level-card__features li{font-size:12.5px;color:var(--text-2);padding:2px 0}' +
      '</style>'
    );
  }

  function bindLevelChooser() {
    $$('[data-level]').forEach(el => {
      el.addEventListener('click', () => startGame(el.dataset.level));
    });
  }

  /* ============================================================
     8. START GAME
     ============================================================ */
  function startGame(level) {
    if (!LEVELS[level]) level = 'easy';
    state.active = true;
    state.level = level;
    state.bundle = buildBundle(level);
    state.foundErrors = new Set();
    state.foundWithWrongReason = new Set();
    state.wrongClicks = 0;
    state.timer = 0;
    state.startedAt = Date.now();
    state.finishedAt = null;
    state.highlightedCells = new Set();

    if (global.Store) {
      Store.set('detektif.active', true);
      Store.set('detektif.difficulty', level);
      Store.set('detektif.startedAt', Date.now());
      Store.markVisited('detektif');
    }

    startTimer();
    render();

    if (global.App) {
      App.toast('warn', '🕵️ ' + t({ id: 'Ronde baru', en: 'New round', mix: 'Ronde baru' }),
        t({ id: 'Ada ' + LEVELS[level].errorCount + ' error tersembunyi. Temukan semua!', en: 'There are ' + LEVELS[level].errorCount + ' hidden errors. Find them all!', mix: 'Ada ' + LEVELS[level].errorCount + ' error tersembunyi.' }));
    }
  }

  /* ============================================================
     9. TIMER
     ============================================================ */
  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      state.timer += 1;
      const cfg = LEVELS[state.level];
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
    const el = document.getElementById('detTimer');
    if (!el) return;
    const remaining = Math.max(0, LEVELS[state.level].time - state.timer);
    el.textContent = fmtTime(remaining);
    el.classList.toggle('is-warn', remaining <= 60 && remaining > 20);
    el.classList.toggle('is-danger', remaining <= 20);
  }

  function timeUp() {
    if (global.App) App.toast('bad', t({ id: 'Waktu habis!', en: 'Time up!', mix: 'Waktu habis!' }), '');
    finishGame(true);
  }

  /* ============================================================
     10. RENDER BOARD
     ============================================================ */
  function renderBoard() {
    const b = state.bundle;
    const cfg = LEVELS[state.level];
    const found = state.foundErrors.size;
    const total = b.errors.length;

    return (
      '<div class="pz-hud mb-4">' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">⏱️ Time</span>' +
          '<span class="pz-hud__val" id="detTimer">--:--</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">🎯 Level</span>' +
          '<span class="pz-hud__val">' + esc(t(cfg.label)) + '</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">🔍 Found</span>' +
          '<span class="pz-hud__val" id="detFound">' + found + ' / ' + total + '</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">❌ Salah Klik</span>' +
          '<span class="pz-hud__val" id="detWrong">' + state.wrongClicks + '</span>' +
        '</div>' +
        '<div class="pz-hud__spacer"></div>' +
        '<button class="btn btn--sm btn--ghost" id="btnDetRestart">🔄 ' + t({ id: 'Ulang', en: 'Restart', mix: 'Restart' }) + '</button>' +
        '<button class="btn btn--sm btn--danger" id="btnDetExit">✕ ' + t({ id: 'Keluar', en: 'Exit', mix: 'Exit' }) + '</button>' +
      '</div>' +

      '<div class="callout callout--info mb-5">' +
        '<div class="callout__icon">💡</div>' +
        '<div class="callout__body">' +
          '<b>' + t({ id: 'Cara main', en: 'How to play', mix: 'Cara main' }) + '</b>' +
          '<p>' + t({ id: 'Klik nilai (kolom kanan) yang menurutmu janggal. Setelah itu pilih alasan cross-check-nya. Kalau benar → dapat poin. Kalau salah klik kolom yang valid → kena penalti.', en: 'Click the value (right column) you think is off. Then pick your cross-check reason. Correct → points. Wrong click on valid data → penalty.', mix: 'Klik nilai (kanan) yang janggal, lalu pilih alasan cross-check. Benar → poin, salah → penalti.' }) + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="det-board" id="detBoard">' +
        renderBundle(b) +
      '</div>' +

      '<style>' +
      '.det-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:var(--s-5)}' +
      '@media(max-width:600px){.det-board{grid-template-columns:1fr}}' +
      '.det-doc{padding:var(--s-4);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow-1);animation:fadeUp .4s ease both}' +
      '.det-doc__head{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:10px}' +
      '.det-doc__icon{font-size:22px}' +
      '.det-doc__title{font-size:13.5px;font-weight:800;color:var(--text);flex:1;min-width:0}' +
      '.det-doc__num{font-family:var(--ff-mono);font-size:11px;color:var(--primary-2);background:var(--primary-soft);padding:2px 8px;border-radius:4px;font-weight:700}' +
      '.det-doc__date{font-size:11px;color:var(--text-3);margin-top:2px}' +
      '.det-row{display:grid;grid-template-columns:1fr 1.2fr;gap:10px;padding:8px 0;border-bottom:1px dotted var(--border);align-items:center;font-size:12.5px}' +
      '.det-row:last-child{border-bottom:0}' +
      '.det-row__label{color:var(--text-3);font-weight:600}' +
      '.det-row__value{color:var(--text);font-weight:700;cursor:pointer;padding:4px 8px;border-radius:6px;background:var(--surface-2);transition:all .15s;font-family:var(--ff-mono);word-break:break-word;text-align:right;border:1.5px solid transparent}' +
      '.det-row__value:hover{background:var(--primary-soft);border-color:var(--primary);transform:translateX(-2px)}' +
      '.det-row__value.is-found{background:var(--green-soft);border-color:var(--green);color:var(--green);cursor:default}' +
      '.det-row__value.is-found::after{content:" ✓";font-weight:900}' +
      '.det-row__value.is-found-wrong{background:var(--amber-soft);border-color:var(--amber);color:var(--amber)}' +
      '.det-row__value.is-found-wrong::after{content:" ⚠";font-weight:900}' +
      '.det-row__value.is-wrong-click{background:var(--red-soft);border-color:var(--red);color:var(--red);animation:shake .4s ease}' +
      '.det-row__value.is-correct-data{background:var(--surface-3);color:var(--text-3);border-color:var(--border-2)}' +
      '</style>'
    );
  }

  function renderBundle(b) {
    const order = ['rfq', 'quotation', 'po', 'so', 'picking', 'do', 'pod', 'invoice', 'remittance', 'creditNote'];
    return order.map(k => renderDoc(b[k])).join('');
  }

  function renderDoc(doc) {
    if (!doc) return '';
    return (
      '<div class="det-doc" data-doc="' + doc.key + '">' +
        '<div class="det-doc__head">' +
          '<span class="det-doc__icon">' + doc.icon + '</span>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="det-doc__title">' + esc(doc.title) + '</div>' +
            '<div class="det-doc__date">' + esc(doc.date) + '</div>' +
          '</div>' +
          '<div class="det-doc__num">' + esc(doc.num) + '</div>' +
        '</div>' +
        '<div>' +
          doc.rows.map(r => renderRow(doc, r)).join('') +
        '</div>' +
      '</div>'
    );
  }

  function renderRow(doc, row) {
    const cellKey = doc.key + '::' + row.field;
    const errorObj = state.bundle.errors.find(e => e.cellKey === cellKey);
    const isFound = errorObj && state.foundErrors.has(errorObj.id);
    const isWrongReason = errorObj && state.foundWithWrongReason.has(errorObj.id);

    let cls = 'det-row__value';
    if (isFound) {
      cls += isWrongReason ? ' is-found-wrong' : ' is-found';
    }

    return (
      '<div class="det-row">' +
        '<span class="det-row__label">' + esc(row.label) + '</span>' +
        '<span class="' + cls + '" data-cell="' + esc(cellKey) + '" data-error-id="' + (errorObj ? errorObj.id : '') + '">' +
          esc(row.value) +
        '</span>' +
      '</div>'
    );
  }

  function bindBoard() {
    document.querySelectorAll('.det-row__value').forEach(cell => {
      cell.addEventListener('click', () => onCellClick(cell));
    });
    const btnR = document.getElementById('btnDetRestart');
    if (btnR) btnR.addEventListener('click', restart);
    const btnE = document.getElementById('btnDetExit');
    if (btnE) btnE.addEventListener('click', exit);
    setTimeout(updateTimerDisplay, 100);
  }

  /* ============================================================
     11. INTERAKSI KLIK SEL
     ============================================================ */
  function onCellClick(cell) {
    const cellKey = cell.dataset.cell;
    const errorId = cell.dataset.errorId;

    // Sudah ketemu?
    if (errorId && state.foundErrors.has(errorId)) {
      if (global.App) App.toast('info', t({ id: 'Sudah ditemukan', en: 'Already found', mix: 'Sudah ditemukan' }));
      return;
    }

    // Bukan error → penalti
    if (!errorId) {
      state.wrongClicks++;
      cell.classList.add('is-wrong-click');
      setTimeout(() => {
        cell.classList.remove('is-wrong-click');
        cell.classList.add('is-correct-data');
      }, 1200);
      updateHUD();
      if (global.App) App.toast('bad', '❌ ' + t({ id: 'Data valid', en: 'Valid data', mix: 'Data valid' }), '−15 ' + t({ id: 'poin', en: 'points', mix: 'poin' }));
      if (global.Store) Store.addScore(-15, 'detektif', 'Salah klik');
      return;
    }

    // Ini error → buka MCQ
    const errorObj = state.bundle.errors.find(e => e.id === errorId);
    if (!errorObj) return;
    openReasonModal(errorObj, cell);
  }

  function updateHUD() {
    const foundEl = document.getElementById('detFound');
    if (foundEl) foundEl.textContent = state.foundErrors.size + ' / ' + state.bundle.errors.length;
    const wrongEl = document.getElementById('detWrong');
    if (wrongEl) wrongEl.textContent = state.wrongClicks;
    updateTimerDisplay();
  }

  /* ============================================================
     12. MCQ MODAL — PILIH ALASAN
     ============================================================ */
  function openReasonModal(errorObj, cellEl) {
    const distractors = shuffle(errorObj.distractors).slice(0, 3);
    const options = shuffle([errorObj.correctReason, ...distractors]);

    const html =
      '<div style="text-align:center;margin-bottom:18px">' +
        '<div style="font-size:44px;line-height:1;margin-bottom:6px">🔍</div>' +
        '<div style="font-size:15px;color:var(--text-2);line-height:1.5">' +
          t({ id: 'Kamu menandai data ini sebagai janggal. Kenapa?', en: 'You flagged this data. Why?', mix: 'Kamu tandai data ini janggal. Kenapa?' }) +
        '</div>' +
      '</div>' +
      '<div class="callout callout--warn mb-4">' +
        '<div class="callout__icon">📌</div>' +
        '<div class="callout__body"><b>' + esc(errorObj.cellKey.split('::')[1]) + '</b><p style="font-family:var(--ff-mono);font-size:13px">' + esc(cellEl.textContent.trim()) + '</p></div>' +
      '</div>' +
      '<div class="quiz__opts" id="detReasonOpts">' +
        options.map((opt, i) => {
          const key = String.fromCharCode(65 + i);
          return (
            '<button class="opt" data-reason-key="' + i + '">' +
              '<span class="opt__key">' + key + '</span>' +
              '<span class="opt__text">' + esc(t(opt)) + '</span>' +
            '</button>'
          );
        }).join('') +
      '</div>';

    if (!global.App) return;
    App.openModal({
      title: t({ id: 'Pilih Alasan Cross-Check', en: 'Pick Cross-Check Reason', mix: 'Pilih Alasan' }),
      html,
      footer: '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>',
      onFooter: () => {},
    });

    // Bind pilihan
    setTimeout(() => {
      const opts = document.querySelectorAll('#detReasonOpts .opt');
      opts.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          const chosen = options[i];
          const isCorrect = t(chosen) === t(errorObj.correctReason);
          opts.forEach(o => o.disabled = true);
          if (isCorrect) {
            btn.classList.add('is-correct');
            onCorrectReason(errorObj, cellEl);
          } else {
            btn.classList.add('is-wrong');
            // Highlight correct one
            opts.forEach((o, j) => {
              if (t(options[j]) === t(errorObj.correctReason)) o.classList.add('is-correct');
            });
            onWrongReason(errorObj, cellEl);
          }
          setTimeout(() => {
            App.closeModal();
            showExplanationAfter(errorObj, isCorrect);
          }, 1400);
        });
      });
    }, 60);
  }

  function onCorrectReason(errorObj, cellEl) {
    state.foundErrors.add(errorObj.id);
    cellEl.classList.remove('is-found-wrong');
    cellEl.classList.add('is-found');
    updateHUD();
    if (global.App) App.confetti({ count: 20, duration: 1.2 });
    if (global.Store) Store.addScore(50, 'detektif', 'Benar: ' + errorObj.id);
    if (global.App) App.toast('ok', '✅ ' + t({ id: 'Tepat!', en: 'Correct!', mix: 'Tepat!' }), '+50 ' + t({ id: 'poin', en: 'points', mix: 'poin' }));
    checkFinish();
  }

  function onWrongReason(errorObj, cellEl) {
    state.foundErrors.add(errorObj.id);
    state.foundWithWrongReason.add(errorObj.id);
    cellEl.classList.add('is-found-wrong');
    updateHUD();
    if (global.Store) Store.addScore(-20, 'detektif', 'Alasan salah: ' + errorObj.id);
    if (global.App) App.toast('warn', '⚠️ ' + t({ id: 'Alasan belum tepat', en: 'Reason not quite', mix: 'Alasan belum tepat' }), '−20 ' + t({ id: 'poin', en: 'points', mix: 'poin' }));
    checkFinish();
  }

  function showExplanationAfter(errorObj, wasCorrect) {
    if (!global.App) return;
    const html =
      '<div class="callout callout--' + (wasCorrect ? 'ok' : 'warn') + ' mb-4">' +
        '<div class="callout__icon">' + (wasCorrect ? '✅' : '⚠️') + '</div>' +
        '<div class="callout__body">' +
          '<b>' + (wasCorrect ? t({ id: 'Jawaban benar', en: 'Correct answer', mix: 'Jawaban benar' }) : t({ id: 'Jawaban belum tepat', en: 'Not quite', mix: 'Belum tepat' })) + '</b>' +
          '<p>' + esc(t(errorObj.correctReason)) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="callout callout--info">' +
        '<div class="callout__icon">📚</div>' +
        '<div class="callout__body">' +
          '<b>' + t({ id: 'Kenapa ini penting', en: 'Why it matters', mix: 'Kenapa penting' }) + '</b>' +
          '<p>' + esc(t(errorObj.explanation)) + '</p>' +
        '</div>' +
      '</div>';

    App.openModal({
      title: t({ id: 'Penjelasan', en: 'Explanation', mix: 'Penjelasan' }),
      html,
      footer: '<button class="btn btn--primary" data-modal-close>' + t({ id: 'Mengerti', en: 'Got it', mix: 'Mengerti' }) + '</button>',
    });
  }

  /* ============================================================
     13. CEK FINISH
     ============================================================ */
  function checkFinish() {
    if (state.foundErrors.size >= state.bundle.errors.length) {
      stopTimer();
      state.finishedAt = Date.now();
      setTimeout(() => finishGame(false), 800);
    }
  }

  function finishGame(timeUp) {
    const totalErrors = state.bundle.errors.length;
    const found = state.foundErrors.size;
    const foundCorrect = found - state.foundWithWrongReason.size;

    // Skor
    const baseScore = foundCorrect * 50;
    const wrongReasonPenalty = state.foundWithWrongReason.size * 20;
    const wrongClickPenalty = state.wrongClicks * 15;
    const timeBonus = timeUp ? 0 : Math.round(Math.max(0, (LEVELS[state.level].time - state.timer) / LEVELS[state.level].time) * 100);
    const multiplier = LEVELS[state.level].multiplier;
    const finalScore = Math.max(0, Math.round((baseScore + timeBonus - wrongReasonPenalty - wrongClickPenalty) * multiplier / 100) * 100 / 100);

    // Simpan
    if (global.Store) {
      const oldBest = Store.get('detektif.score') || 0;
      if (finalScore > oldBest) {
        Store.set('detektif.score', Math.round(finalScore));
        Store.set('detektif.bestLevel', state.level);
      }
      Store.markDone('detektif');
      Store.log('detektif:finish', { level: state.level, found, total: totalErrors, score: Math.round(finalScore) });

      if (found === totalErrors && state.wrongClicks === 0) Store.unlockBadge('audit_perfect');
      if (state.wrongClicks === 0 && foundCorrect === totalErrors) Store.unlockBadge('detective_eagle');
      if (state.level === 'hard' && foundCorrect === totalErrors) Store.unlockBadge('detective_hard');
    }

    if (global.App) App.confetti({ count: found === totalErrors ? 120 : 50, duration: 3 });

    renderReport({
      found,
      foundCorrect,
      foundWrongReason: state.foundWithWrongReason.size,
      total: totalErrors,
      wrongClicks: state.wrongClicks,
      timeUp,
      elapsed: state.timer,
      timeBonus,
      finalScore: Math.round(finalScore),
      missing: state.bundle.errors.filter(e => !state.foundErrors.has(e.id)),
    });
  }

  /* ============================================================
     14. LAPORAN AKHIR
     ============================================================ */
  function renderReport(summary) {
    const s = summary;
    const allFound = s.found === s.total && s.foundWrongReason === 0;
    const icon = s.timeUp ? '⏰' : allFound ? '🏆' : s.foundCorrect >= s.total * 0.6 ? '🎉' : '🔍';

    const errorList = state.bundle.errors.map((err, i) => {
      const wasFound = state.foundErrors.has(err.id);
      const wasWrongReason = state.foundWithWrongReason.has(err.id);
      return (
        '<div class="det-report-item' + (wasFound ? '' : ' is-missed') + (wasWrongReason ? ' is-wrong-reason' : '') + '">' +
          '<div class="det-report-item__head">' +
            '<span class="det-report-item__num">' + (i + 1) + '</span>' +
            '<div style="flex:1;min-width:0">' +
              '<div class="det-report-item__title">' + esc(err.docKey) + ' · ' + esc(err.field) + '</div>' +
              '<div class="det-report-item__status">' +
                (wasFound
                  ? (wasWrongReason ? '⚠️ ' + t({ id: 'Ditemukan dengan alasan salah', en: 'Found with wrong reason', mix: 'Ditemukan, alasan salah' }) : '✅ ' + t({ id: 'Ditemukan', en: 'Found', mix: 'Ditemukan' }))
                  : '❌ ' + t({ id: 'Tidak ditemukan', en: 'Missed', mix: 'Tidak ditemukan' })) +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="det-report-item__body">' +
            '<div class="det-report-item__label">' + t({ id: 'Alasan benar', en: 'Correct reason', mix: 'Alasan benar' }) + '</div>' +
            '<div class="det-report-item__value">' + esc(t(err.correctReason)) + '</div>' +
            '<div class="det-report-item__label mt-2">' + t({ id: 'Penjelasan', en: 'Explanation', mix: 'Penjelasan' }) + '</div>' +
            '<div class="det-report-item__value" style="font-weight:500;color:var(--text-2)">' + esc(t(err.explanation)) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    const html =
      '<div style="text-align:center;margin-bottom:20px">' +
        '<div style="font-size:64px;line-height:1;margin-bottom:8px">' + icon + '</div>' +
        '<h3 style="font-size:22px;font-weight:800;margin:6px 0 8px">' +
          (s.timeUp
            ? t({ id: 'Waktu Habis', en: 'Time Up', mix: 'Waktu Habis' })
            : allFound
              ? t({ id: 'Audit Sempurna!', en: 'Perfect Audit!', mix: 'Audit Sempurna!' })
              : t({ id: 'Ronde Selesai', en: 'Round Complete', mix: 'Ronde Selesai' })) +
        '</h3>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:20px">' +
        '<div style="padding:12px;background:var(--green-soft);border-radius:var(--r-md);text-align:center">' +
          '<div style="font-size:10.5px;color:var(--green);text-transform:uppercase;font-weight:900;letter-spacing:.5px">' + t({ id: 'Ditemukan', en: 'Found', mix: 'Found' }) + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:var(--green);font-family:var(--ff-mono)">' + s.foundCorrect + '/' + s.total + '</div>' +
        '</div>' +
        '<div style="padding:12px;background:var(--red-soft);border-radius:var(--r-md);text-align:center">' +
          '<div style="font-size:10.5px;color:var(--red);text-transform:uppercase;font-weight:900;letter-spacing:.5px">' + t({ id: 'Salah Klik', en: 'Wrong Clicks', mix: 'Salah Klik' }) + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:var(--red);font-family:var(--ff-mono)">' + s.wrongClicks + '</div>' +
        '</div>' +
        '<div style="padding:12px;background:var(--amber-soft);border-radius:var(--r-md);text-align:center">' +
          '<div style="font-size:10.5px;color:var(--amber);text-transform:uppercase;font-weight:900;letter-spacing:.5px">' + t({ id: 'Alasan Salah', en: 'Wrong Reason', mix: 'Alasan Salah' }) + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:var(--amber);font-family:var(--ff-mono)">' + s.foundWrongReason + '</div>' +
        '</div>' +
        '<div style="padding:12px;background:var(--primary-soft);border-radius:var(--r-md);text-align:center">' +
          '<div style="font-size:10.5px;color:var(--primary);text-transform:uppercase;font-weight:900;letter-spacing:.5px">' + t({ id: 'Skor Akhir', en: 'Final Score', mix: 'Skor Akhir' }) + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:var(--primary);font-family:var(--ff-mono)">+' + s.finalScore + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="divider divider--dashed">' + t({ id: 'Detail Setiap Error', en: 'Per-Error Detail', mix: 'Detail Error' }) + '</div>' +

      '<div class="det-report-list">' + errorList + '</div>' +

      '<style>' +
      '.det-report-list{display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto;padding-right:6px}' +
      '.det-report-item{padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);border-left:3px solid var(--green)}' +
      '.det-report-item.is-missed{border-left-color:var(--red);opacity:.9}' +
      '.det-report-item.is-wrong-reason{border-left-color:var(--amber)}' +
      '.det-report-item__head{display:flex;align-items:center;gap:10px;margin-bottom:8px}' +
      '.det-report-item__num{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--bg-elev);font-size:11px;font-weight:800;font-family:var(--ff-mono);color:var(--text-2)}' +
      '.det-report-item__title{font-size:12.5px;font-weight:800;color:var(--text);font-family:var(--ff-mono)}' +
      '.det-report-item__status{font-size:11px;color:var(--text-3);margin-top:2px;font-weight:700}' +
      '.det-report-item__body{font-size:12px;line-height:1.55}' +
      '.det-report-item__label{font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;color:var(--text-3);margin-bottom:3px}' +
      '.det-report-item__value{color:var(--text-2)}' +
      '</style>';

    if (!global.App) return;
    App.openModal({
      title: t({ id: 'Laporan Audit', en: 'Audit Report', mix: 'Laporan Audit' }),
      html,
      footer:
        '<button class="btn btn--ghost" id="btnDetChangeLevel">🎯 ' + t({ id: 'Ganti Level', en: 'Change Level', mix: 'Ganti Level' }) + '</button>' +
        '<button class="btn btn--primary" id="btnDetPlayAgain">🔄 ' + t({ id: 'Main Lagi', en: 'Play Again', mix: 'Main Lagi' }) + '</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'btnDetPlayAgain') {
          App.closeModal();
          restart();
        } else if (btn.id === 'btnDetChangeLevel') {
          App.closeModal();
          state.active = false;
          if (global.Store) Store.set('detektif.active', false);
          render();
        } else {
          App.closeModal();
        }
      },
    });
  }

  /* ============================================================
     15. RESTART / EXIT
     ============================================================ */
  function restart() {
    stopTimer();
    const lvl = state.level;
    state.active = false;
    if (global.Store) Store.set('detektif.active', false);
    startGame(lvl);
  }

  function exit() {
    if (global.App) {
      App.openModal({
        title: t({ id: 'Keluar?', en: 'Exit?', mix: 'Keluar?' }),
        html: '<p style="font-size:13.5px;color:var(--text-2)">' + t({ id: 'Progres ronde ini akan hilang.', en: 'This round\'s progress will be lost.', mix: 'Progres ronde ini akan hilang.' }) + '</p>',
        footer:
          '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>' +
          '<button class="btn btn--danger" id="btnDetConfirmExit">✕ ' + t({ id: 'Ya, Keluar', en: 'Yes, Exit', mix: 'Ya, Keluar' }) + '</button>',
        onFooter: (a, btn) => {
          if (btn.id === 'btnDetConfirmExit') {
            App.closeModal();
            stopTimer();
            state.active = false;
            if (global.Store) Store.set('detektif.active', false);
            render();
            App.navigate('beranda');
          }
        },
      });
    }
  }

  /* ============================================================
     16. INIT
     ============================================================ */
  function init() {
    render();
    document.addEventListener('i18n:change', () => {
      const active = document.querySelector('.view.is-active');
      if (active && active.dataset.view === 'detektif') {
        if (state.active) render();
        else render();
      }
    });
    document.addEventListener('route:change', (e) => {
      if (e.detail && e.detail.view !== 'detektif' && state.active) {
        stopTimer();
      } else if (e.detail && e.detail.view === 'detektif') {
        if (state.active) startTimer();
        else render();
      }
    });
    global.addEventListener('beforeunload', stopTimer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- EXPORT ---------- */
  global.Detektif = {
    render,
    startGame,
    LEVELS,
    ERROR_TEMPLATES,
    _state: state,
    _buildBundle: buildBundle,
  };

})(window);