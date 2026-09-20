/* ============================================================
   ROLEPLAY.JS — Simulasi Peran Penjual ⇄ Pembeli
   ============================================================
   Fitur:
   - Layar pilih peran (Seller/Buyer/Hotseat)
   - Panel ganda: kiri Penjual, kanan Pembeli
   - 9 tahap linear yang harus dilalui
   - Form dokumen isian yang divalidasi
   - Auto-generate dokumen visual (nomor, cap, total)
   - Ronde negosiasi harga (buyer minta, seller jawab)
   - Log percakapan + histori dokumen
   - Skor akurasi isian form
   ============================================================ */

(function (global) {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ============================================================
     1. KONFIGURASI TAHAP
     ============================================================ */
  const STAGES = [
    /* --- 1. BUYER: Kirim RFQ --- */
    {
      id: 'rfq',
      actor: 'buyer',
      icon: '📄',
      title: { id: 'Kirim RFQ', en: 'Send RFQ', mix: 'Kirim RFQ' },
      desc: {
        id: 'Kamu (Pembeli) memulai dengan mengirim Request for Quotation ke penjual.',
        en: 'You (Buyer) start by sending a Request for Quotation to the seller.',
        mix: 'Kamu (Pembeli) mulai dengan kirim RFQ ke penjual.',
      },
      form: [
        { key: 'qty', label: { id: 'Volume Diminta (kg)', en: 'Requested Volume (kg)', mix: 'Volume (kg)' }, type: 'number', min: 100, max: 2000, required: true, default: 500, hint: { id: 'Butuh 100–2000 kg', en: 'Need 100–2000 kg', mix: '100–2000 kg' } },
        { key: 'targetPrice', label: { id: 'Target Harga / kg (Rp)', en: 'Target Price / kg (IDR)', mix: 'Target Harga (Rp)' }, type: 'number', min: 200000, max: 400000, required: true, default: 260000, hint: { id: 'Anggaran internal kamu', en: 'Your internal budget', mix: 'Budget internal kamu' } },
        { key: 'deadline', label: { id: 'Batas Penawaran', en: 'Submission Deadline', mix: 'Deadline' }, type: 'date', required: true, default: '' /* auto */ },
        { key: 'notes', label: { id: 'Catatan Tambahan', en: 'Additional Notes', mix: 'Catatan' }, type: 'textarea', required: false, default: 'Mohon sertakan sertifikat origin & hasil uji lab.' },
      ],
      produces: 'rfq',
      validation: {
        deadline: (v) => {
          if (!v) return { ok: false, msg: { id: 'Deadline wajib diisi', en: 'Deadline required', mix: 'Deadline wajib' } };
          const d = new Date(v);
          const now = new Date();
          if (d < now) return { ok: false, msg: { id: 'Deadline tidak boleh di masa lalu', en: 'Deadline cannot be in the past', mix: 'Deadline nggak boleh lewat' } };
          return { ok: true };
        },
      },
    },

    /* --- 2. SELLER: Kirim Quotation --- */
    {
      id: 'quotation',
      actor: 'seller',
      icon: '📑',
      title: { id: 'Kirim Quotation', en: 'Send Quotation', mix: 'Kirim Quotation' },
      desc: {
        id: 'Kamu (Penjual) menghitung harga jual berdasarkan target pembeli & margin minimal 12%.',
        en: 'You (Seller) calculate the selling price based on buyer target & minimum 12% margin.',
        mix: 'Kamu (Seller) hitung harga jual dari target buyer & margin minimal 12%.',
      },
      form: [
        { key: 'unitPrice', label: { id: 'Harga Jual / kg (Rp)', en: 'Selling Price / kg (IDR)', mix: 'Harga Jual (Rp)' }, type: 'number', min: 200000, max: 400000, required: true, default: 0, hint: { id: 'Margin minimal 12% dari modal Rp 235.000/kg', en: 'Min 12% margin from COGS Rp 235.000/kg', mix: 'Margin min 12% dari modal Rp 235.000' } },
        { key: 'paymentTerms', label: { id: 'Syarat Pembayaran', en: 'Payment Terms', mix: 'Payment Terms' }, type: 'select', required: true, options: [
          { v: 'DP30_NET30', t: { id: 'DP 30% · Sisa NET 30', en: 'DP 30% · NET 30 balance', mix: 'DP 30% + NET 30' } },
          { v: 'NET30', t: { id: 'NET 30 (tanpa DP)', en: 'NET 30 (no DP)', mix: 'NET 30' } },
          { v: 'NET45', t: { id: 'NET 45', en: 'NET 45', mix: 'NET 45' } },
          { v: 'COD', t: { id: 'Cash on Delivery', en: 'Cash on Delivery', mix: 'COD' } },
        ], default: 'DP30_NET30' },
        { key: 'leadTime', label: { id: 'Lead Time (hari)', en: 'Lead Time (days)', mix: 'Lead Time (hari)' }, type: 'number', min: 3, max: 60, required: true, default: 12 },
        { key: 'validity', label: { id: 'Masa Berlaku (hari)', en: 'Validity (days)', mix: 'Validity (hari)' }, type: 'number', min: 7, max: 60, required: true, default: 14 },
      ],
      produces: 'quotation',
      validation: {
        unitPrice: (v, form) => {
          const modal = 235000;
          const margin = ((v - modal) / modal) * 100;
          if (v < modal * 1.05) return { ok: false, msg: { id: 'Margin terlalu tipis (< 5%). Risiko rugi.', en: 'Margin too thin (< 5%). Risky.', mix: 'Margin terlalu tipis (< 5%). Risk.' } };
          if (margin < 12) return { ok: true, warn: { id: 'Margin di bawah 12% — masih OK tapi hati-hati.', en: 'Margin below 12% — OK but be careful.', mix: 'Margin < 12% — OK tapi hati-hati.' } };
          if (v > 350000) return { ok: true, warn: { id: 'Harga di atas Rp 350k/kg — pembeli mungkin menolak.', en: 'Price above Rp 350k/kg — buyer may reject.', mix: 'Harga > 350k/kg — buyer mungkin reject.' } };
          return { ok: true };
        },
      },
    },

    /* --- 3. BUYER: Terima / Nego --- */
    {
      id: 'review',
      actor: 'buyer',
      icon: '🤔',
      title: { id: 'Review & Negosiasi', en: 'Review & Negotiate', mix: 'Review & Nego' },
      desc: {
        id: 'Kamu (Pembeli) menilai penawaran. Bisa terima langsung, atau minta diskon.',
        en: 'You (Buyer) evaluate the offer. Accept directly, or ask for a discount.',
        mix: 'Kamu (Buyer) review penawaran. Terima atau minta diskon.',
      },
      special: 'negotiation',
      produces: 'nego-response',
    },

    /* --- 4. SELLER: Konfirmasi Harga Akhir --- */
    {
      id: 'final-price',
      actor: 'seller',
      icon: '✅',
      title: { id: 'Konfirmasi Harga Akhir', en: 'Confirm Final Price', mix: 'Konfirmasi Harga' },
      desc: {
        id: 'Kamu (Penjual) memutuskan: terima permintaan pembeli, atau tolak dengan alasan.',
        en: 'You (Seller) decide: accept the buyer\'s request or decline with a reason.',
        mix: 'Kamu (Seller) putuskan: terima permintaan buyer atau tolak.',
      },
      special: 'final-decision',
      produces: 'final-quotation',
    },

    /* --- 5. BUYER: Kirim PO --- */
    {
      id: 'po',
      actor: 'buyer',
      icon: '📥',
      title: { id: 'Kirim Purchase Order', en: 'Send Purchase Order', mix: 'Kirim PO' },
      desc: {
        id: 'Kamu (Pembeli) resmi memesan setelah harga disepakati.',
        en: 'You (Buyer) formally order after price is agreed.',
        mix: 'Kamu (Buyer) resmi order setelah harga deal.',
      },
      form: [
        { key: 'shipTo', label: { id: 'Alamat Kirim', en: 'Ship To', mix: 'Alamat Kirim' }, type: 'text', required: true, default: 'Gudang Bandung — Jl. Braga No. 45' },
        { key: 'deliveryDate', label: { id: 'Tanggal Minta Kirim', en: 'Requested Delivery Date', mix: 'Tgl Kirim' }, type: 'date', required: true, default: '' },
        { key: 'pic', label: { id: 'PIC Penerima', en: 'Receiving PIC', mix: 'PIC Penerima' }, type: 'text', required: true, default: 'Rizky Hidayat' },
      ],
      produces: 'po',
      validation: {
        deliveryDate: (v) => {
          if (!v) return { ok: false, msg: { id: 'Tanggal kirim wajib', en: 'Delivery date required', mix: 'Tgl kirim wajib' } };
          const d = new Date(v);
          const min = new Date(); min.setDate(min.getDate() + 7);
          if (d < min) return { ok: false, msg: { id: 'Minimal 7 hari dari sekarang (lead time produksi)', en: 'At least 7 days from now (production lead time)', mix: 'Min 7 hari dari sekarang' } };
          return { ok: true };
        },
      },
    },

    /* --- 6. SELLER: Sales Order (internal) --- */
    {
      id: 'so',
      actor: 'seller',
      icon: '🔄',
      title: { id: 'Buat Sales Order', en: 'Create Sales Order', mix: 'Buat SO' },
      desc: {
        id: 'Kamu (Penjual) mengunci pesanan di sistem internal ERP.',
        en: 'You (Seller) lock the order in the internal ERP system.',
        mix: 'Kamu (Seller) kunci order di ERP internal.',
      },
      form: [
        { key: 'warehouse', label: { id: 'Gudang Asal', en: 'Source Warehouse', mix: 'Gudang' }, type: 'select', required: true, options: [
          { v: 'WH-Takengon-01', t: { id: 'WH-Takengon-01', en: 'WH-Takengon-01', mix: 'WH-Takengon-01' } },
          { v: 'WH-Medan-02', t: { id: 'WH-Medan-02', en: 'WH-Medan-02', mix: 'WH-Medan-02' } },
          { v: 'WH-Jakarta-03', t: { id: 'WH-Jakarta-03', en: 'WH-Jakarta-03', mix: 'WH-Jakarta-03' } },
        ], default: 'WH-Takengon-01' },
        { key: 'pickingDate', label: { id: 'Tanggal Picking', en: 'Picking Date', mix: 'Tgl Picking' }, type: 'date', required: true, default: '' },
        { key: 'salesOwner', label: { id: 'Sales Owner', en: 'Sales Owner', mix: 'Sales Owner' }, type: 'text', required: true, default: 'Firhan Fahamzha' },
      ],
      produces: 'so',
    },

    /* --- 7. SELLER: Delivery Order --- */
    {
      id: 'do',
      actor: 'seller',
      icon: '🚛',
      title: { id: 'Terbitkan Surat Jalan', en: 'Issue Delivery Order', mix: 'Terbitkan DO' },
      desc: {
        id: 'Kamu (Penjual) menyiapkan pengiriman. Qty & alamat wajib sama dengan PO.',
        en: 'You (Seller) prepare shipment. Qty & address must match the PO.',
        mix: 'Kamu (Seller) siapkan kiriman. Qty & alamat wajib sama PO.',
      },
      form: [
        { key: 'driver', label: { id: 'Nama Pengemudi', en: 'Driver Name', mix: 'Driver' }, type: 'text', required: true, default: 'Sugeng Riyadi' },
        { key: 'vehicle', label: { id: 'Nomor Kendaraan', en: 'Vehicle Plate', mix: 'Kendaraan' }, type: 'text', required: true, default: 'B 9123 XYZ' },
        { key: 'eta', label: { id: 'Estimasi Sampai', en: 'ETA', mix: 'ETA' }, type: 'date', required: true, default: '' },
        { key: 'sealNumber', label: { id: 'Nomor Segel', en: 'Seal Number', mix: 'No. Segel' }, type: 'text', required: true, default: 'FFG-2025-00231-A' },
      ],
      produces: 'do',
      validation: {
        eta: (v, form, ctx) => {
          if (!v) return { ok: false, msg: { id: 'ETA wajib diisi', en: 'ETA required', mix: 'ETA wajib' } };
          const eta = new Date(v);
          const po = ctx.poDate ? new Date(ctx.poDate) : new Date();
          if (eta <= po) return { ok: false, msg: { id: 'ETA harus setelah tanggal PO', en: 'ETA must be after PO date', mix: 'ETA harus setelah PO' } };
          return { ok: true };
        },
      },
    },

    /* --- 8. BUYER: Konfirmasi Terima (POD) --- */
    {
      id: 'pod',
      actor: 'buyer',
      icon: '✅',
      title: { id: 'Konfirmasi Penerimaan', en: 'Confirm Receipt', mix: 'Konfirmasi Terima' },
      desc: {
        id: 'Kamu (Pembeli) memverifikasi barang datang. Wajib cek qty & kondisi.',
        en: 'You (Buyer) verify the goods arrived. Must check qty & condition.',
        mix: 'Kamu (Buyer) verifikasi barang datang. Cek qty & kondisi.',
      },
      form: [
        { key: 'receivedBy', label: { id: 'Diterima Oleh', en: 'Received By', mix: 'Diterima Oleh' }, type: 'text', required: true, default: 'Rizky Hidayat' },
        { key: 'receivedQty', label: { id: 'Qty Diterima (kg)', en: 'Received Qty (kg)', mix: 'Qty Diterima' }, type: 'number', min: 0, max: 2000, required: true, default: 500, hint: { id: 'Harus sama dengan qty DO. Kalau beda, buat berita acara.', en: 'Must equal DO qty. If different, file a report.', mix: 'Harus sama qty DO. Kalau beda, bikin berita acara.' } },
        { key: 'condition', label: { id: 'Kondisi Barang', en: 'Goods Condition', mix: 'Kondisi' }, type: 'select', required: true, options: [
          { v: 'good', t: { id: '✅ Baik — semua utuh', en: '✅ Good — all intact', mix: '✅ Baik' } },
          { v: 'minor', t: { id: '⚠️ Ada kerusakan minor', en: '⚠️ Minor damage', mix: '⚠️ Minor' } },
          { v: 'damage', t: { id: '❌ Rusak berat', en: '❌ Severe damage', mix: '❌ Rusak' } },
        ], default: 'good' },
        { key: 'notes', label: { id: 'Catatan Verifikasi', en: 'Verification Notes', mix: 'Catatan' }, type: 'textarea', required: false, default: 'Tidak ada keluhan.' },
      ],
      produces: 'pod',
      validation: {
        receivedQty: (v, form, ctx) => {
          if (!ctx.poQty) return { ok: true };
          if (v !== ctx.poQty) return { ok: true, warn: { id: 'Qty beda dengan PO (' + ctx.poQty + ' kg). Perlu Berita Acara.', en: 'Qty differs from PO (' + ctx.poQty + ' kg). Requires a Report.', mix: 'Qty beda dengan PO. Perlu Berita Acara.' } };
          return { ok: true };
        },
      },
    },

    /* --- 9. SELLER: Invoice --- */
    {
      id: 'invoice',
      actor: 'seller',
      icon: '📄',
      title: { id: 'Terbitkan Invoice', en: 'Issue Invoice', mix: 'Terbitkan Invoice' },
      desc: {
        id: 'Kamu (Penjual) menagih sisa pembayaran. Jangan lupa kurangi DP.',
        en: 'You (Seller) invoice the remaining balance. Don\'t forget to deduct the DP.',
        mix: 'Kamu (Seller) tagih sisa. Jangan lupa kurangi DP.',
      },
      form: [
        { key: 'dueDate', label: { id: 'Jatuh Tempo', en: 'Due Date', mix: 'Jatuh Tempo' }, type: 'date', required: true, default: '' },
        { key: 'vatRate', label: { id: 'PPN (%)', en: 'VAT (%)', mix: 'PPN (%)' }, type: 'number', min: 0, max: 20, required: true, default: 11 },
        { key: 'deductDP', label: { id: 'Kurangi DP?', en: 'Deduct DP?', mix: 'Kurangi DP?' }, type: 'select', required: true, options: [
          { v: 'yes', t: { id: 'Ya — DP 30% sudah dibayar', en: 'Yes — 30% DP already paid', mix: 'Ya — DP 30% sudah dibayar' } },
          { v: 'no', t: { id: 'Tidak — tagih penuh', en: 'No — full amount', mix: 'Tidak — full amount' } },
        ], default: 'yes' },
      ],
      produces: 'invoice',
      validation: {
        dueDate: (v, form, ctx) => {
          if (!v) return { ok: false, msg: { id: 'Jatuh tempo wajib', en: 'Due date required', mix: 'Jatuh tempo wajib' } };
          const due = new Date(v);
          const now = new Date();
          if (due <= now) return { ok: false, msg: { id: 'Jatuh tempo harus setelah hari ini', en: 'Due date must be after today', mix: 'Jatuh tempo harus setelah hari ini' } };
          return { ok: true };
        },
      },
    },

    /* --- 10. BUYER: Konfirmasi Bayar --- */
    {
      id: 'remittance',
      actor: 'buyer',
      icon: '💰',
      title: { id: 'Kirim Pembayaran', en: 'Send Payment', mix: 'Kirim Bayar' },
      desc: {
        id: 'Kamu (Pembeli) transfer & kirim remittance advice.',
        en: 'You (Buyer) transfer & send remittance advice.',
        mix: 'Kamu (Buyer) transfer & kirim remittance.',
      },
      form: [
        { key: 'paidAmount', label: { id: 'Jumlah Transfer (Rp)', en: 'Amount Transferred (IDR)', mix: 'Jumlah Transfer' }, type: 'number', min: 0, required: true, default: 0, hint: { id: 'Harus sama dengan total invoice', en: 'Must match invoice total', mix: 'Harus sama total invoice' } },
        { key: 'bank', label: { id: 'Bank Pengirim', en: 'Remitting Bank', mix: 'Bank' }, type: 'select', required: true, options: [
          { v: 'BCA', t: { id: 'BCA', en: 'BCA', mix: 'BCA' } },
          { v: 'Mandiri', t: { id: 'Mandiri', en: 'Mandiri', mix: 'Mandiri' } },
          { v: 'BNI', t: { id: 'BNI', en: 'BNI', mix: 'BNI' } },
          { v: 'BRI', t: { id: 'BRI', en: 'BRI', mix: 'BRI' } },
        ], default: 'BCA' },
        { key: 'ref', label: { id: 'Berita Transfer', en: 'Transfer Note', mix: 'Berita' }, type: 'text', required: true, default: '' },
      ],
      produces: 'remittance',
      validation: {
        paidAmount: (v, form, ctx) => {
          if (!ctx.invoiceTotal) return { ok: true };
          if (v !== ctx.invoiceTotal) {
            const diff = v - ctx.invoiceTotal;
            return { ok: true, warn: { id: 'Jumlah beda dengan invoice (selisih Rp ' + Math.abs(diff).toLocaleString('id-ID') + '). Perlu klarifikasi.', en: 'Amount differs from invoice (diff Rp ' + Math.abs(diff).toLocaleString('id-ID') + '). Needs clarification.', mix: 'Beda invoice (selisih Rp ' + Math.abs(diff).toLocaleString('id-ID') + '). Perlu klarifikasi.' } };
          }
          return { ok: true };
        },
      },
    },
  ];

  /* ============================================================
     2. STATE SEMENTARA (runtime, tidak semua persist)
     ============================================================ */
  const runtime = {
    ctx: {},        // konteks data (qty, unitPrice, poNumber, dll)
    log: [],        // { t, from, icon, type, title, text, docNumber }
    documents: [],  // dokumen yang sudah ter-generate
    negoState: null, // { asking, original, offered, response }
    finalPrice: null,
    currentStageIndex: 0,
    startedAt: null,
    selftest: false,
  };

  /* ============================================================
     3. UTIL
     ============================================================ */
  const t = (obj) => {
    if (!obj) return '';
    const lang = (global.I18N && I18N.get && I18N.get()) || 'mix';
    return obj[lang] || obj.mix || obj.id || obj.en || '';
  };
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  const fmtIDR = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const fmtDate = (d) => {
    if (!d) return '—';
    const dd = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dd.getTime())) return String(d);
    return dd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  /* ============================================================
     4. RENDER ROOT — Pilih Peran / Board
     ============================================================ */
  function render() {
    const mount = document.getElementById('roleplayMount');
    if (!mount) return;

    const rp = (global.Store && Store.get('roleplay')) || { active: false, role: null };

    if (!rp.active) {
      mount.innerHTML = renderRoleChooser();
      bindRoleChooser();
    } else {
      mount.innerHTML = renderBoard();
      bindBoard();
      renderPanel('seller');
      renderPanel('buyer');
      updateTurnIndicator();
      renderLog();
      renderDocStack();
      updateProgressBar();
    }
  }

  /* ============================================================
     5. LAYAR PILIH PERAN
     ============================================================ */
  function renderRoleChooser() {
    const data = (global.MATERI_DATA) || {};
    const product = data.product || { name: 'Arabika Gayo', qty: 500, unit: 'kg', pricePerKg: 285000 };
    const seller = (data.company && data.company.seller) || { name: 'PT Firhan Fahamzha Global', director: 'Firhan Fahamzha' };
    const buyer  = (data.company && data.company.buyer)  || { name: 'Kopi Senja Group', manager: 'Nadia Prameswari' };

    return (
      '<div class="rp-intro">' +
        '<div class="card card--flat mb-5" style="background:linear-gradient(135deg,var(--primary-soft),var(--teal-soft))">' +
          '<div class="card__body" style="display:flex;gap:var(--s-5);flex-wrap:wrap;align-items:flex-start">' +
            '<div style="font-size:48px;line-height:1">🎭</div>' +
            '<div style="flex:1;min-width:240px">' +
              '<div style="font-size:18px;font-weight:800;margin-bottom:6px">Pilih Peran & Mulai Simulasi</div>' +
              '<p style="font-size:13.5px;line-height:1.65;color:var(--text-2);margin:0 0 12px">' +
                'Kamu akan menjalani <b>10 tahap Order-to-Cash</b> sebagai Penjual atau Pembeli. Setiap tahap butuh form yang harus diisi dengan benar. Skor dihitung dari akurasi.' +
              '</p>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
                '<span class="chip">📦 ' + esc(product.name) + '</span>' +
                '<span class="chip">⚖️ ' + esc(product.qty) + ' ' + esc(product.unit) + '</span>' +
                '<span class="chip">💰 ' + fmtIDR(product.pricePerKg) + '/' + esc(product.unit) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="rp-choose-grid">' +
          '<div class="rp-choose-card rp-panel--seller" data-role-pick="seller">' +
            '<div class="rp-choose-card__avatar">🧑‍💼</div>' +
            '<div class="rp-choose-card__title">Main sebagai Penjual</div>' +
            '<div class="rp-choose-card__who">' + esc(seller.director) + ' · ' + esc(seller.name) + '</div>' +
            '<ul class="rp-choose-card__list">' +
              '<li>Buat Quotation & tentukan harga</li>' +
              '<li>Kunci Sales Order di ERP</li>' +
              '<li>Terbitkan DO & Invoice</li>' +
              '<li>Respons negosiasi pembeli</li>' +
            '</ul>' +
            '<button class="btn btn--primary btn--block">Pilih Penjual</button>' +
          '</div>' +

          '<div class="rp-choose-card rp-panel--buyer" data-role-pick="buyer">' +
            '<div class="rp-choose-card__avatar">🧑‍💻</div>' +
            '<div class="rp-choose-card__title">Main sebagai Pembeli</div>' +
            '<div class="rp-choose-card__who">' + esc(buyer.manager) + ' · ' + esc(buyer.name) + '</div>' +
            '<ul class="rp-choose-card__list">' +
              '<li>Kirim RFQ dengan target harga</li>' +
              '<li>Negosiasi diskon</li>' +
              '<li>Terbitkan Purchase Order</li>' +
              '<li>Konfirmasi penerimaan & bayar</li>' +
            '</ul>' +
            '<button class="btn btn--teal btn--block">Pilih Pembeli</button>' +
          '</div>' +

          '<div class="rp-choose-card rp-choose-card--hot" data-role-pick="hotseat">' +
            '<div class="rp-choose-card__avatar">👥</div>' +
            '<div class="rp-choose-card__title">Hot-seat (Dua Pemain)</div>' +
            '<div class="rp-choose-card__who">Satu laptop, dua orang bergantian</div>' +
            '<ul class="rp-choose-card__list">' +
              '<li>Panel kiri = Penjual, kanan = Pembeli</li>' +
              '<li>Tombol "Serahkan" antar giliran</li>' +
              '<li>Cocok untuk latihan berpasangan</li>' +
              '<li>Skor digabung & dicatat</li>' +
            '</ul>' +
            '<button class="btn btn--violet btn--block">Mulai Hot-seat</button>' +
          '</div>' +
        '</div>' +

        '<div class="callout callout--info mt-5">' +
          '<div class="callout__icon">💡</div>' +
          '<div class="callout__body">' +
            '<b>Cara main</b>' +
            '<p>Ikuti tahap berurutan. Aktif hanya saat giliranmu. Pilih tindakan, isi form, lihat dokumen ter-generate di sebelah kanan.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<style>' +
      '.rp-choose-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--s-4)}' +
      '.rp-choose-card{padding:var(--s-5);background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-lg);display:flex;flex-direction:column;gap:10px;transition:transform .2s,box-shadow .2s,border-color .2s}' +
      '.rp-choose-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-3);border-color:var(--primary)}' +
      '.rp-choose-card--hot:hover{border-color:var(--violet)}' +
      '.rp-choose-card__avatar{font-size:40px;line-height:1}' +
      '.rp-choose-card__title{font-size:16px;font-weight:800;color:var(--text)}' +
      '.rp-choose-card__who{font-size:12px;color:var(--text-3)}' +
      '.rp-choose-card__list{list-style:none;padding:0;margin:8px 0;display:flex;flex-direction:column;gap:5px}' +
      '.rp-choose-card__list li{font-size:12.5px;color:var(--text-2);padding-left:18px;position:relative}' +
      '.rp-choose-card__list li::before{content:"▸";position:absolute;left:0;color:var(--primary);font-weight:800}' +
      '.rp-choose-card--hot .rp-choose-card__list li::before{color:var(--violet)}' +
      '</style>'
    );
  }

  function bindRoleChooser() {
    $$('[data-role-pick]').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.dataset.rolePick;
        startSession(role);
      });
    });
  }

  /* ============================================================
     6. MULAI SESI
     ============================================================ */
  function startSession(role) {
    const actualRole = role === 'hotseat' ? 'hotseat' : role;
    runtime.ctx = {
      poQty: 0,
      poUnitPrice: 0,
      poNumber: '',
      doQty: 0,
      doNumber: '',
      invoiceTotal: 0,
      invoiceNumber: '',
      dpAmount: 0,
      soNumber: '',
      rfqNumber: '',
      quotationNumber: '',
      poDate: '',
      productName: (global.MATERI_DATA && MATERI_DATA.product && MATERI_DATA.product.name) || 'Arabika Gayo',
      unit: (global.MATERI_DATA && MATERI_DATA.product && MATERI_DATA.product.unit) || 'kg',
      cogsPerUnit: 235000,
      margin: 0,
    };
    runtime.log = [];
    runtime.documents = [];
    runtime.negoState = null;
    runtime.finalPrice = null;
    runtime.currentStageIndex = 0;
    runtime.startedAt = Date.now();
    runtime.selftest = false;

    if (global.Store) {
      Store.set('roleplay', {
        active: true,
        role: actualRole,
        stage: 0,
        docsCreated: [],
        docsReceived: [],
        negotiation: { asking: null, offered: null, agreed: null, rounds: [] },
        startedAt: Date.now(),
        finishedAt: null,
        score: 0,
      });
      Store.markVisited('roleplay');
      Store.log('roleplay:start', { role: actualRole });
    }

    pushLog('system', {
      icon: '🎬',
      title: t({ id: 'Simulasi dimulai', en: 'Simulation started', mix: 'Simulasi dimulai' }),
      text: t({ id: 'Peran: ' + roleLabel(actualRole), en: 'Role: ' + roleLabel(actualRole), mix: 'Role: ' + roleLabel(actualRole) }),
    });

    render();
    if (global.App) App.toast('info', '🎭 ' + t({ id: 'Sesi dimulai', en: 'Session started', mix: 'Session start' }), t({ id: 'Ikuti tahap berurutan.', en: 'Follow the stages in order.', mix: 'Ikuti tahap berurutan.' }));
  }

  function roleLabel(role) {
    if (role === 'seller') return t({ id: 'Penjual', en: 'Seller', mix: 'Seller' });
    if (role === 'buyer')  return t({ id: 'Pembeli', en: 'Buyer', mix: 'Buyer' });
    if (role === 'hotseat') return 'Hot-seat';
    return role;
  }

  /* ============================================================
     7. RENDER BOARD (panel ganda)
     ============================================================ */
  function renderBoard() {
    const rp = (global.Store && Store.get('roleplay')) || {};
    const userRole = rp.role || 'hotseat';
    const currentStage = STAGES[runtime.currentStageIndex];
    const isDone = runtime.currentStageIndex >= STAGES.length;

    const header =
      '<div class="pz-hud mb-5">' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">🎭 ' + t({ id: 'Peranmu', en: 'Your role', mix: 'Role' }) + '</span>' +
          '<span class="pz-hud__val">' + esc(roleLabel(userRole)) + '</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">🎯 ' + t({ id: 'Tahap', en: 'Stage', mix: 'Stage' }) + '</span>' +
          '<span class="pz-hud__val">' + Math.min(runtime.currentStageIndex + 1, STAGES.length) + ' / ' + STAGES.length + '</span>' +
        '</div>' +
        '<div class="pz-hud__group">' +
          '<span class="pz-hud__label">📄 ' + t({ id: 'Dokumen', en: 'Documents', mix: 'Docs' }) + '</span>' +
          '<span class="pz-hud__val">' + runtime.documents.length + '</span>' +
        '</div>' +
        '<div class="pz-hud__spacer"></div>' +
        '<button class="btn btn--sm btn--ghost" id="btnRpReset">🔄 ' + t({ id: 'Mulai Ulang', en: 'Restart', mix: 'Restart' }) + '</button>' +
        '<button class="btn btn--sm btn--danger" id="btnRpExit">✕ ' + t({ id: 'Keluar', en: 'Exit', mix: 'Exit' }) + '</button>' +
      '</div>';

    if (isDone) {
      return header + renderSummary();
    }

    return (
      header +
      '<div class="mb-4">' +
        '<div class="progress progress--thick"><div class="progress__bar" id="rpProgressBar" style="width:0%"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-3);margin-top:6px;font-weight:600">' +
          '<span id="rpProgressLabel"></span>' +
          '<span>' + STAGES.length + ' ' + t({ id: 'tahap', en: 'stages', mix: 'stages' }) + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="rp-wrap">' +
        /* Panel Seller */
        '<div class="rp-panel rp-panel--seller' + (currentStage.actor === 'seller' ? ' is-turn' : '') + '" data-panel="seller">' +
          '<div class="rp-panel__head">' +
            '<div class="rp-panel__avatar">🧑‍💼</div>' +
            '<div class="rp-panel__who">' +
              '<div class="rp-panel__role">' + t({ id: 'Penjual', en: 'Seller', mix: 'Seller' }) + '</div>' +
              '<div class="rp-panel__name">Firhan Fahamzha</div>' +
              '<div class="rp-panel__company">PT Firhan Fahamzha Global</div>' +
            '</div>' +
            '<div class="rp-panel__turn" data-turn="seller" ' + (currentStage.actor === 'seller' ? '' : 'hidden') + '>' + t({ id: 'Giliran', en: 'Turn', mix: 'Turn' }) + '</div>' +
          '</div>' +
          '<div class="rp-panel__body" id="panelSellerBody"></div>' +
        '</div>' +

        /* Panel Buyer */
        '<div class="rp-panel rp-panel--buyer' + (currentStage.actor === 'buyer' ? ' is-turn' : '') + '" data-panel="buyer">' +
          '<div class="rp-panel__head">' +
            '<div class="rp-panel__avatar">🧑‍💻</div>' +
            '<div class="rp-panel__who">' +
              '<div class="rp-panel__role">' + t({ id: 'Pembeli', en: 'Buyer', mix: 'Buyer' }) + '</div>' +
              '<div class="rp-panel__name">Nadia Prameswari</div>' +
              '<div class="rp-panel__company">Kopi Senja Group</div>' +
            '</div>' +
            '<div class="rp-panel__turn" data-turn="buyer" ' + (currentStage.actor === 'buyer' ? '' : 'hidden') + '>' + t({ id: 'Giliran', en: 'Turn', mix: 'Turn' }) + '</div>' +
          '</div>' +
          '<div class="rp-panel__body" id="panelBuyerBody"></div>' +
        '</div>' +

        /* Center status */
        '<div class="rp-center" id="rpCenter">' +
          '<span class="rp-center__msg" id="rpCenterMsg"></span>' +
        '</div>' +
      '</div>' +

      /* Dokumen + log */
      '<div class="rp-lower-grid mt-5">' +
        '<div class="card card--flat">' +
          '<div class="card__head">' +
            '<div>' +
              '<div class="card__title">📄 ' + t({ id: 'Tumpukan Dokumen', en: 'Document Stack', mix: 'Doc Stack' }) + '</div>' +
              '<div class="card__sub">' + t({ id: 'Dokumen yang sudah terbit', en: 'Documents already issued', mix: 'Docs yang sudah terbit' }) + '</div>' +
            '</div>' +
          '</div>' +
          '<div id="rpDocStack"></div>' +
        '</div>' +

        '<div class="card card--flat">' +
          '<div class="card__head">' +
            '<div>' +
              '<div class="card__title">💬 ' + t({ id: 'Log Percakapan', en: 'Conversation Log', mix: 'Log' }) + '</div>' +
              '<div class="card__sub">' + t({ id: 'Urutan kejadian', en: 'Chronological', mix: 'Urutan kejadian' }) + '</div>' +
            '</div>' +
          '</div>' +
          '<div id="rpLog" class="rp-log"></div>' +
        '</div>' +
      '</div>' +

      '<style>' +
      '.rp-lower-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-5)}' +
      '@media (max-width:900px){.rp-lower-grid{grid-template-columns:1fr}}' +
      '.rp-log{max-height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:6px}' +
      '.rp-log__item{display:flex;gap:10px;padding:10px 12px;background:var(--surface-2);border-radius:var(--r-md);border-left:3px solid var(--border-2);animation:fadeUp .35s ease both}' +
      '.rp-log__item[data-from="seller"]{border-left-color:var(--primary);background:var(--primary-soft)}' +
      '.rp-log__item[data-from="buyer"]{border-left-color:var(--teal);background:var(--teal-soft)}' +
      '.rp-log__item[data-from="system"]{border-left-color:var(--amber);background:var(--amber-soft)}' +
      '.rp-log__icon{font-size:16px;flex-shrink:0;line-height:1.3}' +
      '.rp-log__body{flex:1;min-width:0;font-size:12.5px;color:var(--text-2);line-height:1.5}' +
      '.rp-log__body b{color:var(--text);font-weight:800;font-size:13px;display:block;margin-bottom:2px}' +
      '.rp-log__time{font-size:10.5px;color:var(--text-3);font-family:var(--ff-mono)}' +
      '.rp-form{display:flex;flex-direction:column;gap:12px}' +
      '.rp-form .field{margin-bottom:0}' +
      '.rp-form__actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}' +
      '.rp-action-card{padding:var(--s-4);background:var(--bg-elev);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:10px;animation:fadeUp .3s ease both}' +
      '.rp-action-card__title{font-weight:800;font-size:14px;color:var(--text);margin-bottom:4px}' +
      '.rp-action-card__desc{font-size:12.5px;color:var(--text-2);line-height:1.5;margin-bottom:12px}' +
      '.rp-nego-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
      '@media(max-width:600px){.rp-nego-grid{grid-template-columns:1fr}}' +
      '.rp-doc-pill{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--bg-elev);margin-bottom:8px;cursor:pointer;transition:all .15s}' +
      '.rp-doc-pill:hover{border-color:var(--primary);background:var(--primary-soft);transform:translateX(3px)}' +
      '.rp-doc-pill__icon{font-size:20px}' +
      '.rp-doc-pill__body{flex:1;min-width:0}' +
      '.rp-doc-pill__name{font-size:12.5px;font-weight:800;color:var(--text)}' +
      '.rp-doc-pill__num{font-size:11px;color:var(--primary-2);font-family:var(--ff-mono);margin-top:2px}' +
      '</style>'
    );
  }

  function bindBoard() {
    const btnReset = document.getElementById('btnRpReset');
    if (btnReset) btnReset.addEventListener('click', confirmRestart);
    const btnExit = document.getElementById('btnRpExit');
    if (btnExit) btnExit.addEventListener('click', confirmExit);

    // Event delegation untuk form submit di dalam panel
    document.addEventListener('submit', handleFormSubmit);
  }

  function handleFormSubmit(e) {
    if (!e.target || !e.target.classList.contains('rp-form')) return;
    e.preventDefault();
    const formId = e.target.dataset.formId;
    const stage = STAGES[runtime.currentStageIndex];
    if (!stage || stage.id !== formId) return;
    submitStageForm(stage, e.target);
  }

  /* ============================================================
     8. RENDER PANEL
     ============================================================ */
  function renderPanel(which) {
    const el = document.getElementById('panel' + (which === 'seller' ? 'Seller' : 'Buyer') + 'Body');
    if (!el) return;

    const stage = STAGES[runtime.currentStageIndex];
    if (!stage || stage.actor !== which) {
      el.innerHTML = renderWaiting(which, stage);
      return;
    }

    // Special handlers
    if (stage.special === 'negotiation') {
      el.innerHTML = renderNegotiationPanel();
      bindNegotiation();
      return;
    }
    if (stage.special === 'final-decision') {
      el.innerHTML = renderFinalDecisionPanel();
      bindFinalDecision();
      return;
    }

    // Regular form
    el.innerHTML = renderForm(stage);
    bindForm(stage);
  }

  function renderWaiting(which, stage) {
    const otherRole = which === 'seller' ? 'Pembeli' : 'Penjual';
    return (
      '<div class="rp-wait">' +
        '<div class="rp-wait__icon">⏳</div>' +
        '<div class="rp-wait__title">' + t({ id: 'Menunggu ' + otherRole, en: 'Waiting for ' + otherRole, mix: 'Menunggu ' + otherRole }) + '</div>' +
        '<div class="rp-wait__desc">' +
          (stage
            ? t({ id: 'Pihak lain sedang menjalankan tahap: ', en: 'Other side is on stage: ', mix: 'Pihak lain di tahap: ' }) + '<b>' + esc(t(stage.title)) + '</b>'
            : '') +
        '</div>' +
      '</div>' +
      '<style>' +
      '.rp-wait{padding:var(--s-6);text-align:center;color:var(--text-3)}' +
      '.rp-wait__icon{font-size:42px;margin-bottom:12px;opacity:.5}' +
      '.rp-wait__title{font-size:14px;font-weight:800;color:var(--text-2);margin-bottom:6px}' +
      '.rp-wait__desc{font-size:12.5px;line-height:1.6;max-width:320px;margin:0 auto}' +
      '</style>'
    );
  }

  function renderForm(stage) {
    return (
      '<div class="rp-action-card">' +
        '<div class="rp-action-card__title">' + stage.icon + ' ' + esc(t(stage.title)) + '</div>' +
        '<div class="rp-action-card__desc">' + esc(t(stage.desc)) + '</div>' +
      '</div>' +
      '<form class="rp-form" data-form-id="' + stage.id + '" novalidate>' +
        stage.form.map(f => renderField(f)).join('') +
        '<div class="rp-form__actions">' +
          '<button type="submit" class="btn btn--primary">' + stage.icon + ' ' + t({ id: 'Kirim Dokumen', en: 'Submit Document', mix: 'Kirim' }) + '</button>' +
        '</div>' +
      '</form>'
    );
  }

  function renderField(f) {
    const id = 'rp_' + f.key;
    const defaultVal = f.default !== undefined && f.default !== '' ? f.default : (f.type === 'date' ? daysFromNow(14) : '');
    const hint = f.hint ? '<span class="field__hint">' + esc(t(f.hint)) + '</span>' : '';

    let input = '';
    if (f.type === 'textarea') {
      input = '<textarea id="' + id + '" name="' + f.key + '" class="textarea" ' + (f.required ? 'required' : '') + ' rows="3">' + esc(defaultVal) + '</textarea>';
    } else if (f.type === 'select') {
      input = '<select id="' + id + '" name="' + f.key + '" class="select" ' + (f.required ? 'required' : '') + '>' +
        (f.options || []).map(o => {
          const sel = o.v === f.default ? ' selected' : '';
          return '<option value="' + esc(o.v) + '"' + sel + '>' + esc(t(o.t)) + '</option>';
        }).join('') +
      '</select>';
    } else if (f.type === 'number') {
      input = '<div class="input-group">' +
        '<input type="number" id="' + id + '" name="' + f.key + '" class="input" ' +
          'min="' + (f.min != null ? f.min : '') + '" max="' + (f.max != null ? f.max : '') + '" ' +
          'step="' + (f.step || 'any') + '" value="' + esc(defaultVal) + '" ' +
          (f.required ? 'required' : '') + '>' +
        (f.key === 'unitPrice' || f.key === 'targetPrice' || f.key === 'paidAmount' ? '<span class="input-group__suffix">Rp</span>' : '') +
      '</div>';
    } else if (f.type === 'date') {
      input = '<input type="date" id="' + id + '" name="' + f.key + '" class="input" value="' + esc(defaultVal) + '" ' + (f.required ? 'required' : '') + '>';
    } else {
      input = '<input type="text" id="' + id + '" name="' + f.key + '" class="input" value="' + esc(defaultVal) + '" ' + (f.required ? 'required' : '') + '>';
    }

    return (
      '<div class="field" data-field="' + f.key + '">' +
        '<label class="field__label" for="' + id + '">' +
          esc(t(f.label)) + (f.required ? '<span class="req">*</span>' : '') + hint +
        '</label>' +
        input +
        '<div class="field__error" data-error-for="' + f.key + '" hidden></div>' +
      '</div>'
    );
  }

  function bindForm(stage) {
    const form = document.querySelector('.rp-form[data-form-id="' + stage.id + '"]');
    if (!form) return;

    // Live validation feedback
    form.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => clearFieldError(stage.id, input.name));
      input.addEventListener('change', () => clearFieldError(stage.id, input.name));
    });
  }

  function showFieldError(stageId, key, msg) {
    const errEl = document.querySelector('[data-error-for="' + key + '"]');
    const input = document.querySelector('.rp-form[data-form-id="' + stageId + '"] [name="' + key + '"]');
    if (errEl) {
      errEl.textContent = t(msg);
      errEl.hidden = false;
    }
    if (input) {
      input.classList.add('is-invalid');
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
    }
  }
  function clearFieldError(stageId, key) {
    const errEl = document.querySelector('[data-error-for="' + key + '"]');
    const input = document.querySelector('.rp-form[data-form-id="' + stageId + '"] [name="' + key + '"]');
    if (errEl) errEl.hidden = true;
    if (input) input.classList.remove('is-invalid');
  }

  /* ============================================================
     9. SUBMIT STAGE FORM
     ============================================================ */
  function submitStageForm(stage, formEl) {
    const data = {};
    let ok = true;
    let firstErrKey = null;

    // Baca semua field
    Array.from(formEl.elements).forEach(el => {
      if (!el.name) return;
      data[el.name] = el.type === 'number' ? Number(el.value || 0) : el.value;
    });

    // Validasi required
    for (const f of stage.form) {
      if (f.required) {
        const v = data[f.key];
        if (v === '' || v == null || (f.type === 'number' && (isNaN(v) || v <= 0))) {
          showFieldError(stage.id, f.key, { id: 'Wajib diisi', en: 'Required', mix: 'Wajib' });
          ok = false;
          if (!firstErrKey) firstErrKey = f.key;
        }
      }
    }
    if (!ok) {
      scrollToFirstError(firstErrKey);
      return;
    }

    // Validasi custom
    let warnings = [];
    if (stage.validation) {
      for (const [key, fn] of Object.entries(stage.validation)) {
        const result = fn(data[key], data, runtime.ctx);
        if (result && result.ok === false) {
          showFieldError(stage.id, key, result.msg);
          ok = false;
          if (!firstErrKey) firstErrKey = key;
        } else if (result && result.warn) {
          warnings.push(result.warn);
        }
      }
    }
    if (!ok) {
      scrollToFirstError(firstErrKey);
      return;
    }

    // OK → proses dokumen
    processStage(stage, data, warnings);
  }

  function scrollToFirstError(key) {
    const el = document.querySelector('[data-field="' + key + '"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ============================================================
     10. PROSES DOKUMEN
     ============================================================ */
  function processStage(stage, data, warnings) {
    const actor = stage.actor;
    const stageId = stage.id;

    // Ambil nomor dokumen dari Store
    let docNumber = '';
    let docTitle = '';
    let docFields = [];
    let score = 0;
    let logText = '';

    const dataMateri = (global.MATERI_DATA) || {};
    const seller = (dataMateri.company && dataMateri.company.seller) || { name: 'PT Firhan Fahamzha Global', director: 'Firhan Fahamzha' };
    const buyer  = (dataMateri.company && dataMateri.company.buyer)  || { name: 'Kopi Senja Group', manager: 'Nadia Prameswari' };

    /* ---------- RFQ ---------- */
    if (stageId === 'rfq') {
      docNumber = Store.nextDocNumber('RFQ');
      runtime.ctx.rfqNumber = docNumber;
      runtime.ctx.poQty = data.qty;
      runtime.ctx.buyerTarget = data.targetPrice;
      docTitle = 'RFQ (Request for Quotation)';
      docFields = [
        { k: 'Dari', v: buyer.name },
        { k: 'Kepada', v: seller.name },
        { k: 'Volume', v: data.qty + ' ' + runtime.ctx.unit },
        { k: 'Target Harga', v: fmtIDR(data.targetPrice) + ' / ' + runtime.ctx.unit },
        { k: 'Deadline', v: fmtDate(data.deadline) },
        { k: 'Catatan', v: data.notes || '—' },
      ];
      logText = t({ id: 'Pembeli mengirim RFQ untuk ' + data.qty + ' ' + runtime.ctx.unit, en: 'Buyer sent RFQ for ' + data.qty + ' ' + runtime.ctx.unit, mix: 'Buyer kirim RFQ ' + data.qty + ' ' + runtime.ctx.unit });
      score = 15;
    }

    /* ---------- Quotation ---------- */
    else if (stageId === 'quotation') {
      docNumber = Store.nextDocNumber('QUO');
      runtime.ctx.quotationNumber = docNumber;
      const qty = runtime.ctx.poQty;
      const subtotal = qty * data.unitPrice;
      const ppn = subtotal * 0.11;
      const total = subtotal + ppn;
      runtime.ctx.quotationTotal = total;
      runtime.ctx.quotationUnitPrice = data.unitPrice;
      runtime.ctx.poUnitPrice = data.unitPrice;
      runtime.ctx.margin = ((data.unitPrice - runtime.ctx.cogsPerUnit) / runtime.ctx.cogsPerUnit) * 100;
      docTitle = 'Quotation / Surat Penawaran';
      docFields = [
        { k: 'No. Quotation', v: docNumber },
        { k: 'Kepada', v: buyer.name },
        { k: 'Harga / ' + runtime.ctx.unit, v: fmtIDR(data.unitPrice) },
        { k: 'Qty', v: qty + ' ' + runtime.ctx.unit },
        { k: 'Subtotal', v: fmtIDR(subtotal) },
        { k: 'PPN 11%', v: fmtIDR(ppn) },
        { k: 'Grand Total', v: fmtIDR(total) },
        { k: 'Payment', v: paymentTermsLabel(data.paymentTerms) },
        { k: 'Lead Time', v: data.leadTime + ' hari' },
        { k: 'Berlaku', v: data.validity + ' hari' },
      ];
      const marginPct = runtime.ctx.margin.toFixed(1);
      logText = t({ id: 'Penjual mengirim Quotation. Harga: ' + fmtIDR(data.unitPrice) + '/' + runtime.ctx.unit + ' (margin ' + marginPct + '%)', en: 'Seller sent Quotation at ' + fmtIDR(data.unitPrice) + '/' + runtime.ctx.unit + ' (margin ' + marginPct + '%)', mix: 'Seller kirim Quotation ' + fmtIDR(data.unitPrice) + '/' + runtime.ctx.unit + ' (margin ' + marginPct + '%)' });
      score = 20;
    }

    /* ---------- PO ---------- */
    else if (stageId === 'po') {
      docNumber = Store.nextDocNumber('PO');
      runtime.ctx.poNumber = docNumber;
      runtime.ctx.poDate = data.deliveryDate;
      const qty = runtime.ctx.poQty;
      const price = runtime.finalPrice || runtime.ctx.poUnitPrice;
      const subtotal = qty * price;
      const ppn = subtotal * 0.11;
      const total = subtotal + ppn;
      runtime.ctx.poTotal = total;
      runtime.ctx.dpAmount = total * 0.3;

      docTitle = 'Purchase Order (PO)';
      docFields = [
        { k: 'No. PO', v: docNumber },
        { k: 'Ref. Quotation', v: runtime.ctx.quotationNumber || '—' },
        { k: 'Harga Sepakat', v: fmtIDR(price) + ' / ' + runtime.ctx.unit },
        { k: 'Qty', v: qty + ' ' + runtime.ctx.unit },
        { k: 'Subtotal', v: fmtIDR(subtotal) },
        { k: 'PPN 11%', v: fmtIDR(ppn) },
        { k: 'Total', v: fmtIDR(total) },
        { k: 'Kirim ke', v: data.shipTo },
        { k: 'Tgl Kirim', v: fmtDate(data.deliveryDate) },
        { k: 'PIC', v: data.pic },
      ];
      logText = t({ id: 'Pembeli menerbitkan PO resmi senilai ' + fmtIDR(total), en: 'Buyer issued PO worth ' + fmtIDR(total), mix: 'Buyer terbitkan PO ' + fmtIDR(total) });
      score = 20;
    }

    /* ---------- SO ---------- */
    else if (stageId === 'so') {
      docNumber = Store.nextDocNumber('SO');
      runtime.ctx.soNumber = docNumber;
      docTitle = 'Sales Order (Internal)';
      docFields = [
        { k: 'No. SO', v: docNumber },
        { k: 'Ref. PO', v: runtime.ctx.poNumber || '—' },
        { k: 'Gudang', v: data.warehouse },
        { k: 'Picking Date', v: fmtDate(data.pickingDate) },
        { k: 'Sales Owner', v: data.salesOwner },
        { k: 'Qty Locked', v: runtime.ctx.poQty + ' ' + runtime.ctx.unit },
      ];
      logText = t({ id: 'Penjual mengunci stok di ERP: SO ' + docNumber, en: 'Seller locked stock in ERP: SO ' + docNumber, mix: 'Seller lock stok di ERP: ' + docNumber });
      score = 10;
    }

    /* ---------- DO ---------- */
    else if (stageId === 'do') {
      docNumber = Store.nextDocNumber('DO');
      runtime.ctx.doNumber = docNumber;
      runtime.ctx.doQty = runtime.ctx.poQty;
      docTitle = 'Delivery Order / Surat Jalan';
      docFields = [
        { k: 'No. DO', v: docNumber },
        { k: 'Ref. PO', v: runtime.ctx.poNumber || '—' },
        { k: 'Qty', v: runtime.ctx.poQty + ' ' + runtime.ctx.unit },
        { k: 'Driver', v: data.driver },
        { k: 'Kendaraan', v: data.vehicle },
        { k: 'ETA', v: fmtDate(data.eta) },
        { k: 'No. Segel', v: data.sealNumber },
      ];
      logText = t({ id: 'Penjual menerbitkan Surat Jalan ' + docNumber, en: 'Seller issued Delivery Order ' + docNumber, mix: 'Seller terbitkan DO ' + docNumber });
      score = 10;
    }

    /* ---------- POD ---------- */
    else if (stageId === 'pod') {
      docNumber = Store.nextDocNumber('POD');
      runtime.ctx.podNumber = docNumber;
      runtime.ctx.receivedQty = data.receivedQty;
      docTitle = 'Proof of Delivery (POD)';
      docFields = [
        { k: 'No. POD', v: docNumber },
        { k: 'Ref. DO', v: runtime.ctx.doNumber || '—' },
        { k: 'Diterima Oleh', v: data.receivedBy },
        { k: 'Qty Diterima', v: data.receivedQty + ' ' + runtime.ctx.unit },
        { k: 'Kondisi', v: data.condition === 'good' ? '✅ Baik' : data.condition === 'minor' ? '⚠️ Minor' : '❌ Rusak' },
        { k: 'Catatan', v: data.notes || '—' },
      ];
      logText = t({ id: 'Pembeli mengonfirmasi penerimaan ' + data.receivedQty + ' ' + runtime.ctx.unit, en: 'Buyer confirmed receipt of ' + data.receivedQty + ' ' + runtime.ctx.unit, mix: 'Buyer konfirmasi terima ' + data.receivedQty + ' ' + runtime.ctx.unit });
      score = 10;
    }

    /* ---------- Invoice ---------- */
    else if (stageId === 'invoice') {
      docNumber = Store.nextDocNumber('INV');
      runtime.ctx.invoiceNumber = docNumber;
      const price = runtime.finalPrice || runtime.ctx.poUnitPrice;
      const qty = runtime.ctx.receivedQty || runtime.ctx.poQty;
      const subtotal = qty * price;
      const deductDP = data.deductDP === 'yes' ? runtime.ctx.dpAmount : 0;
      const base = subtotal - deductDP;
      const vat = base * (data.vatRate / 100);
      const total = base + vat;
      runtime.ctx.invoiceTotal = total;

      docTitle = 'Invoice / Faktur Penjualan';
      docFields = [
        { k: 'No. Invoice', v: docNumber },
        { k: 'Ref. PO', v: runtime.ctx.poNumber || '—' },
        { k: 'Ref. DO/POD', v: (runtime.ctx.doNumber || '—') + ' / POD' },
        { k: 'Qty', v: qty + ' ' + runtime.ctx.unit },
        { k: 'Harga', v: fmtIDR(price) + ' / ' + runtime.ctx.unit },
        { k: 'Subtotal', v: fmtIDR(subtotal) },
        { k: 'Kurangi DP', v: '− ' + fmtIDR(deductDP) },
        { k: 'Dasar PPN', v: fmtIDR(base) },
        { k: 'PPN ' + data.vatRate + '%', v: fmtIDR(vat) },
        { k: 'Total Tagihan', v: fmtIDR(total) },
        { k: 'Jatuh Tempo', v: fmtDate(data.dueDate) },
      ];
      logText = t({ id: 'Penjual menerbitkan Invoice senilai ' + fmtIDR(total), en: 'Seller issued Invoice for ' + fmtIDR(total), mix: 'Seller terbitkan Invoice ' + fmtIDR(total) });
      score = 15;
    }

    /* ---------- Remittance ---------- */
    else if (stageId === 'remittance') {
      docNumber = Store.nextDocNumber('RMA') || ('RM/' + new Date().getFullYear() + '/0001');
      docTitle = 'Remittance Advice + Bukti Transfer';
      docFields = [
        { k: 'No. Remittance', v: 'RM/KSG/' + new Date().getFullYear() + '/0001' },
        { k: 'Invoice Dibayar', v: runtime.ctx.invoiceNumber || '—' },
        { k: 'Jumlah Transfer', v: fmtIDR(data.paidAmount) },
        { k: 'Bank', v: data.bank },
        { k: 'Berita', v: data.ref || '—' },
        { k: 'Tanggal', v: fmtDate(new Date()) },
        { k: 'Status', v: '✅ Piutang ditutup' },
      ];
      logText = t({ id: 'Pembeli transfer ' + fmtIDR(data.paidAmount) + ' — piutang lunas', en: 'Buyer transferred ' + fmtIDR(data.paidAmount) + ' — receivable closed', mix: 'Buyer transfer ' + fmtIDR(data.paidAmount) + ' — piutang lunas' });
      score = 15;
    }

    // Simpan ke runtime & log
    const doc = {
      id: stageId,
      number: docNumber,
      title: docTitle,
      actor,
      fields: docFields,
      timestamp: Date.now(),
      stage: runtime.currentStageIndex,
    };
    runtime.documents.push(doc);

    pushLog(actor, {
      icon: stage.icon,
      title: docTitle,
      text: logText,
      docNumber,
    });

    // Skor
    if (score > 0 && global.Store) {
      Store.addScore(score, 'roleplay', 'Stage: ' + stageId);
      const rp = Store.get('roleplay') || {};
      rp.score = (rp.score || 0) + score;
      if (actor === 'seller') rp.docsCreated = (rp.docsCreated || []).concat([docNumber]);
      else rp.docsReceived = (rp.docsReceived || []).concat([docNumber]);
      Store.set('roleplay', rp);
    }

    // Toast
    if (warnings.length && global.App) {
      App.toast('warn', t({ id: 'Tersimpan dengan peringatan', en: 'Saved with warning', mix: 'Saved (warning)' }), t(warnings[0]));
    } else if (global.App) {
      App.toast('ok', t({ id: 'Dokumen terbit', en: 'Document issued', mix: 'Doc issued' }), docNumber);
    }

    // Advance
    advanceStage();
  }

  function paymentTermsLabel(v) {
    const map = {
      DP30_NET30: t({ id: 'DP 30% · Sisa NET 30', en: 'DP 30% · NET 30 balance', mix: 'DP 30% + NET 30' }),
      NET30: 'NET 30',
      NET45: 'NET 45',
      COD: 'Cash on Delivery',
    };
    return map[v] || v;
  }

  /* ============================================================
     11. NEGOSIASI (Stage 3: Review)
     ============================================================ */
  function renderNegotiationPanel() {
    const ctx = runtime.ctx;
    const currentPrice = runtime.ctx.quotationUnitPrice || 0;
    const target = ctx.buyerTarget || 0;

    return (
      '<div class="rp-action-card">' +
        '<div class="rp-action-card__title">🤔 Review Penawaran</div>' +
        '<div class="rp-action-card__desc">' + t({ id: 'Penjual menawarkan harga tertentu. Kamu bisa terima, atau minta diskon.', en: 'Seller offered a price. You can accept or ask for a discount.', mix: 'Penjual kasih harga. Kamu bisa terima atau minta diskon.' }) + '</div>' +
      '</div>' +

      '<div class="nego-box">' +
        '<div class="nego-box__title">💬 ' + t({ id: 'Penawaran Saat Ini', en: 'Current Offer', mix: 'Penawaran' }) + '</div>' +
        '<div class="nego-box__price"><b>' + fmtIDR(currentPrice) + '</b><s>/ ' + runtime.ctx.unit + '</s></div>' +
        '<div style="font-size:12px;color:var(--text-3)">' +
          t({ id: 'Target kamu: ', en: 'Your target: ', mix: 'Target kamu: ' }) + fmtIDR(target) +
        '</div>' +
      '</div>' +

      '<div class="rp-nego-grid">' +
        '<button class="btn btn--green btn--block" data-nego-action="accept">✅ ' + t({ id: 'Terima Harga', en: 'Accept Price', mix: 'Terima Harga' }) + '</button>' +
        '<button class="btn btn--amber btn--block" data-nego-action="ask">💬 ' + t({ id: 'Minta Diskon', en: 'Ask for Discount', mix: 'Minta Diskon' }) + '</button>' +
      '</div>' +

      '<div id="negoAskBox" class="mt-3" hidden>' +
        '<div class="field">' +
          '<label class="field__label">' + t({ id: 'Harga yang Diminta (Rp)', en: 'Requested Price (IDR)', mix: 'Harga Diminta (Rp)' }) + '</label>' +
          '<div class="input-group">' +
            '<input type="number" id="negoPrice" class="input" value="' + Math.max(target, Math.round(currentPrice * 0.92)) + '">' +
            '<span class="input-group__suffix">Rp</span>' +
          '</div>' +
          '<div class="field__help">' + t({ id: 'Rekomendasi: 8% di bawah harga penjual', en: 'Recommended: 8% below seller price', mix: 'Rekomendasi: 8% di bawah harga penjual' }) + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label class="field__label">' + t({ id: 'Alasan', en: 'Reason', mix: 'Alasan' }) + '</label>' +
          '<select id="negoReason" class="select">' +
            '<option value="volume">' + t({ id: 'Volume besar', en: 'Large volume', mix: 'Volume besar' }) + '</option>' +
            '<option value="contract">' + t({ id: 'Kontrak jangka panjang', en: 'Long-term contract', mix: 'Kontrak panjang' }) + '</option>' +
            '<option value="competitor">' + t({ id: 'Ada penawaran pesaing', en: 'Competitor offer', mix: 'Ada penawaran pesaing' }) + '</option>' +
            '<option value="budget">' + t({ id: 'Anggaran terbatas', en: 'Budget constraint', mix: 'Budget terbatas' }) + '</option>' +
          '</select>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px">' +
          '<button class="btn btn--ghost" data-nego-action="cancel">' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>' +
          '<button class="btn btn--amber" data-nego-action="send">📨 ' + t({ id: 'Kirim Permintaan', en: 'Send Request', mix: 'Kirim Permintaan' }) + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function bindNegotiation() {
    $$('[data-nego-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.negoAction;
        if (action === 'accept') {
          runtime.finalPrice = runtime.ctx.quotationUnitPrice;
          pushLog('buyer', {
            icon: '✅',
            title: t({ id: 'Menerima Penawaran', en: 'Accepted Offer', mix: 'Terima Harga' }),
            text: t({ id: 'Pembeli menerima harga ' + fmtIDR(runtime.ctx.quotationUnitPrice) + '/' + runtime.ctx.unit, en: 'Buyer accepted price ' + fmtIDR(runtime.ctx.quotationUnitPrice) + '/' + runtime.ctx.unit, mix: 'Buyer terima harga ' + fmtIDR(runtime.ctx.quotationUnitPrice) }),
          });
          if (global.Store) {
            const rp = Store.get('roleplay') || {};
            rp.negotiation = rp.negotiation || {};
            rp.negotiation.agreed = runtime.ctx.quotationUnitPrice;
            Store.set('roleplay', rp);
          }
          Store.addScore(10, 'roleplay', 'Deal tanpa nego');
          advanceStage();
        } else if (action === 'ask') {
          const box = document.getElementById('negoAskBox');
          if (box) box.hidden = false;
        } else if (action === 'cancel') {
          const box = document.getElementById('negoAskBox');
          if (box) box.hidden = true;
        } else if (action === 'send') {
          const price = Number(document.getElementById('negoPrice').value || 0);
          const reason = document.getElementById('negoReason').value;
          if (!price || price <= 0) {
            if (global.App) App.toast('bad', t({ id: 'Harga tidak valid', en: 'Invalid price', mix: 'Harga invalid' }));
            return;
          }
          if (price >= runtime.ctx.quotationUnitPrice) {
            if (global.App) App.toast('warn', t({ id: 'Harga harus lebih rendah', en: 'Price must be lower', mix: 'Harga harus lebih rendah' }));
            return;
          }
          runtime.negoState = {
            original: runtime.ctx.quotationUnitPrice,
            asking: price,
            reason,
            response: null,
          };
          if (global.Store) {
            const rp = Store.get('roleplay') || {};
            rp.negotiation = rp.negotiation || { rounds: [] };
            rp.negotiation.asking = price;
            rp.negotiation.rounds = (rp.negotiation.rounds || []).concat([{
              t: Date.now(),
              original: runtime.ctx.quotationUnitPrice,
              asking: price,
              reason,
            }]);
            Store.set('roleplay', rp);
          }
          pushLog('buyer', {
            icon: '💬',
            title: t({ id: 'Permintaan Diskon', en: 'Discount Request', mix: 'Minta Diskon' }),
            text: t({ id: 'Pembeli minta harga ' + fmtIDR(price) + '/' + runtime.ctx.unit + ' (' + reason + '). Dari ' + fmtIDR(runtime.ctx.quotationUnitPrice) + '.', en: 'Buyer asks ' + fmtIDR(price) + '/' + runtime.ctx.unit + ' (' + reason + '). From ' + fmtIDR(runtime.ctx.quotationUnitPrice) + '.', mix: 'Buyer minta ' + fmtIDR(price) + '/' + runtime.ctx.unit + ' (' + reason + '). Dari ' + fmtIDR(runtime.ctx.quotationUnitPrice) + '.' }),
          });
          Store.addScore(5, 'roleplay', 'Berhasil minta nego');
          advanceStage();
        }
      });
    });
  }

  /* ============================================================
     12. FINAL DECISION (Stage 4)
     ============================================================ */
  function renderFinalDecisionPanel() {
    const ns = runtime.negoState || { asking: runtime.ctx.quotationUnitPrice, original: runtime.ctx.quotationUnitPrice };
    const original = ns.original || runtime.ctx.quotationUnitPrice;
    const asking = ns.asking || original;
    const diffPct = ((original - asking) / original) * 100;
    const cogs = runtime.ctx.cogsPerUnit;
    const newMargin = ((asking - cogs) / cogs) * 100;
    const marginWarn = newMargin < 12;

    return (
      '<div class="rp-action-card">' +
        '<div class="rp-action-card__title">📩 Permintaan Pembeli</div>' +
        '<div class="rp-action-card__desc">' + t({ id: 'Pembeli meminta harga lebih rendah. Putuskan.', en: 'Buyer requests a lower price. Decide.', mix: 'Buyer minta harga lebih rendah. Putuskan.' }) + '</div>' +
      '</div>' +

      '<div class="nego-box">' +
        '<div class="nego-box__title">💬 ' + t({ id: 'Permintaan', en: 'Request', mix: 'Permintaan' }) + '</div>' +
        '<div class="nego-box__price">' +
          '<b>' + fmtIDR(asking) + '</b>' +
          '<s>' + fmtIDR(original) + '</s>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--text-2);margin-top:6px">' +
          '📉 ' + t({ id: 'Diskon diminta: ', en: 'Requested discount: ', mix: 'Diskon diminta: ' }) +
          diffPct.toFixed(1) + '%' +
        '</div>' +
        '<div style="font-size:12px;color:' + (marginWarn ? 'var(--red)' : 'var(--green)') + ';margin-top:4px;font-weight:700">' +
          '📊 ' + t({ id: 'Margin baru: ', en: 'New margin: ', mix: 'Margin baru: ' }) +
          newMargin.toFixed(1) + '%' +
          (marginWarn ? ' ⚠️' : ' ✅') +
        '</div>' +
      '</div>' +

      '<div class="rp-nego-grid">' +
        '<button class="btn btn--green btn--block" data-final-action="accept">✅ ' + t({ id: 'Terima Permintaan', en: 'Accept Request', mix: 'Terima' }) + '</button>' +
        '<button class="btn btn--danger btn--block" data-final-action="reject">❌ ' + t({ id: 'Tolak (pertahankan harga)', en: 'Reject (hold price)', mix: 'Tolak' }) + '</button>' +
      '</div>' +

      '<div id="counterBox" class="mt-3" hidden>' +
        '<div class="field">' +
          '<label class="field__label">' + t({ id: 'Harga Counter (Rp)', en: 'Counter Price (IDR)', mix: 'Counter Price' }) + '</label>' +
          '<div class="input-group">' +
            '<input type="number" id="counterPrice" class="input" value="' + Math.round((original + asking) / 2) + '">' +
            '<span class="input-group__suffix">Rp</span>' +
          '</div>' +
          '<div class="field__help">' + t({ id: 'Harga tengah — kompromi', en: 'Middle ground — compromise', mix: 'Harga tengah — kompromi' }) + '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px">' +
          '<button class="btn btn--ghost" data-final-action="cancel-counter">' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>' +
          '<button class="btn btn--amber" data-final-action="send-counter">📨 ' + t({ id: 'Kirim Counter', en: 'Send Counter', mix: 'Kirim Counter' }) + '</button>' +
        '</div>' +
      '</div>' +

      '<button class="btn btn--ghost btn--block mt-3" data-final-action="counter">💬 ' + t({ id: 'Ajukan Harga Counter', en: 'Offer Counter Price', mix: 'Counter Price' }) + '</button>'
    );
  }

  function bindFinalDecision() {
    $$('[data-final-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.finalAction;
        const ns = runtime.negoState || {};
        const asking = ns.asking || runtime.ctx.quotationUnitPrice;
        const original = ns.original || runtime.ctx.quotationUnitPrice;

        if (action === 'accept') {
          runtime.finalPrice = asking;
          pushLog('seller', {
            icon: '✅',
            title: t({ id: 'Menerima Permintaan Diskon', en: 'Accepted Discount Request', mix: 'Terima Diskon' }),
            text: t({ id: 'Penjual menyetujui harga ' + fmtIDR(asking) + '/' + runtime.ctx.unit, en: 'Seller agreed at ' + fmtIDR(asking) + '/' + runtime.ctx.unit, mix: 'Seller setuju ' + fmtIDR(asking) + '/' + runtime.ctx.unit }),
          });
          Store.addScore(15, 'roleplay', 'Nego selesai');
          advanceStage();
        } else if (action === 'reject') {
          runtime.finalPrice = original;
          pushLog('seller', {
            icon: '❌',
            title: t({ id: 'Menolak Permintaan', en: 'Rejected Request', mix: 'Tolak' }),
            text: t({ id: 'Penjual mempertahankan harga ' + fmtIDR(original) + '/' + runtime.ctx.unit, en: 'Seller holds at ' + fmtIDR(original) + '/' + runtime.ctx.unit, mix: 'Seller pertahankan ' + fmtIDR(original) + '/' + runtime.ctx.unit }),
          });
          Store.addScore(5, 'roleplay', 'Tolak nego');
          advanceStage();
        } else if (action === 'counter') {
          const box = document.getElementById('counterBox');
          if (box) box.hidden = false;
        } else if (action === 'cancel-counter') {
          const box = document.getElementById('counterBox');
          if (box) box.hidden = true;
        } else if (action === 'send-counter') {
          const v = Number(document.getElementById('counterPrice').value || 0);
          if (!v || v <= asking || v >= original) {
            if (global.App) App.toast('warn', t({ id: 'Harga counter harus di antara permintaan & penawaran', en: 'Counter must be between request & offer', mix: 'Counter harus di antara' }));
            return;
          }
          runtime.finalPrice = v;
          pushLog('seller', {
            icon: '💬',
            title: t({ id: 'Counter Offer', en: 'Counter Offer', mix: 'Counter Offer' }),
            text: t({ id: 'Penjual menawarkan harga tengah ' + fmtIDR(v) + '/' + runtime.ctx.unit, en: 'Seller counters at ' + fmtIDR(v) + '/' + runtime.ctx.unit, mix: 'Seller counter ' + fmtIDR(v) + '/' + runtime.ctx.unit }),
          });
          Store.addScore(10, 'roleplay', 'Counter offer');
          advanceStage();
        }
      });
    });
  }

  /* ============================================================
     13. ADVANCE STAGE
     ============================================================ */
  function advanceStage() {
    runtime.currentStageIndex += 1;

    // Update Store
    if (global.Store) {
      const rp = Store.get('roleplay') || {};
      rp.stage = runtime.currentStageIndex;
      Store.set('roleplay', rp);
    }

    if (runtime.currentStageIndex >= STAGES.length) {
      finishSession();
      return;
    }

    render();

    // Toast giliran
    const next = STAGES[runtime.currentStageIndex];
    const rp = (global.Store && Store.get('roleplay')) || {};
    const userRole = rp.role;
    const isMyTurn = userRole === 'hotseat' || userRole === next.actor;
    if (global.App) {
      App.toast(isMyTurn ? 'info' : 'warn',
        '🎯 ' + t({ id: 'Tahap Berikutnya', en: 'Next Stage', mix: 'Tahap Berikut' }),
        (next.actor === 'seller' ? '🧑‍💼 ' : '🧑‍💻 ') + t(next.title));
    }
  }

  /* ============================================================
     14. FINISH
     ============================================================ */
  function finishSession() {
    if (global.Store) {
      const rp = Store.get('roleplay') || {};
      rp.finishedAt = Date.now();
      rp.finished = true;
      Store.set('roleplay', rp);
      Store.markDone('roleplay');
      Store.log('roleplay:finish', { docs: runtime.documents.length });
      Store.unlockBadge('roleplay_closer');
      Store.addScore(25, 'roleplay', 'Selesai semua tahap');
    }
    pushLog('system', {
      icon: '🏆',
      title: t({ id: 'Transaksi Selesai', en: 'Transaction Complete', mix: 'Transaksi Selesai' }),
      text: t({ id: 'Semua dokumen sudah terbit. Piutang tertutup.', en: 'All documents issued. Receivable closed.', mix: 'Semua dokumen terbit. Piutang tertutup.' }),
    });
    render();
    if (global.App) {
      App.confetti({ count: 120, duration: 3.2 });
      App.toast('trophy', '🎉 ' + t({ id: 'Selamat!', en: 'Congrats!', mix: 'Selamat!' }), t({ id: 'Kamu menyelesaikan seluruh siklus Order-to-Cash.', en: 'You completed the full Order-to-Cash cycle.', mix: 'Kamu selesai seluruh siklus O2C.' }), { duration: 6000 });
    }
  }

  function renderSummary() {
    const rp = (global.Store && Store.get('roleplay')) || {};
    const score = rp.score || 0;
    const docs = runtime.documents;
    const duration = Math.round((Date.now() - (runtime.startedAt || Date.now())) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;

    return (
      '<div class="card" style="padding:var(--s-7);text-align:center;background:linear-gradient(135deg,var(--primary-soft),var(--teal-soft))">' +
        '<div style="font-size:72px;line-height:1;margin-bottom:12px">🏆</div>' +
        '<h2 style="font-size:26px;font-weight:800;margin:0 0 8px">' + t({ id: 'Transaksi Selesai!', en: 'Transaction Complete!', mix: 'Transaksi Selesai!' }) + '</h2>' +
        '<p style="font-size:14px;color:var(--text-2);margin:0 0 20px">' + t({ id: 'Kamu berhasil menjalani seluruh siklus Order-to-Cash.', en: 'You completed the full Order-to-Cash cycle.', mix: 'Kamu berhasil jalani seluruh siklus O2C.' }) + '</p>' +

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px;max-width:640px;margin-left:auto;margin-right:auto">' +
          '<div class="stat"><b style="font-size:26px;color:var(--primary)">' + docs.length + '</b><span style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;font-weight:700">' + t({ id: 'Dokumen', en: 'Documents', mix: 'Docs' }) + '</span></div>' +
          '<div class="stat"><b style="font-size:26px;color:var(--green)">+' + score + '</b><span style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;font-weight:700">' + t({ id: 'Skor', en: 'Score', mix: 'Score' }) + '</span></div>' +
          '<div class="stat"><b style="font-size:26px;color:var(--amber)">' + mins + 'm ' + secs + 's</b><span style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;font-weight:700">' + t({ id: 'Durasi', en: 'Duration', mix: 'Durasi' }) + '</span></div>' +
        '</div>' +

        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<button class="btn btn--primary" id="btnRpPlayAgain">🔄 ' + t({ id: 'Main Lagi', en: 'Play Again', mix: 'Main Lagi' }) + '</button>' +
          '<button class="btn btn--ghost" id="btnRpViewDocs">📄 ' + t({ id: 'Lihat Dokumen', en: 'View Documents', mix: 'Lihat Docs' }) + '</button>' +
          '<button class="btn btn--outline" id="btnRpToPuzzle">🧩 ' + t({ id: 'Coba Puzzle', en: 'Try Puzzle', mix: 'Coba Puzzle' }) + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="mt-5">' +
        '<h3 style="font-size:16px;font-weight:800;margin-bottom:12px">📄 ' + t({ id: 'Semua Dokumen', en: 'All Documents', mix: 'Semua Dokumen' }) + '</h3>' +
        '<div class="rp-doc-stack">' +
          docs.map((d, i) => renderDocPill(d, i)).join('') +
        '</div>' +
      '</div>'
    );
  }

  /* ============================================================
     15. LOG, DOKUMEN, STATUS
     ============================================================ */
  function pushLog(from, payload) {
    runtime.log.push({
      t: Date.now(),
      from,
      icon: payload.icon || '📌',
      title: payload.title || '',
      text: payload.text || '',
      docNumber: payload.docNumber || '',
    });
  }

  function renderLog() {
    const el = document.getElementById('rpLog');
    if (!el) return;
    if (!runtime.log.length) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:12.5px">' + t({ id: 'Belum ada aktivitas', en: 'No activity yet', mix: 'Belum ada aktivitas' }) + '</div>';
      return;
    }
    el.innerHTML = runtime.log.slice().reverse().map(item => {
      const time = new Date(item.t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return (
        '<div class="rp-log__item" data-from="' + item.from + '">' +
          '<div class="rp-log__icon">' + item.icon + '</div>' +
          '<div class="rp-log__body">' +
            '<b>' + esc(item.title) + '</b>' +
            '<div>' + esc(item.text) + '</div>' +
            (item.docNumber ? '<div style="margin-top:4px;font-family:var(--ff-mono);font-size:11px;color:var(--primary-2)">' + esc(item.docNumber) + '</div>' : '') +
            '<div class="rp-log__time">' + time + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderDocStack() {
    const el = document.getElementById('rpDocStack');
    if (!el) return;
    if (!runtime.documents.length) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:12.5px">' + t({ id: 'Belum ada dokumen', en: 'No documents yet', mix: 'Belum ada dokumen' }) + '</div>';
      return;
    }
    el.innerHTML = runtime.documents.slice().reverse().map((d, i) => renderDocPill(d, i)).join('');
    // Bind klik untuk detail
    el.querySelectorAll('[data-doc-index]').forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = Number(pill.dataset.docIndex);
        openDocModal(runtime.documents[idx]);
      });
    });
  }

  function renderDocPill(d, idx) {
    return (
      '<div class="rp-doc-pill" data-doc-index="' + idx + '">' +
        '<div class="rp-doc-pill__icon">' + (d.icon || '📄') + '</div>' +
        '<div class="rp-doc-pill__body">' +
          '<div class="rp-doc-pill__name">' + esc(d.title) + '</div>' +
          '<div class="rp-doc-pill__num">' + esc(d.number || '—') + '</div>' +
        '</div>' +
        '<span style="font-size:16px;color:var(--text-3)">›</span>' +
      '</div>'
    );
  }

  function openDocModal(doc) {
    if (!global.App || !doc) return;
    const html =
      '<div class="rp-doc" style="position:relative">' +
        '<div class="rp-doc__stamp">ISSUED</div>' +
        '<div class="rp-doc__head">' +
          '<div class="rp-doc__type">' + esc(doc.title) + '</div>' +
          '<div class="rp-doc__num">' + esc(doc.number || '—') + '</div>' +
        '</div>' +
        doc.fields.map(f =>
          '<div class="rp-doc__row"><span>' + esc(f.k) + '</span><span>' + esc(f.v) + '</span></div>'
        ).join('') +
        '<div style="margin-top:14px;padding-top:10px;border-top:1px dashed var(--border);font-size:11px;color:var(--text-3);text-align:center;font-family:var(--ff-body)">' +
          'PT Firhan Fahamzha Global · Dokumen simulasi' +
        '</div>' +
      '</div>';

    App.openModal({
      title: doc.title,
      html,
      footer: '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Tutup', en: 'Close', mix: 'Tutup' }) + '</button>' +
              '<button class="btn btn--primary" id="btnCopyRpDoc">📋 Copy</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'btnCopyRpDoc') {
          const text = doc.title + '\n' + (doc.number || '') + '\n\n' +
            doc.fields.map(f => f.k + ': ' + f.v).join('\n');
          if (navigator.clipboard) navigator.clipboard.writeText(text);
          if (global.App) App.toast('ok', t({ id: 'Disalin', en: 'Copied', mix: 'Copied' }));
        }
      },
    });
  }

  function updateTurnIndicator() {
    const stage = STAGES[runtime.currentStageIndex];
    const msgEl = document.getElementById('rpCenterMsg');
    if (!msgEl) return;
    if (!stage) {
      msgEl.innerHTML = '🎉 ' + t({ id: 'Selesai!', en: 'Done!', mix: 'Done!' });
      return;
    }
    const actorLabel = stage.actor === 'seller' ? '🧑‍💼 Penjual' : '🧑‍💻 Pembeli';
    msgEl.innerHTML = '<b>' + actorLabel + '</b> — ' + t({ id: 'sedang menjalankan: ', en: 'currently on: ', mix: 'sedang di: ' }) + '<b>' + esc(t(stage.title)) + '</b>';
  }

  function updateProgressBar() {
    const bar = document.getElementById('rpProgressBar');
    const lbl = document.getElementById('rpProgressLabel');
    const pct = (runtime.currentStageIndex / STAGES.length) * 100;
    if (bar) bar.style.width = pct + '%';
    if (lbl) {
      const stage = STAGES[runtime.currentStageIndex];
      lbl.textContent = stage ? (stage.icon + ' ' + t(stage.title)) : '✅ Selesai';
    }
  }

  /* ============================================================
     16. RESET / EXIT
     ============================================================ */
  function confirmRestart() {
    if (!global.App) return;
    App.openModal({
      title: t({ id: 'Mulai Ulang?', en: 'Restart?', mix: 'Restart?' }),
      html: '<p style="font-size:14px;color:var(--text-2);line-height:1.6">' +
        t({ id: 'Semua dokumen & progres simulasi akan hilang. Yakin?', en: 'All documents & progress will be lost. Sure?', mix: 'Semua dokumen & progres akan hilang. Yakin?' }) +
        '</p>',
      footer:
        '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>' +
        '<button class="btn btn--danger" id="btnConfirmRestart">🔄 ' + t({ id: 'Ya, Mulai Ulang', en: 'Yes, Restart', mix: 'Ya, Restart' }) + '</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'btnConfirmRestart') {
          App.closeModal();
          if (global.Store) Store.set('roleplay.active', false);
          render();
          if (global.App) App.toast('info', t({ id: 'Direset', en: 'Reset', mix: 'Reset' }));
        }
      },
    });
  }

  function confirmExit() {
    if (!global.App) return;
    App.openModal({
      title: t({ id: 'Keluar dari Simulasi?', en: 'Exit Simulation?', mix: 'Keluar?' }),
      html: '<p style="font-size:14px;color:var(--text-2);line-height:1.6">' +
        t({ id: 'Progres akan hilang. Kamu bisa mulai lagi kapan saja.', en: 'Progress will be lost. You can restart anytime.', mix: 'Progres hilang. Bisa mulai lagi kapan saja.' }) +
        '</p>',
      footer:
        '<button class="btn btn--ghost" data-modal-close>' + t({ id: 'Batal', en: 'Cancel', mix: 'Batal' }) + '</button>' +
        '<button class="btn btn--danger" id="btnConfirmExit">✕ ' + t({ id: 'Ya, Keluar', en: 'Yes, Exit', mix: 'Ya, Keluar' }) + '</button>',
      onFooter: (a, btn) => {
        if (btn.id === 'btnConfirmExit') {
          App.closeModal();
          if (global.Store) Store.set('roleplay.active', false);
          if (global.App) App.navigate('beranda');
        }
      },
    });
  }

  /* ============================================================
     17. INIT
     ============================================================ */
  function init() {
    render();
    document.addEventListener('i18n:change', () => {
      const active = document.querySelector('.view.is-active');
      if (active && active.dataset.view === 'roleplay') render();
    });
    document.addEventListener('route:change', (e) => {
      if (e.detail && e.detail.view === 'roleplay') render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- EXPORT ---------- */
  global.Roleplay = {
    render,
    startSession,
    STAGES,
    _runtime: runtime,
  };

})(window);