/* ============================================================
   MATERI.JS — Konten 5 Tahap Order-to-Cash + 18 Dokumen
   ============================================================
   - Menyimpan data lengkap ke window.MATERI_DATA
   - Render accordion ke #materiMount
   - Render pustaka ke #libraryMount
   - Menerima event navigate:target untuk buka step tertentu
   ============================================================ */

(function (global) {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ============================================================
     1. DATA INTI
     ============================================================ */

  const COMPANY = {
    seller: {
      name: 'PT Firhan Fahamzha Global',
      short: 'FFG',
      director: 'Firhan Fahamzha',
      npwp: '01.234.567.8-901.000',
      address: 'Jl. Gatot Subroto Kav. 88, Jakarta Selatan 12710',
      phone: '+62 21 5099 8800',
      email: 'sales@firhanfahamzha.co.id',
      bank: 'Bank Mandiri — A/C 122-00-5566-7788',
    },
    buyer: {
      name: 'Kopi Senja Group',
      short: 'KSG',
      manager: 'Nadia Prameswari',
      npwp: '09.876.543.2-100.000',
      address: 'Jl. Braga No. 45, Bandung 40111',
      phone: '+62 22 4200 7700',
      email: 'procurement@kopisenja.id',
    },
  };

  const PRODUCT = {
    sku: 'FFG-ARG-500',
    name: 'Arabika Gayo Specialty Grade 1',
    variety: 'Ateng Super + Tim-Tim',
    qty: 500,
    unit: 'kg',
    pricePerKg: 285000,
    incoterms: 'FOB Medan',
    origin: 'Takengon, Aceh Tengah',
    altitude: '1.400–1.600 mdpl',
    process: 'Full-washed, sun-dried 14 hari',
    moisture: '≤ 12%',
    defect: '≤ 5% (Grade 1)',
    packaging: 'Karung goni 60 kg, food-grade liner',
    shelfLife: '12 bulan (green bean)',
    leadTime: '10–14 hari kerja dari PO',
  };

  /* ---------- 5 TAHAP ---------- */
  const STAGES = [
    /* ============ STEP 1 ============ */
    {
      id: 'step1',
      num: '01',
      icon: '📩',
      accent: '#1e5f8e',
      badge: { id: 'Quotation', en: 'Quotation', mix: 'Quotation' },
      title: { id: 'Pra-Penjualan & Penawaran', en: 'Pre-Sales & Quotation', mix: 'Pre-Sales & Quotation' },
      subtitle: {
        id: 'Inquiry → Kalkulasi → Kirim Quotation → Negosiasi',
        en: 'Inquiry → Costing → Send Quotation → Negotiation',
        mix: 'Inquiry → Costing → Kirim Quotation → Nego',
      },
      process: [
        { icon: '📩', label: { id: 'Inquiry / Lead Masuk', en: 'Inquiry / Incoming Lead', mix: 'Inquiry Masuk' } },
        { icon: '🧮', label: { id: 'Kalkulasi Harga & Margin', en: 'Price & Margin Costing', mix: 'Kalkulasi Harga' } },
        { icon: '📄', label: { id: 'Kirim Quotation Resmi', en: 'Send Official Quotation', mix: 'Kirim Quotation' } },
        { icon: '🤝', label: { id: 'Negosiasi & Revisi', en: 'Negotiation & Revision', mix: 'Nego & Revisi' } },
      ],
      intro: {
        id: 'Tahap ini menentukan apakah peluang berubah jadi pesanan. Semua hitungan margin, lead time, dan syarat pembayaran harus dikunci di sini — salah sedikit, sisa Order-to-Cash bisa berantakan.',
        en: 'This stage decides whether an opportunity becomes an order. Margin, lead time, and payment terms must be locked here — one slip can derail the rest of Order-to-Cash.',
        mix: 'Tahap ini menentukan peluang jadi order. Margin, lead time, & payment terms harus dikunci — salah dikit, sisa O2C berantakan.',
      },
      kpi: [
        { id: 'Win Rate', en: 'Win Rate', mix: 'Win Rate' },
        { id: 'Quotation-to-Order Cycle', en: 'Quotation-to-Order Cycle', mix: 'Quote-to-Order Cycle' },
        { id: 'Gross Margin %', en: 'Gross Margin %', mix: 'Gross Margin %' },
      ],
      docs: [
        /* 1 */
        {
          id: 'rfq',
          icon: '📄',
          accent: '#1e5f8e',
          name: { id: 'RFQ (Request for Quotation)', en: 'RFQ (Request for Quotation)', mix: 'RFQ' },
          type: 'inbound',
          num: 'RFQ/KSG/2025/0147',
          date: '05 Feb 2025',
          issuedBy: 'buyer',
          desc: {
            id: 'Permintaan resmi dari calon pembeli yang meminta penawaran atas produk/jasa tertentu, lengkap dengan spesifikasi, volume, dan tenggat penawaran.',
            en: 'A formal request from a prospective buyer asking for a quotation, including specs, volume, and submission deadline.',
            mix: 'Permintaan resmi dari calon buyer untuk penawaran — lengkap spesifikasi, volume, & tenggat.',
          },
          note: {
            id: 'Untuk perusahaan besar, RFQ masuk via e-Procurement atau email resmi dan wajib dicatat di CRM.',
            en: 'In large companies, RFQ arrives via e-Procurement or official email and must be logged in the CRM.',
            mix: 'Untuk perusahaan besar, RFQ masuk via e-Procurement / email resmi & wajib dicatat di CRM.',
          },
          fields: [
            { k: { id: 'Dari', en: 'From', mix: 'From' }, v: 'Kopi Senja Group' },
            { k: { id: 'Kepada', en: 'To', mix: 'To' }, v: 'PT Firhan Fahamzha Global' },
            { k: { id: 'Produk', en: 'Product', mix: 'Produk' }, v: 'Arabika Gayo Grade 1' },
            { k: { id: 'Volume', en: 'Volume', mix: 'Volume' }, v: '500 kg' },
            { k: { id: 'Batas Penawaran', en: 'Submission Deadline', mix: 'Deadline' }, v: '10 Feb 2025' },
            { k: { id: 'Kontak', en: 'Contact', mix: 'Contact' }, v: 'Nadia Prameswari — Procurement' },
          ],
          tags: ['Inbound', 'Formal', 'e-Procurement'],
        },
        /* 2 */
        {
          id: 'quotation',
          icon: '📑',
          accent: '#2a7de1',
          name: { id: 'Quotation / Surat Penawaran', en: 'Quotation / Offer Letter', mix: 'Quotation' },
          type: 'outbound',
          num: 'QUO/FFG/2025/0231',
          date: '07 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Penawaran resmi dari penjual: harga satuan, total, syarat pembayaran, masa berlaku, Incoterms, dan jadwal kirim.',
            en: 'Official offer from the seller: unit price, total, payment terms, validity, Incoterms, and delivery schedule.',
            mix: 'Penawaran resmi dari seller: harga, total, payment terms, validity, Incoterms, & jadwal kirim.',
          },
          note: {
            id: 'Nomor unik + tanda tangan otorisasi + cap perusahaan. Masa berlaku biasanya 14–30 hari.',
            en: 'Unique number + authorized signature + company stamp. Validity is usually 14–30 days.',
            mix: 'Nomor unik + ttd otorisasi + cap. Validity 14–30 hari.',
          },
          fields: [
            { k: { id: 'Nomor', en: 'Number', mix: 'No.' }, v: 'QUO/FFG/2025/0231' },
            { k: { id: 'Tanggal', en: 'Date', mix: 'Tanggal' }, v: '07 Feb 2025' },
            { k: { id: 'Berlaku s.d.', en: 'Valid Until', mix: 'Valid s.d.' }, v: '21 Feb 2025 (14 hari)' },
            { k: { id: 'Harga Satuan', en: 'Unit Price', mix: 'Harga' }, v: 'Rp 285.000 / kg' },
            { k: { id: 'Qty', en: 'Qty', mix: 'Qty' }, v: '500 kg' },
            { k: { id: 'Subtotal', en: 'Subtotal', mix: 'Subtotal' }, v: 'Rp 142.500.000' },
            { k: { id: 'PPN 11%', en: 'VAT 11%', mix: 'PPN 11%' }, v: 'Rp 15.675.000' },
            { k: { id: 'Grand Total', en: 'Grand Total', mix: 'Grand Total' }, v: 'Rp 158.175.000' },
            { k: { id: 'Incoterms', en: 'Incoterms', mix: 'Incoterms' }, v: 'FOB Medan' },
            { k: { id: 'Pembayaran', en: 'Payment Terms', mix: 'Payment' }, v: 'DP 30% / NET 30' },
            { k: { id: 'Lead Time', en: 'Lead Time', mix: 'Lead Time' }, v: '12 hari kerja' },
          ],
          tags: ['Outbound', 'Resmi', 'Berlaku 14 hari'],
        },
        /* 3 */
        {
          id: 'supporting',
          icon: '📎',
          accent: '#1d7a8c',
          name: { id: 'Supporting Documents', en: 'Supporting Documents', mix: 'Supporting Docs' },
          type: 'outbound',
          num: 'LAMP/FFG/2025/0231',
          date: '07 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Lampiran teknis: spesifikasi produk, hasil uji lab, sertifikat origin, brosur, dan studi kasus klien.',
            en: 'Technical attachments: product specs, lab test report, certificate of origin, brochures, and case studies.',
            mix: 'Lampiran teknis: spesifikasi, hasil lab, COO, brosur, & studi kasus.',
          },
          note: {
            id: 'Membantu tim procurement pembeli meyakinkan manajemen internal mereka.',
            en: 'Helps the buyer\'s procurement convince their internal management.',
            mix: 'Bantu procurement buyer meyakinkan manajemen internal.',
          },
          fields: [
            { k: { id: 'Spec Sheet', en: 'Spec Sheet', mix: 'Spec Sheet' }, v: 'Arabika Gayo Grade 1 — 2 halaman' },
            { k: { id: 'Lab Test', en: 'Lab Test', mix: 'Lab Test' }, v: 'Moisture 11,2% · Defect 3,8%' },
            { k: { id: 'COO', en: 'COO', mix: 'COO' }, v: 'Aceh Tengah — Kopi Specialty' },
            { k: { id: 'Sertifikat', en: 'Certification', mix: 'Sertifikat' }, v: 'Halal · HACCP · ISO 22000' },
            { k: { id: 'Studi Kasus', en: 'Case Study', mix: 'Case Study' }, v: '3 klien kafe besar Jakarta' },
          ],
          tags: ['Attachment', 'Teknis'],
        },
      ],
    },

    /* ============ STEP 2 ============ */
    {
      id: 'step2',
      num: '02',
      icon: '📥',
      accent: '#1d7a8c',
      badge: { id: 'Order', en: 'Order', mix: 'Order' },
      title: { id: 'Pemesanan & Kredit / Kontrak', en: 'Ordering & Credit / Contract', mix: 'Order & Credit / Contract' },
      subtitle: {
        id: 'PO → Sales Order → Credit Check → Kontrak',
        en: 'PO → Sales Order → Credit Check → Contract',
        mix: 'PO → SO → Credit Check → Contract',
      },
      process: [
        { icon: '📥', label: { id: 'Terima Purchase Order', en: 'Receive Purchase Order', mix: 'Terima PO' } },
        { icon: '🔄', label: { id: 'Konversi ke Sales Order', en: 'Convert to Sales Order', mix: 'Konversi ke SO' } },
        { icon: '🔍', label: { id: 'Credit Check & Approval', en: 'Credit Check & Approval', mix: 'Credit Check' } },
        { icon: '✍️', label: { id: 'Kontrak Penjualan', en: 'Sales Contract', mix: 'Kontrak Jual-Beli' } },
      ],
      intro: {
        id: 'Di sini komitmen lahir. PO dari pembeli harus divalidasi, dikonversi ke Sales Order di ERP, dan dicek kelayakan kreditnya sebelum stok dijanjikan.',
        en: 'This is where commitment is born. The buyer\'s PO must be validated, converted to a Sales Order in the ERP, and credit-checked before stock is promised.',
        mix: 'Di sini komitmen lahir. PO divalidasi, dikonversi ke SO di ERP, & dicek kreditnya sebelum stok dijanjikan.',
      },
      kpi: [
        { id: 'Order Accuracy', en: 'Order Accuracy', mix: 'Order Accuracy' },
        { id: 'Credit Approval Time', en: 'Credit Approval Time', mix: 'Credit Approval Time' },
        { id: 'DSO (Days Sales Outstanding)', en: 'DSO', mix: 'DSO' },
      ],
      docs: [
        /* 4 */
        {
          id: 'po',
          icon: '📥',
          accent: '#1d7a8c',
          name: { id: 'Purchase Order (PO)', en: 'Purchase Order (PO)', mix: 'Purchase Order' },
          type: 'inbound',
          num: 'PO/KSG/2025/0231',
          date: '13 Feb 2025',
          issuedBy: 'buyer',
          desc: {
            id: 'Dokumen pesanan resmi dari pembeli. Menjadi dasar hukum dan referensi tunggal yang harus dikutip di semua dokumen berikutnya.',
            en: 'Official order document from the buyer. It becomes the legal basis and single reference cited in all subsequent documents.',
            mix: 'Pesanan resmi dari buyer. Jadi dasar hukum & referensi tunggal yang harus dikutip di dokumen berikutnya.',
          },
          note: {
            id: 'Nomor PO wajib muncul di Quotation konfirmasi, Sales Order, Surat Jalan, Invoice, dan packing list.',
            en: 'The PO number must appear on the confirmation Quotation, Sales Order, Delivery Order, Invoice, and packing list.',
            mix: 'Nomor PO wajib muncul di Quotation konfirmasi, SO, DO, Invoice, & packing list.',
          },
          fields: [
            { k: { id: 'Nomor PO', en: 'PO Number', mix: 'No. PO' }, v: 'PO/KSG/2025/0231' },
            { k: { id: 'Tanggal', en: 'Date', mix: 'Tanggal' }, v: '13 Feb 2025' },
            { k: { id: 'Ref. Quotation', en: 'Ref. Quotation', mix: 'Ref. Quotation' }, v: 'QUO/FFG/2025/0231' },
            { k: { id: 'Qty', en: 'Qty', mix: 'Qty' }, v: '500 kg' },
            { k: { id: 'Harga Disepakati', en: 'Agreed Price', mix: 'Harga Sepakat' }, v: 'Rp 278.500 / kg (nego)' },
            { k: { id: 'Total + PPN', en: 'Total + VAT', mix: 'Total + PPN' }, v: 'Rp 154.567.500' },
            { k: { id: 'Termin', en: 'Terms', mix: 'Termin' }, v: 'DP 30% · Sisa NET 30' },
            { k: { id: 'Kirim ke', en: 'Ship To', mix: 'Kirim ke' }, v: 'Gudang Bandung — Jl. Braga 45' },
            { k: { id: 'Tgl Kirim', en: 'Delivery Date', mix: 'Tgl Kirim' }, v: '28 Feb 2025' },
          ],
          tags: ['Inbound', 'Legal', 'Referensi Utama'],
        },
        /* 5 */
        {
          id: 'so',
          icon: '🔄',
          accent: '#2a8e6c',
          name: { id: 'Sales Order (SO)', en: 'Sales Order (SO)', mix: 'Sales Order' },
          type: 'internal',
          num: 'SO/FFG/2025/0188',
          date: '13 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Konfirmasi internal di ERP setelah PO diterima. Mengunci stok, jadwal produksi, rute logistik, dan margin aktual.',
            en: 'Internal ERP confirmation after PO is accepted. Locks stock, production schedule, logistics route, and actual margin.',
            mix: 'Konfirmasi internal di ERP setelah PO diterima. Kunci stok, jadwal, rute, & margin aktual.',
          },
          note: {
            id: 'Sales Order tidak dikirim ke pembeli — hanya untuk internal. Jadi jembatan PO ⇄ semua dokumen operasional.',
            en: 'Sales Order is not sent to the buyer — internal only. It bridges the PO ⇄ all operational documents.',
            mix: 'SO tidak dikirim ke buyer — internal only. Jembatan PO ⇄ semua dokumen operasional.',
          },
          fields: [
            { k: { id: 'Nomor SO', en: 'SO Number', mix: 'No. SO' }, v: 'SO/FFG/2025/0188' },
            { k: { id: 'Ref. PO', en: 'Ref. PO', mix: 'Ref. PO' }, v: 'PO/KSG/2025/0231' },
            { k: { id: 'Customer', en: 'Customer', mix: 'Customer' }, v: 'Kopi Senja Group' },
            { k: { id: 'SKU', en: 'SKU', mix: 'SKU' }, v: 'FFG-ARG-500' },
            { k: { id: 'Qty Terkunci', en: 'Qty Locked', mix: 'Qty Locked' }, v: '500 kg' },
            { k: { id: 'Gudang Asal', en: 'Warehouse', mix: 'Gudang' }, v: 'WH-Takengon-01' },
            { k: { id: 'Jadwal Picking', en: 'Picking Date', mix: 'Picking' }, v: '24 Feb 2025' },
            { k: { id: 'Total Nett', en: 'Nett Total', mix: 'Nett Total' }, v: 'Rp 139.250.000' },
            { k: { id: 'PPN', en: 'VAT', mix: 'PPN' }, v: 'Rp 15.317.500' },
            { k: { id: 'Sales Owner', en: 'Sales Owner', mix: 'Sales' }, v: 'Firhan Fahamzha' },
          ],
          tags: ['Internal', 'ERP', 'Lock Stock'],
        },
        /* 6 */
        {
          id: 'contract',
          icon: '📜',
          accent: '#2a8e6c',
          name: { id: 'Kontrak Jual-Beli', en: 'Sales Contract', mix: 'Kontrak Jual-Beli' },
          type: 'bilateral',
          num: 'CTR/FFG-KSG/2025/007',
          date: '14 Feb 2025',
          issuedBy: 'both',
          desc: {
            id: 'Perjanjian formal yang mengikat kedua pihak — untuk proyek besar atau langganan jangka panjang. Bisa berupa Master Agreement atau Blanket Order.',
            en: 'Formal agreement binding both parties — for large projects or long-term supply. Can be a Master Agreement or Blanket Order.',
            mix: 'Perjanjian formal yang mengikat dua pihak — untuk proyek besar / langganan. Bisa Master Agreement / Blanket Order.',
          },
          note: {
            id: 'Memuat klausul: denda keterlambatan, force majeure, kerahasiaan, penyelesaian sengketa.',
            en: 'Contains clauses: late penalty, force majeure, confidentiality, dispute resolution.',
            mix: 'Klausul: denda telat, force majeure, NDA, sengketa.',
          },
          fields: [
            { k: { id: 'Nomor Kontrak', en: 'Contract No.', mix: 'No. Kontrak' }, v: 'CTR/FFG-KSG/2025/007' },
            { k: { id: 'Pihak 1', en: 'Party 1', mix: 'Pihak 1' }, v: 'PT Firhan Fahamzha Global' },
            { k: { id: 'Pihak 2', en: 'Party 2', mix: 'Pihak 2' }, v: 'Kopi Senja Group' },
            { k: { id: 'Durasi', en: 'Duration', mix: 'Durasi' }, v: '12 bulan (opsi perpanjangan)' },
            { k: { id: 'Denda Telat', en: 'Late Penalty', mix: 'Denda Telat' }, v: '0,5% per minggu (max 5%)' },
            { k: { id: 'Force Majeure', en: 'Force Majeure', mix: 'Force Majeure' }, v: 'Ada — sesuai hukum Indonesia' },
            { k: { id: 'Sengketa', en: 'Dispute', mix: 'Sengketa' }, v: 'BANI Jakarta' },
            { k: { id: 'NDA', en: 'NDA', mix: 'NDA' }, v: 'Ya — 3 tahun pasca kontrak' },
          ],
          tags: ['Bilateral', 'Legal', 'Long-term'],
        },
        /* 7 */
        {
          id: 'credit',
          icon: '📊',
          accent: '#b9772c',
          name: { id: 'Hasil Credit Check', en: 'Credit Check Report', mix: 'Credit Check' },
          type: 'internal',
          num: 'CRD/FFG/2025/0042',
          date: '13 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Analisis kelayakan kredit pelanggan: laporan keuangan, riwayat pembayaran, dan batas kredit (credit limit) yang diberikan.',
            en: 'Customer creditworthiness analysis: financials, payment history, and granted credit limit.',
            mix: 'Analisis kelayakan kredit customer: laporan keuangan, riwayat bayar, & credit limit.',
          },
          note: {
            id: 'Krusial untuk mengelola risiko piutang. Hasilnya menentukan syarat pembayaran (DP vs NET).',
            en: 'Crucial for managing receivables risk. The result decides payment terms (DP vs NET).',
            mix: 'Krusial buat manajemen risiko piutang. Hasilnya nentuin DP vs NET.',
          },
          fields: [
            { k: { id: 'Customer', en: 'Customer', mix: 'Customer' }, v: 'Kopi Senja Group' },
            { k: { id: 'Rating', en: 'Rating', mix: 'Rating' }, v: 'A- (Baik)' },
            { k: { id: 'Credit Limit', en: 'Credit Limit', mix: 'Credit Limit' }, v: 'Rp 250.000.000' },
            { k: { id: 'Penggunaan', en: 'Utilization', mix: 'Terpakai' }, v: 'Rp 154.567.500 (61,8%)' },
            { k: { id: 'Sisa Limit', en: 'Available', mix: 'Sisa' }, v: 'Rp 95.432.500' },
            { k: { id: 'Riwayat Telat', en: 'Late History', mix: 'Riwayat Telat' }, v: '1× (7 hari) · Mar 2024' },
            { k: { id: 'Keputusan', en: 'Decision', mix: 'Keputusan' }, v: '✅ Approved — DP 30%' },
            { k: { id: 'Approver', en: 'Approver', mix: 'Approver' }, v: 'Finance Director' },
          ],
          tags: ['Internal', 'Risk', 'Approval'],
        },
      ],
    },

    /* ============ STEP 3 ============ */
    {
      id: 'step3',
      num: '03',
      icon: '🚚',
      accent: '#2a8e6c',
      badge: { id: 'Fulfillment', en: 'Fulfillment', mix: 'Fulfillment' },
      title: { id: 'Pemenuhan & Pengiriman', en: 'Fulfillment & Delivery', mix: 'Fulfillment & Delivery' },
      subtitle: {
        id: 'Picking → Packing → Kirim → Proof of Delivery',
        en: 'Picking → Packing → Ship → Proof of Delivery',
        mix: 'Picking → Packing → Kirim → POD',
      },
      process: [
        { icon: '📦', label: { id: 'Persiapan & Picking', en: 'Preparation & Picking', mix: 'Persiapan & Picking' } },
        { icon: '📦', label: { id: 'Packing & Labeling', en: 'Packing & Labeling', mix: 'Packing & Labeling' } },
        { icon: '🚚', label: { id: 'Pengiriman', en: 'Shipping', mix: 'Pengiriman' } },
        { icon: '✅', label: { id: 'Proof of Delivery', en: 'Proof of Delivery', mix: 'POD' } },
      ],
      intro: {
        id: 'Saat komitmen jadi barang nyata. Semua dokumen di sini harus konsisten: qty di picking = packing = surat jalan = POD. Selisih 1 kg wajib ada berita acara.',
        en: 'Where commitment becomes physical goods. All docs must align: picking qty = packing = delivery order = POD. Even 1 kg difference needs a discrepancy note.',
        mix: 'Saat komitmen jadi barang nyata. Semua dokumen wajib konsisten: picking = packing = DO = POD. Selisih 1 kg butuh berita acara.',
      },
      kpi: [
        { id: 'On-Time Delivery', en: 'On-Time Delivery', mix: 'On-Time Delivery' },
        { id: 'Order Fill Rate', en: 'Order Fill Rate', mix: 'Fill Rate' },
        { id: 'Damage Rate', en: 'Damage Rate', mix: 'Damage Rate' },
      ],
      docs: [
        /* 8 */
        {
          id: 'picking',
          icon: '📋',
          accent: '#2a8e6c',
          name: { id: 'Picking List', en: 'Picking List', mix: 'Picking List' },
          type: 'internal',
          num: 'PCK/WH-TAK/2025/0891',
          date: '24 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Instruksi ke petugas gudang: barang apa, di rak mana, berapa jumlahnya. Jadi perintah kerja internal.',
            en: 'Warehouse instruction: which item, which rack, what quantity. An internal work order.',
            mix: 'Instruksi ke gudang: barang apa, rak mana, berapa. Ini perintah kerja internal.',
          },
          note: {
            id: 'Dibuat oleh sistem WMS/ERP, dicetak, ditandatangani picker. Bukan dokumen untuk pembeli.',
            en: 'Generated by WMS/ERP, printed, signed by the picker. Not for the buyer.',
            mix: 'Dibuat oleh WMS/ERP, dicetak, ttd picker. Bukan untuk buyer.',
          },
          fields: [
            { k: { id: 'No. Picking', en: 'Picking No.', mix: 'No. Picking' }, v: 'PCK/WH-TAK/2025/0891' },
            { k: { id: 'Ref. SO', en: 'Ref. SO', mix: 'Ref. SO' }, v: 'SO/FFG/2025/0188' },
            { k: { id: 'Lokasi Rak', en: 'Rack', mix: 'Rak' }, v: 'A3-B12 · A3-B13 · A4-C01' },
            { k: { id: 'SKU', en: 'SKU', mix: 'SKU' }, v: 'FFG-ARG-500' },
            { k: { id: 'Qty Target', en: 'Target Qty', mix: 'Target Qty' }, v: '500 kg (9 karung × 60 kg)' },
            { k: { id: 'Qty Ambil', en: 'Picked Qty', mix: 'Diambil' }, v: '500 kg — lengkap ✅' },
            { k: { id: 'Picker', en: 'Picker', mix: 'Picker' }, v: 'Bagus Setiawan' },
            { k: { id: 'Jam Mulai/Selesai', en: 'Start/End', mix: 'Jam' }, v: '08:12 – 08:55' },
          ],
          tags: ['Internal', 'WMS', 'Gudang'],
        },
        /* 9 */
        {
          id: 'packing',
          icon: '📦',
          accent: '#2a8e6c',
          name: { id: 'Packing List', en: 'Packing List', mix: 'Packing List' },
          type: 'outbound',
          num: 'PL/FFG/2025/0231',
          date: '25 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Daftar rinci isi kemasan: jenis, jumlah, berat, dimensi, nomor segel. Menyertai barang kiriman.',
            en: 'Itemized list of package contents: type, qty, weight, dimensions, seal numbers. Travels with the shipment.',
            mix: 'Rincian isi kemasan: jenis, qty, berat, dimensi, no. segel. Menyertai barang.',
          },
          note: {
            id: 'Memudahkan penerima saat verifikasi kedatangan. Diserahkan bersama Surat Jalan.',
            en: 'Helps the receiver verify on arrival. Handed over with the Delivery Order.',
            mix: 'Bantu penerima verifikasi kedatangan. Diserahkan bareng Surat Jalan.',
          },
          fields: [
            { k: { id: 'No. Packing', en: 'Packing No.', mix: 'No. Packing' }, v: 'PL/FFG/2025/0231' },
            { k: { id: 'Ref. PO', en: 'Ref. PO', mix: 'Ref. PO' }, v: 'PO/KSG/2025/0231' },
            { k: { id: 'Jenis Kemasan', en: 'Package Type', mix: 'Kemasan' }, v: 'Karung goni + food-grade liner' },
            { k: { id: 'Jumlah Karung', en: 'Bag Count', mix: 'Jumlah Karung' }, v: '9 karung' },
            { k: { id: 'Berat Bruto', en: 'Gross Weight', mix: 'Bruto' }, v: '543,6 kg' },
            { k: { id: 'Berat Netto', en: 'Nett Weight', mix: 'Netto' }, v: '500 kg' },
            { k: { id: 'Dimensi Palet', en: 'Pallet Size', mix: 'Dimensi' }, v: '120 × 100 × 90 cm' },
            { k: { id: 'Nomor Segel', en: 'Seal No.', mix: 'No. Segel' }, v: 'FFG-2025-00231-A' },
          ],
          tags: ['Outbound', 'Verifikasi', 'Fisik'],
        },
        /* 10 */
        {
          id: 'do',
          icon: '🚛',
          accent: '#1d7a8c',
          name: { id: 'Delivery Order / Surat Jalan', en: 'Delivery Order / Waybill', mix: 'Surat Jalan (DO)' },
          type: 'outbound',
          num: 'DO/FFG/2025/0231',
          date: '26 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Dokumen pengiriman yang menyertai barang. Berisi tujuan, pengemudi, nomor kendaraan, dan daftar barang.',
            en: 'Shipping document accompanying the goods. Contains destination, driver, vehicle number, and item list.',
            mix: 'Dokumen pengiriman yang menyertai barang. Isi tujuan, driver, no. kendaraan, & daftar barang.',
          },
          note: {
            id: 'Ditandatangani penerima = jadi bukti serah terima. Sering disebut Surat Jalan.',
            en: 'Signed by the receiver = proof of handover. Commonly called Surat Jalan.',
            mix: 'Ditandatangani penerima = bukti serah terima. Sering disebut Surat Jalan.',
          },
          fields: [
            { k: { id: 'No. DO', en: 'DO No.', mix: 'No. DO' }, v: 'DO/FFG/2025/0231' },
            { k: { id: 'Ref. PO', en: 'Ref. PO', mix: 'Ref. PO' }, v: 'PO/KSG/2025/0231' },
            { k: { id: 'Tanggal Kirim', en: 'Ship Date', mix: 'Tgl Kirim' }, v: '26 Feb 2025' },
            { k: { id: 'Alamat Tujuan', en: 'Ship To', mix: 'Tujuan' }, v: 'Gudang KSG — Jl. Braga 45, Bandung' },
            { k: { id: 'Driver', en: 'Driver', mix: 'Driver' }, v: 'Sugeng Riyadi' },
            { k: { id: 'Kendaraan', en: 'Vehicle', mix: 'Kendaraan' }, v: 'Truk B 9123 XYZ' },
            { k: { id: 'Qty', en: 'Qty', mix: 'Qty' }, v: '500 kg (9 karung)' },
            { k: { id: 'ETA', en: 'ETA', mix: 'ETA' }, v: '28 Feb 2025 · 14:00 WIB' },
            { k: { id: 'Diterima Oleh', en: 'Received By', mix: 'Diterima' }, v: '_______________ (ttd & cap)' },
          ],
          tags: ['Outbound', 'Fisik', 'Tanda Tangan'],
        },
        /* 11 */
        {
          id: 'bol',
          icon: '✈️',
          accent: '#8f4e8c',
          name: { id: 'Bill of Lading / Airway Bill', en: 'Bill of Lading / Airway Bill', mix: 'B/L / AWB' },
          type: 'carrier',
          num: 'BL-2025-FFG-0042',
          date: '26 Feb 2025',
          issuedBy: 'carrier',
          desc: {
            id: 'Dokumen pengangkutan dari pihak logistik. Untuk laut → B/L, untuk udara → AWB. Berfungsi sebagai kontrak pengangkutan & bukti kepemilikan.',
            en: 'Transport document from the carrier. Sea → B/L, Air → AWB. Acts as transport contract & document of title.',
            mix: 'Dokumen pengangkutan dari logistik. Laut → B/L, udara → AWB. Kontrak angkut & bukti kepemilikan.',
          },
          note: {
            id: 'Untuk FOB Medan → barang naik ke kapal/ekspedisi. Wajib ada untuk pengiriman antar-pulau / ekspor.',
            en: 'For FOB Medan → goods go onto vessel/freight. Mandatory for inter-island / export shipment.',
            mix: 'Untuk FOB Medan → barang naik kapal/ekspedisi. Wajib untuk antar-pulau / ekspor.',
          },
          fields: [
            { k: { id: 'No. B/L', en: 'B/L No.', mix: 'No. B/L' }, v: 'BL-2025-FFG-0042' },
            { k: { id: 'Shipper', en: 'Shipper', mix: 'Shipper' }, v: 'PT Firhan Fahamzha Global' },
            { k: { id: 'Consignee', en: 'Consignee', mix: 'Consignee' }, v: 'Kopi Senja Group' },
            { k: { id: 'Notify Party', en: 'Notify Party', mix: 'Notify' }, v: 'Nadia Prameswari — 0812-XXXX' },
            { k: { id: 'Pelabuhan Muat', en: 'Port of Loading', mix: 'POL' }, v: 'Belawan, Medan' },
            { k: { id: 'Pelabuhan Bongkar', en: 'Port of Discharge', mix: 'POD' }, v: 'Tanjung Priok, Jakarta' },
            { k: { id: 'Incoterms', en: 'Incoterms', mix: 'Incoterms' }, v: 'FOB Medan' },
            { k: { id: 'Freight', en: 'Freight', mix: 'Freight' }, v: 'Prepaid / Collect (lihat nego)' },
          ],
          tags: ['Carrier', 'Transport', 'Cross-Border'],
        },
        /* 12 */
        {
          id: 'pod',
          icon: '✅',
          accent: '#2a8e6c',
          name: { id: 'Proof of Delivery (POD)', en: 'Proof of Delivery (POD)', mix: 'Proof of Delivery' },
          type: 'outbound',
          num: 'POD/FFG/2025/0231',
          date: '28 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Bukti bahwa barang benar-benar sampai: tanda tangan penerima + stempel gudang + foto. Memutus klaim.',
            en: 'Proof that goods arrived: receiver signature + warehouse stamp + photo. Cuts off future claims.',
            mix: 'Bukti barang sampai: ttd penerima + cap gudang + foto. Memutus klaim.',
          },
          note: {
            id: 'Wajib sebelum Invoice final diterbitkan. Kalau ada selisih/kerusakan, catat di sini & buat Berita Acara.',
            en: 'Mandatory before the final Invoice is issued. Any difference/damage must be noted here & put in a report.',
            mix: 'Wajib sebelum Invoice final terbit. Kalau ada selisih/rusak, catat di sini + Berita Acara.',
          },
          fields: [
            { k: { id: 'No. POD', en: 'POD No.', mix: 'No. POD' }, v: 'POD/FFG/2025/0231' },
            { k: { id: 'Ref. DO', en: 'Ref. DO', mix: 'Ref. DO' }, v: 'DO/FFG/2025/0231' },
            { k: { id: 'Waktu Terima', en: 'Delivered At', mix: 'Waktu Terima' }, v: '28 Feb 2025 · 13:52 WIB' },
            { k: { id: 'Diterima', en: 'Received By', mix: 'Diterima Oleh' }, v: 'Rizky Hidayat (Kepala Gudang KSG)' },
            { k: { id: 'Kondisi', en: 'Condition', mix: 'Kondisi' }, v: '✅ Baik — 9 karung utuh' },
            { k: { id: 'Berat Verifikasi', en: 'Verified Weight', mix: 'Berat Verifikasi' }, v: '500 kg (sesuai PL)' },
            { k: { id: 'Catatan', en: 'Remarks', mix: 'Catatan' }, v: 'Tidak ada keluhan' },
            { k: { id: 'Foto', en: 'Photo', mix: 'Foto' }, v: '3 foto (bongkar muat + cap)' },
          ],
          tags: ['Outbound', 'Bukti Terima', 'Legal'],
        },
      ],
    },

    /* ============ STEP 4 ============ */
    {
      id: 'step4',
      num: '04',
      icon: '🧾',
      accent: '#b9772c',
      badge: { id: 'Invoicing', en: 'Invoicing', mix: 'Invoicing' },
      title: { id: 'Penagihan & Pembayaran', en: 'Invoicing & Payment', mix: 'Invoicing & Payment' },
      subtitle: {
        id: 'Proforma → Invoice Resmi → Kirim → Terima Bayar',
        en: 'Proforma → Official Invoice → Send → Receive Payment',
        mix: 'Proforma → Invoice → Kirim → Terima Bayar',
      },
      process: [
        { icon: '🧾', label: { id: 'Proforma Invoice (opsional)', en: 'Proforma Invoice (optional)', mix: 'Proforma Invoice' } },
        { icon: '📄', label: { id: 'Invoice / Faktur Resmi', en: 'Official Invoice', mix: 'Invoice Resmi' } },
        { icon: '📨', label: { id: 'Kirim Tagihan ke Klien', en: 'Send Invoice to Client', mix: 'Kirim Tagihan' } },
        { icon: '💰', label: { id: 'Penerimaan & Rekonsiliasi', en: 'Cash Receipt & Reconciliation', mix: 'Penerimaan & Rekon' } },
      ],
      intro: {
        id: 'Uang berubah jadi angka. Setiap Invoice harus merujuk PO & DO yang benar. Kalau ada DP, dua Invoice dibuat: DP & pelunasan.',
        en: 'Money turns into numbers. Each Invoice must reference the correct PO & DO. If there\'s a DP, two invoices are made: DP & settlement.',
        mix: 'Uang berubah jadi angka. Invoice wajib rujuk PO & DO. Kalau DP, dua Invoice dibuat: DP & pelunasan.',
      },
      kpi: [
        { id: 'DSO', en: 'DSO', mix: 'DSO' },
        { id: 'Invoice Accuracy', en: 'Invoice Accuracy', mix: 'Invoice Accuracy' },
        { id: 'Collection Rate', en: 'Collection Rate', mix: 'Collection Rate' },
      ],
      docs: [
        /* 13 */
        {
          id: 'proforma',
          icon: '🧾',
          accent: '#b9772c',
          name: { id: 'Proforma Invoice', en: 'Proforma Invoice', mix: 'Proforma Invoice' },
          type: 'outbound',
          num: 'PRO/FFG/2025/0188',
          date: '14 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Tagihan sementara untuk meminta uang muka (down payment). Belum menjadi piutang resmi, tapi mengikat berdasarkan kontrak.',
            en: 'Provisional invoice to request a down payment. Not yet a formal receivable, but binding per contract.',
            mix: 'Tagihan sementara untuk minta DP. Belum jadi piutang resmi, tapi mengikat per kontrak.',
          },
          note: {
            id: 'Bisa dipakai untuk keperluan LC, bea cukai, atau konfirmasi pembayaran ke bank pembeli.',
            en: 'Can be used for LC, customs, or bank confirmation with the buyer\'s bank.',
            mix: 'Bisa untuk LC, bea cukai, atau konfirmasi ke bank buyer.',
          },
          fields: [
            { k: { id: 'No. Proforma', en: 'Proforma No.', mix: 'No. Proforma' }, v: 'PRO/FFG/2025/0188' },
            { k: { id: 'Ref. PO', en: 'Ref. PO', mix: 'Ref. PO' }, v: 'PO/KSG/2025/0231' },
            { k: { id: 'Dasar', en: 'Basis', mix: 'Dasar' }, v: 'DP 30% dari nilai PO' },
            { k: { id: 'Total PO', en: 'PO Total', mix: 'Total PO' }, v: 'Rp 154.567.500' },
            { k: { id: 'DP 30%', en: 'DP 30%', mix: 'DP 30%' }, v: 'Rp 46.370.250' },
            { k: { id: 'Rekening', en: 'Bank Account', mix: 'Rekening' }, v: 'Bank Mandiri 122-00-5566-7788' },
            { k: { id: 'Jatuh Tempo DP', en: 'DP Due', mix: 'DP Due' }, v: '18 Feb 2025' },
            { k: { id: 'Status', en: 'Status', mix: 'Status' }, v: 'Lunas 17 Feb 2025' },
          ],
          tags: ['Outbound', 'DP', 'Opsional'],
        },
        /* 14 */
        {
          id: 'invoice',
          icon: '📄',
          accent: '#b9772c',
          name: { id: 'Invoice / Faktur Penjualan', en: 'Sales Invoice', mix: 'Invoice' },
          type: 'outbound',
          num: 'INV/FFG/2025/0231',
          date: '28 Feb 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Tagihan resmi yang mencatat pendapatan penjualan & menciptakan piutang usaha (accounts receivable). Wajib memuat nomor, jatuh tempo, & syarat pembayaran.',
            en: 'Official invoice recording sales revenue & creating accounts receivable. Must contain number, due date, & payment terms.',
            mix: 'Tagihan resmi yang catat pendapatan & ciptakan piutang usaha. Wajib ada nomor, jatuh tempo, & terms.',
          },
          note: {
            id: 'Untuk kepatuhan pajak di Indonesia, juga terbit e-Faktur PPN. Invoice komersial ≠ Faktur Pajak, tapi biasanya dikirim bersama.',
            en: 'For Indonesian tax compliance, an e-Faktur PPN is also issued. Commercial Invoice ≠ Tax Invoice, but usually sent together.',
            mix: 'Untuk pajak Indonesia, juga terbit e-Faktur PPN. Invoice komersial ≠ Faktur Pajak, tapi biasanya dikirim bareng.',
          },
          fields: [
            { k: { id: 'No. Invoice', en: 'Invoice No.', mix: 'No. Invoice' }, v: 'INV/FFG/2025/0231' },
            { k: { id: 'Tanggal', en: 'Date', mix: 'Tanggal' }, v: '28 Feb 2025' },
            { k: { id: 'Ref. PO', en: 'Ref. PO', mix: 'Ref. PO' }, v: 'PO/KSG/2025/0231' },
            { k: { id: 'Ref. DO/POD', en: 'Ref. DO/POD', mix: 'Ref. DO/POD' }, v: 'DO/FFG/2025/0231 · POD 28 Feb' },
            { k: { id: 'Qty', en: 'Qty', mix: 'Qty' }, v: '500 kg' },
            { k: { id: 'Harga', en: 'Price', mix: 'Harga' }, v: 'Rp 278.500 / kg' },
            { k: { id: 'Subtotal', en: 'Subtotal', mix: 'Subtotal' }, v: 'Rp 139.250.000' },
            { k: { id: 'Dikurangi DP', en: 'Less DP', mix: 'Dikurangi DP' }, v: 'Rp (46.370.250)' },
            { k: { id: 'Sisa Tagihan', en: 'Amount Due', mix: 'Sisa Tagihan' }, v: 'Rp 92.879.750' },
            { k: { id: 'PPN 11%', en: 'VAT 11%', mix: 'PPN 11%' }, v: 'Rp 15.317.500' },
            { k: { id: 'Total', en: 'Total', mix: 'Total' }, v: 'Rp 108.197.250' },
            { k: { id: 'Jatuh Tempo', en: 'Due Date', mix: 'Jatuh Tempo' }, v: '30 Mar 2025 (NET 30)' },
            { k: { id: 'Termin', en: 'Terms', mix: 'Termin' }, v: 'NET 30 dari tgl invoice' },
          ],
          tags: ['Outbound', 'Resmi', 'Piutang'],
        },
        /* 15 */
        {
          id: 'remittance',
          icon: '✉️',
          accent: '#8f4e8c',
          name: { id: 'Remittance Advice', en: 'Remittance Advice', mix: 'Remittance Advice' },
          type: 'inbound',
          num: 'RM/KSG/2025/0412',
          date: '28 Mar 2025',
          issuedBy: 'buyer',
          desc: {
            id: 'Notifikasi dari klien yang merinci pembayaran yang mereka transfer: invoice mana, jumlah, tanggal, biaya potongan (kalau ada).',
            en: 'Notice from the client detailing their payment: which invoice, amount, date, deductions (if any).',
            mix: 'Notifikasi dari klien yang rinci pembayaran mereka: invoice mana, jumlah, tanggal, potongan (kalau ada).',
          },
          note: {
            id: 'Krusial untuk finance mencocokkan (matching) pembayaran ke invoice yang benar — terutama kalau satu klien punya banyak invoice terbuka.',
            en: 'Crucial for finance to match a payment to the correct invoice — especially if a client has many open invoices.',
            mix: 'Krusial buat finance matching pembayaran ke invoice yang benar — terutama kalau banyak invoice terbuka.',
          },
          fields: [
            { k: { id: 'No. Remittance', en: 'Remittance No.', mix: 'No. Remittance' }, v: 'RM/KSG/2025/0412' },
            { k: { id: 'Dari', en: 'From', mix: 'Dari' }, v: 'Kopi Senja Group — Finance Dept' },
            { k: { id: 'Invoice Dibayar', en: 'Invoice Paid', mix: 'Invoice Dibayar' }, v: 'INV/FFG/2025/0231' },
            { k: { id: 'Jumlah Transfer', en: 'Amount Transferred', mix: 'Jumlah Transfer' }, v: 'Rp 108.197.250' },
            { k: { id: 'Metode', en: 'Method', mix: 'Metode' }, v: 'Bank Transfer (RTGS)' },
            { k: { id: 'Tanggal Bayar', en: 'Payment Date', mix: 'Tgl Bayar' }, v: '28 Mar 2025' },
            { k: { id: 'Bank Asal', en: 'Remitting Bank', mix: 'Bank Asal' }, v: 'BCA — A/C 4455-XXXX' },
            { k: { id: 'Potongan', en: 'Deductions', mix: 'Potongan' }, v: 'Tidak ada' },
          ],
          tags: ['Inbound', 'Rekonsiliasi', 'Finance'],
        },
        /* 16 */
        {
          id: 'bank',
          icon: '🏦',
          accent: '#2a7de1',
          name: { id: 'Bukti Transfer / Bank Statement', en: 'Bank Transfer Proof / Statement', mix: 'Bukti Transfer / Bank Statement' },
          type: 'inbound',
          num: 'MANDIRI/2025/03/28/0917',
          date: '28 Mar 2025',
          issuedBy: 'buyer',
          desc: {
            id: 'Bukti dari bank bahwa dana telah benar-benar masuk ke rekening penjual. Bukti penutupan piutang.',
            en: 'Bank proof that funds truly arrived in the seller\'s account. Closes the receivable.',
            mix: 'Bukti dari bank bahwa dana benar-benar masuk. Penutup piutang.',
          },
          note: {
            id: 'Setelah ini, piutang berkurang di neraca, kas bertambah. Sesi O2C dinyatakan selesai untuk transaksi ini.',
            en: 'After this, receivables drop on the balance sheet, cash increases. The O2C session is closed for this transaction.',
            mix: 'Setelah ini, piutang turun di neraca, kas naik. Sesi O2C selesai untuk transaksi ini.',
          },
          fields: [
            { k: { id: 'Ref. Mutasi', en: 'Ref.', mix: 'Ref.' }, v: 'MANDIRI/2025/03/28/0917' },
            { k: { id: 'Tanggal', en: 'Date', mix: 'Tanggal' }, v: '28 Mar 2025 · 10:14 WIB' },
            { k: { id: 'Debit (Masuk)', en: 'Debit (In)', mix: 'Debit (Masuk)' }, v: 'Rp 108.197.250' },
            { k: { id: 'Pengirim', en: 'Sender', mix: 'Pengirim' }, v: 'KOPI SENJA GROUP' },
            { k: { id: 'Berita', en: 'Remark', mix: 'Berita' }, v: 'INV/FFG/2025/0231' },
            { k: { id: 'Saldo Akhir', en: 'Closing Balance', mix: 'Saldo Akhir' }, v: 'Rp 3.412.900.550' },
            { k: { id: 'Status', en: 'Status', mix: 'Status' }, v: '✅ Cocok dengan Remittance' },
          ],
          tags: ['Inbound', 'Bank', 'Penutup Piutang'],
        },
      ],
    },

    /* ============ STEP 5 ============ */
    {
      id: 'step5',
      num: '05',
      icon: '🗄️',
      accent: '#8f4e8c',
      badge: { id: 'Post-Sales', en: 'Post-Sales', mix: 'Post-Sales' },
      title: { id: 'Pasca-Penjualan & Arsip', en: 'Post-Sales & Archive', mix: 'Post-Sales & Archive' },
      subtitle: {
        id: 'Retur → Credit Note → Pengakuan Pendapatan → Arsip',
        en: 'Return → Credit Note → Revenue Recognition → Archive',
        mix: 'Retur → Credit Note → Revenue → Arsip',
      },
      process: [
        { icon: '↩️', label: { id: 'Retur / Return (jika ada)', en: 'Return (if any)', mix: 'Retur (jika ada)' } },
        { icon: '📝', label: { id: 'Credit / Debit Note', en: 'Credit / Debit Note', mix: 'Credit / Debit Note' } },
        { icon: '📊', label: { id: 'Pengakuan Pendapatan', en: 'Revenue Recognition', mix: 'Revenue Recognition' } },
        { icon: '🗄️', label: { id: 'Arsip Digital & Audit Trail', en: 'Digital Archive & Audit Trail', mix: 'Arsip & Audit Trail' } },
      ],
      intro: {
        id: 'Tahap paling sering dilupakan, tapi paling ditakuti auditor. Semua dokumen harus dikunci, diarsipkan, & revenue diakui di periode yang tepat.',
        en: 'The most forgotten stage, yet the one auditors dread most. All documents must be locked, archived, & revenue recognized in the right period.',
        mix: 'Tahap paling sering lupa, tapi paling ditakuti auditor. Semua dokumen harus dikunci, diarsip, & revenue diakui di periode yang tepat.',
      },
      kpi: [
        { id: 'Return Rate', en: 'Return Rate', mix: 'Return Rate' },
        { id: 'Revenue Recognition Accuracy', en: 'Revenue Accuracy', mix: 'Revenue Accuracy' },
        { id: 'Audit Readiness', en: 'Audit Readiness', mix: 'Audit Readiness' },
      ],
      docs: [
        /* 17 */
        {
          id: 'rma',
          icon: '↩️',
          accent: '#8f4e8c',
          name: { id: 'RMA (Return Authorization)', en: 'RMA (Return Authorization)', mix: 'RMA' },
          type: 'bilateral',
          num: 'RMA/FFG/2025/0019',
          date: '15 Mar 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Otorisasi dari penjual untuk menerima barang kembali. Setiap retur wajib punya nomor RMA agar tidak liar.',
            en: 'Seller authorization to accept returned goods. Every return must have an RMA number so it doesn\'t go rogue.',
            mix: 'Otorisasi seller untuk terima barang kembali. Setiap retur wajib punya no. RMA.',
          },
          note: {
            id: 'Memuat alasan retur, kondisi barang, dan ongkos kirim balik siapa yang tanggung.',
            en: 'Contains reason, condition, and who pays the return shipping.',
            mix: 'Isi alasan retur, kondisi, & siapa tanggung ongkir balik.',
          },
          fields: [
            { k: { id: 'No. RMA', en: 'RMA No.', mix: 'No. RMA' }, v: 'RMA/FFG/2025/0019' },
            { k: { id: 'Ref. Invoice', en: 'Ref. Invoice', mix: 'Ref. Invoice' }, v: 'INV/FFG/2025/0231' },
            { k: { id: 'Tgl Permintaan', en: 'Request Date', mix: 'Tgl Request' }, v: '15 Mar 2025' },
            { k: { id: 'Alasan', en: 'Reason', mix: 'Alasan' }, v: '3 karung kelembapan naik saat transit' },
            { k: { id: 'Qty Retur', en: 'Return Qty', mix: 'Qty Retur' }, v: '60 kg (1 karung)' },
            { k: { id: 'Kondisi', en: 'Condition', mix: 'Kondisi' }, v: 'Kemasan utuh, kualitas di bawah grade 1' },
            { k: { id: 'Keputusan', en: 'Decision', mix: 'Keputusan' }, v: '✅ Disetujui — Credit Note' },
            { k: { id: 'Ongkir Balik', en: 'Return Freight', mix: 'Ongkir Balik' }, v: 'Ditanggung penjual' },
          ],
          tags: ['Bilateral', 'Retur', 'Pasca-Jual'],
        },
        /* 18 */
        {
          id: 'credit-note',
          icon: '📝',
          accent: '#8f4e8c',
          name: { id: 'Credit Note / Nota Kredit', en: 'Credit Note', mix: 'Credit Note' },
          type: 'outbound',
          num: 'CN/FFG/2025/0057',
          date: '18 Mar 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Dokumen untuk mengurangi nilai tagihan (akibat retur, diskon setelah invoice, atau koreksi). Mengurangi piutang pembeli.',
            en: 'Document to reduce the invoiced amount (due to return, post-invoice discount, or correction). Reduces buyer receivable.',
            mix: 'Dokumen pengurang tagihan (retur, diskon setelah invoice, atau koreksi). Mengurangi piutang.',
          },
          note: {
            id: 'Bisa dijadikan pengurang pembayaran invoice berikutnya, atau kalau invoice belum dibayar → langsung kurangi sisa tagihan.',
            en: 'Can offset the next invoice, or if the invoice is unpaid → directly reduces the amount due.',
            mix: 'Bisa jadi pengurang invoice berikutnya, atau kalau invoice belum dibayar → langsung kurangi sisa.',
          },
          fields: [
            { k: { id: 'No. CN', en: 'CN No.', mix: 'No. CN' }, v: 'CN/FFG/2025/0057' },
            { k: { id: 'Ref. Invoice', en: 'Ref. Invoice', mix: 'Ref. Invoice' }, v: 'INV/FFG/2025/0231' },
            { k: { id: 'Ref. RMA', en: 'Ref. RMA', mix: 'Ref. RMA' }, v: 'RMA/FFG/2025/0019' },
            { k: { id: 'Alasan', en: 'Reason', mix: 'Alasan' }, v: 'Retur 60 kg — kualitas' },
            { k: { id: 'Qty', en: 'Qty', mix: 'Qty' }, v: '60 kg' },
            { k: { id: 'Harga', en: 'Price', mix: 'Harga' }, v: 'Rp 278.500 / kg' },
            { k: { id: 'Nilai CN', en: 'CN Amount', mix: 'Nilai CN' }, v: 'Rp 16.710.000' },
            { k: { id: 'PPN Koreksi', en: 'VAT Correction', mix: 'PPN Koreksi' }, v: 'Rp 1.838.100' },
            { k: { id: 'Total Pengurang', en: 'Total Deduction', mix: 'Total Pengurang' }, v: 'Rp 18.548.100' },
            { k: { id: 'Status', en: 'Status', mix: 'Status' }, v: 'Dipakai di invoice berikutnya' },
          ],
          tags: ['Outbound', 'Koreksi', 'Piutang'],
        },
        /* 19 (bonus) */
        {
          id: 'debit-note',
          icon: '📝',
          accent: '#b9772c',
          name: { id: 'Debit Note', en: 'Debit Note', mix: 'Debit Note' },
          type: 'outbound',
          num: 'DN/FFG/2025/0022',
          date: '20 Mar 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Kebalikan Credit Note: menambah tagihan. Untuk penalti keterlambatan bayar, biaya penyimpanan, atau adjustment tambahan.',
            en: 'Opposite of Credit Note: adds to the invoice. For late payment penalties, storage fees, or additional adjustments.',
            mix: 'Kebalikan Credit Note: nambah tagihan. Untuk denda telat bayar, biaya simpan, atau adjustment tambahan.',
          },
          note: {
            id: 'Dalam kontrak, sebutkan dasar hukumnya (mis. denda 0,5%/minggu). Kalau tidak, Debit Note sering disengketakan.',
            en: 'Cite the legal basis in the contract (e.g., 0.5%/week penalty). Otherwise, Debit Notes often get disputed.',
            mix: 'Sebutkan dasar hukumnya di kontrak (mis. denda 0,5%/minggu). Kalau nggak, sering disengketakan.',
          },
          fields: [
            { k: { id: 'No. DN', en: 'DN No.', mix: 'No. DN' }, v: 'DN/FFG/2025/0022' },
            { k: { id: 'Ref. Invoice', en: 'Ref. Invoice', mix: 'Ref. Invoice' }, v: 'INV/FFG/2025/0231' },
            { k: { id: 'Alasan', en: 'Reason', mix: 'Alasan' }, v: 'Biaya penyimpanan 5 hari di gudang penjual' },
            { k: { id: 'Dasar Kontrak', en: 'Contract Basis', mix: 'Dasar Kontrak' }, v: 'Klausul 7.2 — Storage Fee' },
            { k: { id: 'Nilai', en: 'Amount', mix: 'Nilai' }, v: 'Rp 1.500.000' },
            { k: { id: 'Status', en: 'Status', mix: 'Status' }, v: 'Pending konfirmasi pembeli' },
          ],
          tags: ['Outbound', 'Adjustment', 'Kontrak'],
        },
        /* 20 (bonus) */
        {
          id: 'archive',
          icon: '🗄️',
          accent: '#2a7de1',
          name: { id: 'Arsip Digital Lengkap', en: 'Complete Digital Archive', mix: 'Arsip Digital' },
          type: 'internal',
          num: 'ARC/FFG/2025/0231',
          date: '31 Mar 2025',
          issuedBy: 'seller',
          desc: {
            id: 'Kumpulan semua dokumen transaksi dalam satu folder digital: PO, SO, Kontrak, Picking, PL, DO, POD, Invoice, Remittance, Bank, RMA, CN.',
            en: 'All transaction documents in one digital folder: PO, SO, Contract, Picking, PL, DO, POD, Invoice, Remittance, Bank, RMA, CN.',
            mix: 'Kumpulan semua dokumen transaksi dalam satu folder digital: PO, SO, Kontrak, Picking, PL, DO, POD, Invoice, Remittance, Bank, RMA, CN.',
          },
          note: {
            id: 'Wajib untuk kepatuhan pajak (min. 10 tahun di Indonesia) & memudahkan audit internal/eksternal. Simpan sebagai PDF/A atau format yang tak bisa diubah.',
            en: 'Required for tax compliance (min. 10 years in Indonesia) & eases internal/external audits. Store as PDF/A or immutable format.',
            mix: 'Wajib pajak (min. 10 tahun di Indonesia) & memudahkan audit. Simpan PDF/A atau format immutable.',
          },
          fields: [
            { k: { id: 'No. Arsip', en: 'Archive No.', mix: 'No. Arsip' }, v: 'ARC/FFG/2025/0231' },
            { k: { id: 'Transaksi', en: 'Transaction', mix: 'Transaksi' }, v: 'Kopi Senja Group — 500 kg' },
            { k: { id: 'Dokumen', en: 'Documents', mix: 'Dokumen' }, v: '12 file (RFQ → Bank Statement)' },
            { k: { id: 'Format', en: 'Format', mix: 'Format' }, v: 'PDF/A + e-Faktur XML' },
            { k: { id: 'Retensi', en: 'Retention', mix: 'Retensi' }, v: '10 tahun' },
            { k: { id: 'Akses', en: 'Access', mix: 'Akses' }, v: 'Owner + Finance + Auditor' },
            { k: { id: 'Audit Trail', en: 'Audit Trail', mix: 'Audit Trail' }, v: 'Terekam lengkap (who, when, what)' },
          ],
          tags: ['Internal', 'Compliance', 'Audit'],
        },
      ],
    },
  ];

  /* ---------- FLOW OVERVIEW (untuk hero / breadcrumb) ---------- */
  const FLOW = [
    { id: 'step1', label: { id: 'Penawaran', en: 'Quotation', mix: 'Quotation' } },
    { id: 'step2', label: { id: 'Pemesanan', en: 'Ordering', mix: 'Ordering' } },
    { id: 'step3', label: { id: 'Pengiriman', en: 'Delivery', mix: 'Delivery' } },
    { id: 'step4', label: { id: 'Penagihan', en: 'Invoicing', mix: 'Invoicing' } },
    { id: 'step5', label: { id: 'Arsip', en: 'Archive', mix: 'Archive' } },
  ];

  /* ---------- GLOSARIUM (bonus untuk pustaka) ---------- */
  const GLOSSARY = [
    { t: 'O2C', d: { id: 'Order-to-Cash — rangkaian proses dari order masuk sampai kas diterima.', en: 'Order-to-Cash — the end-to-end process from order intake to cash receipt.', mix: 'Order-to-Cash — proses dari order sampai kas masuk.' } },
    { t: 'DSO', d: { id: 'Days Sales Outstanding — rata-rata hari untuk menagih piutang.', en: 'Days Sales Outstanding — average days to collect receivables.', mix: 'Days Sales Outstanding — rata-rata hari nagih piutang.' } },
    { t: 'Incoterms', d: { id: 'Istilah dagang internasional yang mengatur siapa tanggung biaya & risiko pengiriman.', en: 'International trade terms defining who bears shipping cost & risk.', mix: 'Istilah dagang internasional — atur cost & risiko pengiriman.' } },
    { t: 'FOB', d: { id: 'Free On Board — penjual tanggung sampai barang naik kapal, risiko pindah di pelabuhan muat.', en: 'Free On Board — seller delivers onto vessel; risk transfers at port of loading.', mix: 'Free On Board — risiko pindah saat barang naik kapal.' } },
    { t: 'Credit Check', d: { id: 'Analisis kelayakan kredit pelanggan sebelum memberikan piutang.', en: 'Customer creditworthiness analysis before granting credit.', mix: 'Analisis kelayakan kredit customer.' } },
    { t: 'POD', d: { id: 'Proof of Delivery — bukti tanda tangan penerimaan barang.', en: 'Proof of Delivery — signed proof goods arrived.', mix: 'Proof of Delivery — bukti barang sampai.' } },
    { t: 'RMA', d: { id: 'Return Merchandise Authorization — nomor izin retur dari penjual.', en: 'Return Merchandise Authorization — seller\'s return permit number.', mix: 'Return Merchandise Authorization — izin retur.' } },
    { t: 'NET 30', d: { id: 'Syarat pembayaran: bayar penuh dalam 30 hari dari tanggal invoice.', en: 'Payment terms: full payment within 30 days of invoice date.', mix: 'Syarat bayar: lunas dalam 30 hari dari invoice.' } },
    { t: 'DP', d: { id: 'Down Payment — uang muka sebelum barang dikirim.', en: 'Down Payment — advance payment before shipping.', mix: 'Down Payment — uang muka sebelum kirim.' } },
  ];

  /* ============================================================
     2. UTIL
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

  /* ============================================================
     3. RENDER — ACCORDION MATERI
     ============================================================ */
  function renderMateri() {
    const mount = document.getElementById('materiMount');
    if (!mount) return;

    const progress = (global.Store && Store.get('progress.materi')) || { opened: [] };
    const openedSet = new Set(progress.opened || []);

    mount.innerHTML =
      '<div class="stepper">' +
        STAGES.map((s, i) =>
          '<div class="step" data-step-jump="' + s.id + '">' +
            '<span class="step__num">' + s.num + '</span>' +
            '<span class="step__label">' + esc(t(s.badge)) + '</span>' +
          '</div>' +
          (i < STAGES.length - 1 ? '<span class="step__sep"></span>' : '')
        ).join('') +
      '</div>' +

      '<div class="accordion" id="materiAccordion">' +
        STAGES.map(s => renderAccItem(s, openedSet.has(s.id))).join('') +
      '</div>' +

      '<div class="section" style="margin-top:var(--s-8)">' +
        '<div class="section__head">' +
          '<h2 class="section__title">📖 Glosarium Singkat</h2>' +
          '<p class="section__sub">Istilah penting Order-to-Cash yang wajib kamu hafal.</p>' +
        '</div>' +
        '<div class="doc-grid">' +
          GLOSSARY.map(g =>
            '<div class="doc-card" style="--accent:#2a7de1">' +
              '<div class="doc-card__name">' + esc(g.t) + '</div>' +
              '<div class="doc-card__desc">' + esc(t(g.d)) + '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</div>';

    bindAccordion();
    bindStepJump();
  }

  function renderAccItem(stage, isOpen) {
    const docsCount = stage.docs.length;
    return (
      '<div class="acc-item' + (isOpen ? ' is-open' : '') + '" id="acc-' + stage.id + '" data-stage="' + stage.id + '">' +
        '<div class="acc-head" role="button" tabindex="0" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
          '<div class="acc-num" style="--stage-accent:' + stage.accent + '">' + stage.num + '</div>' +
          '<div class="acc-title-wrap">' +
            '<div class="acc-title">' +
              esc(t(stage.title)) +
              '<span class="badge badge--primary">' + esc(t(stage.badge)) + '</span>' +
              '<span class="badge">' + docsCount + ' dok</span>' +
            '</div>' +
            '<div class="acc-sub">' + esc(t(stage.subtitle)) + '</div>' +
          '</div>' +
          '<div class="acc-icon" aria-hidden="true">▾</div>' +
        '</div>' +
        '<div class="acc-body">' +
          '<div class="acc-body__inner">' +
            renderAccBody(stage) +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderAccBody(stage) {
    return (
      '<p class="mb-3" style="font-size:14px;line-height:1.7;color:var(--text-2)">' +
        esc(t(stage.intro)) +
      '</p>' +

      '<div class="process-flow">' +
        '<span class="process-flow__label">⚡ Alur</span>' +
        stage.process.map(p =>
          '<span class="process-flow__step">' + p.icon + ' ' + esc(t(p.label)) + '</span>'
        ).join('') +
      '</div>' +

      '<div class="mb-3" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">' +
        '<span style="font-size:12px;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px">📊 KPI:</span>' +
        stage.kpi.map(k =>
          '<span class="chip">' + esc(t(k)) + '</span>'
        ).join('') +
      '</div>' +

      '<div class="divider divider--dashed">Dokumen Terkait</div>' +

      '<div class="doc-grid">' +
        stage.docs.map(d => renderDocCard(d, stage)).join('') +
      '</div>' +
    );
  }

  function renderDocCard(doc, stage) {
    return (
      '<div class="doc-card" style="--accent:' + doc.accent + '" data-doc-id="' + doc.id + '">' +
        '<div class="doc-card__icon">' + doc.icon + '</div>' +
        '<div class="doc-card__name">' + esc(t(doc.name)) + '</div>' +
        '<div class="doc-card__id">' + esc(doc.num) + '</div>' +
        '<div class="doc-card__desc">' + esc(t(doc.desc)) + '</div>' +
        '<button class="btn btn--sm btn--ghost mt-2" data-doc-detail="' + doc.id + '">🔍 Lihat Detail</button>' +
        '<div class="doc-card__note">💡 ' + esc(t(doc.note)) + '</div>' +
        '<div class="doc-card__tags">' +
          doc.tags.map(tg => '<span class="tag">' + esc(tg) + '</span>').join('') +
        '</div>' +
      '</div>'
    );
  }

  /* ============================================================
     4. BIND ACCORDION
     ============================================================ */
  function bindAccordion() {
    const items = $$('.acc-item');
    items.forEach(item => {
      const head = item.querySelector('.acc-head');
      if (!head) return;

      const toggle = () => {
        const isOpen = item.classList.contains('is-open');
        // Tutup yang lain
        items.forEach(other => {
          if (other !== item) {
            other.classList.remove('is-open');
            const h = other.querySelector('.acc-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('is-open', !isOpen);
        head.setAttribute('aria-expanded', String(!isOpen));

        // Simpan ke progress saat pertama kali dibuka
        if (!isOpen) {
          const stageId = item.dataset.stage;
          if (stageId && global.Store) {
            const opened = Store.get('progress.materi.opened') || [];
            if (!opened.includes(stageId)) {
              opened.push(stageId);
              Store.set('progress.materi.opened', opened);
            }
          }
        }
      };

      head.addEventListener('click', toggle);
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    // Detail dokumen modal
    $$('[data-doc-detail]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.docDetail;
        openDocDetail(id);
      });
    });
  }

  function bindStepJump() {
    $$('[data-step-jump]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.stepJump;
        const target = document.getElementById('acc-' + id);
        if (!target) return;
        // Tutup yang lain, buka target
        $$('.acc-item').forEach(a => a.classList.remove('is-open'));
        target.classList.add('is-open');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ============================================================
     5. MODAL DETAIL DOKUMEN
     ============================================================ */
  function openDocDetail(docId) {
    const doc = findDoc(docId);
    if (!doc) return;

    const html =
      '<div class="doc-detail">' +
        '<div class="doc-detail__head">' +
          '<div class="doc-detail__icon" style="background:' + doc.accent + '1a;color:' + doc.accent + '">' + doc.icon + '</div>' +
          '<div>' +
            '<div style="font-size:18px;font-weight:800">' + esc(t(doc.name)) + '</div>' +
            '<div style="font-family:var(--ff-mono);font-size:12px;color:var(--text-3);margin-top:4px">' + esc(doc.num) + '</div>' +
          '</div>' +
        '</div>' +

        '<p style="font-size:13.5px;color:var(--text-2);line-height:1.65;margin:var(--s-4) 0">' +
          esc(t(doc.desc)) +
        '</p>' +

        '<div class="table-wrap mb-3">' +
          '<table class="table table--compact">' +
            '<tbody>' +
              doc.fields.map(f =>
                '<tr>' +
                  '<td style="width:40%;color:var(--text-3);font-weight:600">' + esc(t(f.k)) + '</td>' +
                  '<td style="font-weight:600">' + esc(f.v) + '</td>' +
                '</tr>'
              ).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +

        '<div class="callout callout--info">' +
          '<div class="callout__icon">💡</div>' +
          '<div class="callout__body"><b>Catatan Penting</b><p>' + esc(t(doc.note)) + '</p></div>' +
        '</div>' +

        '<div style="margin-top:var(--s-4);display:flex;flex-wrap:wrap;gap:6px">' +
          doc.tags.map(tg => '<span class="tag">' + esc(tg) + '</span>').join('') +
        '</div>' +
      '</div>';

    if (global.App && App.openModal) {
      App.openModal({
        title: 'Detail Dokumen',
        html,
        footer:
          '<button class="btn btn--ghost" data-modal-close>Close</button>' +
          '<button class="btn btn--primary" id="btnCopyDoc">📋 Copy</button>',
        onFooter: (action, btn) => {
          if (btn.id === 'btnCopyDoc') {
            const text = formatDocForCopy(doc);
            copyToClipboard(text);
          }
        }
      });
    }
  }

  function formatDocForCopy(doc) {
    const lines = [
      '=== ' + t(doc.name) + ' ===',
      'Nomor: ' + doc.num,
      'Tanggal: ' + doc.date,
      '',
      t(doc.desc),
      '',
      '--- DETAIL ---',
      ...doc.fields.map(f => t(f.k) + ': ' + f.v),
      '',
      'Catatan: ' + t(doc.note),
      'Tags: ' + doc.tags.join(', '),
    ];
    return lines.join('\n');
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (global.App) App.toast('ok', I18N.t('toast.copied'));
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
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
      if (global.App) App.toast('ok', I18N.t('toast.copied'));
    } catch (_) { /* ignore */ }
    ta.remove();
  }

  /* ============================================================
     6. RENDER — PUSTAKA DOKUMEN
     ============================================================ */
  function renderPustaka() {
    const mount = document.getElementById('libraryMount');
    if (!mount) return;

    // Gabung semua dokumen dari semua stage
    const all = [];
    STAGES.forEach(stage => {
      stage.docs.forEach(doc => {
        all.push({ ...doc, stage: stage.id, stageNum: stage.num, stageTitle: stage.title });
      });
    });

    // Filter by stage
    const stageFilters = STAGES.map(s => ({
      id: s.id,
      label: s.num + ' · ' + t(s.badge),
    }));

    mount.innerHTML =
      '<div class="card card--flat mb-4">' +
        '<div class="card__body" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">' +
          '<div>' +
            '<div style="font-weight:800;font-size:14px;margin-bottom:4px">📚 ' + all.length + ' dokumen siap dipakai</div>' +
            '<div style="font-size:12.5px;color:var(--text-3)">Klik kartu untuk lihat detail, atau cetak untuk versi kertas.</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn--ghost btn--sm" id="btnPrintLib">🖨️ Cetak Semua</button>' +
            '<button class="btn btn--primary btn--sm" id="btnPlayPuzzle">🧩 Latihan Puzzle</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="chip-bar mb-5" id="libFilters">' +
        '<button class="chip chip--clickable is-active" data-filter="all">📚 Semua (' + all.length + ')</button>' +
        stageFilters.map(f =>
          '<button class="chip chip--clickable" data-filter="' + f.id + '">' + esc(f.label) + '</button>'
        ).join('') +
      '</div>' +

      '<div class="doc-grid" id="libGrid">' +
        all.map(d => renderLibCard(d)).join('') +
      '</div>';

    bindLib();
  }

  function renderLibCard(doc) {
    return (
      '<div class="doc-card" style="--accent:' + doc.accent + '" data-lib-stage="' + doc.stage + '" data-doc-id="' + doc.id + '">' +
        '<div class="doc-card__icon">' + doc.icon + '</div>' +
        '<div class="doc-card__name">' + esc(t(doc.name)) + '</div>' +
        '<div class="doc-card__id">' + esc(doc.num) + '</div>' +
        '<div class="doc-card__desc">' + esc(t(doc.desc)) + '</div>' +
        '<div class="doc-card__tags">' +
          '<span class="tag">Tahap ' + doc.stageNum + '</span>' +
          doc.tags.slice(0, 2).map(tg => '<span class="tag">' + esc(tg) + '</span>').join('') +
        '</div>' +
      '</div>'
    );
  }

  function bindLib() {
    // Filter chips
    $$('#libFilters .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('#libFilters .chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const filter = chip.dataset.filter;
        $$('#libGrid .doc-card').forEach(card => {
          const show = filter === 'all' || card.dataset.libStage === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });

    // Klik kartu → detail
    $$('#libGrid .doc-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        openDocDetail(card.dataset.docId);
      });
    });

    // Tombol cetak
    const btnPrint = document.getElementById('btnPrintLib');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Tombol ke puzzle
    const btnPuzzle = document.getElementById('btnPlayPuzzle');
    if (btnPuzzle) {
      btnPuzzle.addEventListener('click', () => {
        if (global.App) App.navigate('puzzle');
      });
    }
  }

  /* ============================================================
     7. FIND DOC / STAGE
     ============================================================ */
  function findDoc(docId) {
    for (const s of STAGES) {
      const d = s.docs.find(x => x.id === docId);
      if (d) return d;
    }
    return null;
  }
  function findStage(stageId) {
    return STAGES.find(s => s.id === stageId) || null;
  }

  /* ============================================================
     8. HIGHLIGHT / TARGET (dari navigasi luar)
     ============================================================ */
  function handleNavigateTarget(e) {
    const { view, target } = (e.detail || {});
    if (view === 'materi' && target) {
      // Tutup yang lain, buka target
      setTimeout(() => {
        const item = document.getElementById('acc-' + target);
        if (!item) return;
        $$('.acc-item').forEach(a => a.classList.remove('is-open'));
        item.classList.add('is-open');
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.classList.add('flash-highlight');
        setTimeout(() => item.classList.remove('flash-highlight'), 1400);
      }, 250);
    }
    if (view === 'pustaka' && target) {
      setTimeout(() => {
        const card = document.querySelector('[data-doc-id="' + target + '"]');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('flash-highlight');
          setTimeout(() => card.classList.remove('flash-highlight'), 1400);
        }
      }, 250);
    }
  }

  /* ============================================================
     9. AUTO-RE-RENDER saat bahasa berubah
     ============================================================ */
  function rerender() {
    renderMateri();
    renderPustaka();
    // Rebuild search index
    if (global.App && App.buildSearchIndex) App.buildSearchIndex();
  }

  /* ============================================================
     10. INIT
     ============================================================ */
  function init() {
    renderMateri();
    renderPustaka();

    document.addEventListener('navigate:target', handleNavigateTarget);
    document.addEventListener('i18n:change', rerender);
    document.addEventListener('app:rerender', () => {
      // Re-render hanya kalau view aktif (efisiensi)
      const active = document.querySelector('.view.is-active');
      if (active && active.dataset.view === 'materi') renderMateri();
      if (active && active.dataset.view === 'pustaka') renderPustaka();
    });

    // Update status stepper sesuai progres
    updateStepperStatus();

    // Ekspos data ke global untuk search index & modul lain
    global.MATERI_DATA = {
      company: COMPANY,
      product: PRODUCT,
      stages: STAGES,
      flow: FLOW,
      glossary: GLOSSARY,
      findDoc,
      findStage,
    };

    // Rebuild search index
    if (global.App && App.buildSearchIndex) App.buildSearchIndex();
  }

  function updateStepperStatus() {
    const opened = (global.Store && Store.get('progress.materi.opened')) || [];
    const openedSet = new Set(opened);
    // Total stage yang dibuka
    const totalOpened = STAGES.filter(s => openedSet.has(s.id)).length;
    if (totalOpened === STAGES.length) {
      if (global.Store) {
        Store.markDone('materi');
        if (Store.get('progress.materi.score') === 0) {
          Store.addScore(50, 'materi', 'Selesai buka semua tahap materi');
          if (global.Store) Store.set('progress.materi.score', 50);
          Store.unlockBadge('materi_explorer');
        }
      }
    }
  }

  /* ---------- AUTO-BOOT ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- EXPORT ---------- */
  global.Materi = {
    render: rerender,
    openDocDetail,
    findDoc,
    findStage,
    STAGES,
    COMPANY,
    PRODUCT,
    FLOW,
    GLOSSARY,
  };

})(window);