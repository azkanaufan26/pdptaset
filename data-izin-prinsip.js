/* ══════════════════════════════════════════════════════════════════
   data-izin-prinsip.js — DATA CADANGAN Izin Prinsip 2026

   Dipakai HANYA kalau pengambilan langsung dari Google Sheets gagal
   (sheet tidak lagi publik, jaringan putus, struktur berubah).
   Sumber sebenarnya: sheet "Rekap 5105000101" rentang B151:F214.

   Bentuk tiap baris: { no, tgl:"YYYY-MM-DD", bulan:0-11, unit, lokasi }
   "bulan" ikut disimpan supaya tetap benar walau tanggal gagal diurai.
   Baris tanpa tanggal di sheet (sel ter-merge) di sini sudah diisi
   dengan tanggal suratnya; "suratBaru" menandai awal tiap surat.
   ══════════════════════════════════════════════════════════════════ */

/* ══ KOREKSI KATEGORI MANUAL ══════════════════════════════════════
   Kalau ada aset yang salah kelompok, tulis di sini — entri di tabel
   ini MENANG atas aturan kata kunci di izin-prinsip.js, dan tetap
   berlaku walau datanya nanti diambil langsung dari Google Sheets.

   Kunci  = teks Lokasi Aset persis seperti di sheet (huruf besar/kecil
            bebas; spasi ganda dan tanda baca di ujung diabaikan).
   Nilai  = salah satu nama kategori di IZ_KATEGORI:
            "Mess" · "Rumah Dinas / Wisma" · "Gardu Induk" ·
            "Lahan Pembangkit" · "Kantor / Ruang Kerja" ·
            "Tanah Kosong" · "Lainnya"

   Contoh — hapus tanda komentar kalau memang ingin dipakai:
     "RUMAH OPERATOR GI SALAK":      "Gardu Induk",
     "RUMAH OPERATOR GI SIDIKALANG": "Gardu Induk",
     "RUMAH OPERATOR GI SIBOLGA":    "Gardu Induk",
   (pengelompokan lama menaruh tiga aset ini di Gardu Induk;
    aturan sekarang menaruhnya di Rumah Dinas / Wisma) */
const IZ_KOREKSI = {
};

const FALLBACK_IZIN = [
  {no:1,  tgl:"2026-01-06", bulan:0, unit:"UID Sumut",      lokasi:"Space Kantor UP3 Medan",              suratBaru:true},
  {no:2,  tgl:"2026-01-06", bulan:0, unit:"UID Jateng",     lokasi:"Eks Rumah Dinas Ir. Ramlan (JAJAR)",  suratBaru:true},
  {no:3,  tgl:"2026-02-18", bulan:1, unit:"UIP Sumbagteng", lokasi:"Kantor UPP Sumbagteng 2",             suratBaru:true},
  {no:4,  tgl:"2026-02-23", bulan:1, unit:"UIP JBT",        lokasi:"Kantor UIP JBT",                      suratBaru:true},
  {no:5,  tgl:"2026-02-26", bulan:1, unit:"UIP JBTB",       lokasi:"Kantor UPP JBTB 1",                   suratBaru:true},
  {no:6,  tgl:"2026-02-26", bulan:1, unit:"UID Sumut",      lokasi:"Space Kantor UID Sumut",              suratBaru:true},
  {no:7,  tgl:"2026-03-03", bulan:2, unit:"Kantor Pusat",   lokasi:"Tanah PLTMG Sambelia",                suratBaru:true},
  {no:8,  tgl:"2026-03-03", bulan:2, unit:"Kantor Pusat",   lokasi:"Tanah PLTMG Sumbawa 2"},
  {no:9,  tgl:"2026-03-14", bulan:2, unit:"UID Sumut",      lokasi:"Rumah Dinas Kisaran",                 suratBaru:true},
  {no:10, tgl:"2026-03-14", bulan:2, unit:"UID Sumut",      lokasi:"Tanah Jl. Nias, Medan"},
  {no:11, tgl:"2026-03-16", bulan:2, unit:"Kantor Pusat",   lokasi:"Tanah PLTD Lueng Bata",               suratBaru:true},
  {no:12, tgl:"2026-03-16", bulan:2, unit:"Kantor Pusat",   lokasi:"Tanah GI Krueng Raya"},
  {no:13, tgl:"2026-03-16", bulan:2, unit:"Kantor Pusat",   lokasi:"Tanah GITET Ulee Kareng"},
  {no:14, tgl:"2026-03-31", bulan:2, unit:"UID Sumbar",     lokasi:"Rumah Dinas Tan Malaka, Bukittinggi", suratBaru:true},
  {no:15, tgl:"2026-05-06", bulan:4, unit:"UIP3B Sum",      lokasi:"Rumah Operator GI Salak",             suratBaru:true},
  {no:16, tgl:"2026-05-06", bulan:4, unit:"UIP3B Sum",      lokasi:"Rumah Operator GI Sidikalang"},
  {no:17, tgl:"2026-05-06", bulan:4, unit:"UIP3B Sum",      lokasi:"Rumah Operator GI Sibolga"},
  {no:18, tgl:"2026-05-06", bulan:4, unit:"UIP3B Sum",      lokasi:"Lahan Bangunan Koperasi UP2B"},
  {no:19, tgl:"2026-05-06", bulan:4, unit:"UIP3B Sum",      lokasi:"Ruang SP UP2B"},
  {no:20, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Mess Elektrikal 2, Depok",            suratBaru:true},
  {no:21, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Mess Elektrikal 3, Depok"},
  {no:22, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Mess Elektrikal 4, Depok"},
  {no:23, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Mess Elektrikal 5, Depok"},
  {no:24, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Mess Elektrikal 6, Depok"},
  {no:25, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Kantor UIP JBB"},
  {no:26, tgl:"2026-05-06", bulan:4, unit:"UIP JBB",        lokasi:"Tanah Bendungan Hilir, Jakarta Pusat"},
  {no:27, tgl:"2026-05-07", bulan:4, unit:"UID Jaya",       lokasi:"Space Kantor UID Jaya",               suratBaru:true},
  {no:28, tgl:"2026-05-13", bulan:4, unit:"Kantor Pusat",   lokasi:"Tanah PLTGU Belawan",                 suratBaru:true},
  {no:29, tgl:"2026-05-13", bulan:4, unit:"Pusdiklat",      lokasi:"Space Parkir Kantor Pusdiklat",       suratBaru:true},
  {no:30, tgl:"2026-05-20", bulan:4, unit:"UIP JBT",        lokasi:"Tanah Akses Jalan PLTU Indramayu",    suratBaru:true},
  {no:31, tgl:"2026-06-08", bulan:5, unit:"UIP3B Sul",      lokasi:"Tanah Tello",                         suratBaru:true},
  {no:32, tgl:"2026-06-08", bulan:5, unit:"UID Sumut",      lokasi:"Tanah Jl. Meranti",                   suratBaru:true},
  {no:33, tgl:"2026-06-08", bulan:5, unit:"UIP JBB",        lokasi:"Tanah Andara, Jakarta Selatan",       suratBaru:true},
  {no:34, tgl:"2026-06-25", bulan:5, unit:"UID BALI",       lokasi:"Tanah Kosong Desa Kutampi",           suratBaru:true},
  {no:35, tgl:"2026-06-25", bulan:5, unit:"UID JATENG",     lokasi:"Eks Rumah Dinas , Ngarus, Pati",      suratBaru:true},
  {no:36, tgl:"2026-06-25", bulan:5, unit:"UIP JBB",        lokasi:"Mess Elektrikal IV",                  suratBaru:true},
  {no:37, tgl:"2026-06-25", bulan:5, unit:"UIP JBB",        lokasi:"Tanah Marunda",                       suratBaru:true},
  {no:38, tgl:"2026-06-25", bulan:5, unit:"UIP JBB",        lokasi:"Tanah Tanjung Barat",                 suratBaru:true},
  {no:39, tgl:"2026-06-25", bulan:5, unit:"PLN NP",         lokasi:"Lahan UP Bakaru Jl. Poros Bakaru",    suratBaru:true},
  {no:40, tgl:"2026-06-25", bulan:5, unit:"PLN NP",         lokasi:"Lahan UP Bakaru Kel. Betteng"},
  {no:41, tgl:"2026-06-25", bulan:5, unit:"PLN NP",         lokasi:"Lahan UP Bakaru, Sabbang Paru"},
  {no:42, tgl:"2026-06-25", bulan:5, unit:"PLN NP",         lokasi:"Lahan UP Bakaru, Kel. Tadokkong"},
  {no:43, tgl:"2026-06-25", bulan:5, unit:"Kantor Pusat",   lokasi:"Tanah PLTMG Jayapura",                suratBaru:true},
  {no:44, tgl:"2026-06-25", bulan:5, unit:"Kantor Pusat",   lokasi:"Tanah PLTMG Nabire-2"},
  {no:45, tgl:"2026-06-25", bulan:5, unit:"Kantor Pusat",   lokasi:"Tanah PLTMG Biak"},
  {no:46, tgl:"2026-06-25", bulan:5, unit:"Kantor Pusat",   lokasi:"Tanah PLTMG Manokwari"},
  {no:47, tgl:"2026-07-23", bulan:6, unit:"UID Jatim",      lokasi:"Eks Kantor Rayon Dinoyo",             suratBaru:true},
  {no:48, tgl:"2026-07-23", bulan:6, unit:"UID Jaya",       lokasi:"Rumah Modernland",                    suratBaru:true},
  {no:49, tgl:"2026-07-23", bulan:6, unit:"UID Jatim",      lokasi:"Tanah Gardu No. 31, Klojen, Malang",  suratBaru:true},
  {no:50, tgl:"2026-07-23", bulan:6, unit:"UIP3B su",       lokasi:"Rumah Dinas A8",                      suratBaru:true},
  {no:51, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah PLN UPT Surabaya",              suratBaru:true},
  {no:52, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah dan Bangunan Depan GI Blimbing"},
  {no:53, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah PLN UPT Malang"},
  {no:54, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah Gardu Induk Sekarputih"},
  {no:55, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah PLN UPT Probolinggo"},
  {no:56, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah Gardu Induk Jember"},
  {no:57, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah Gardu Induk Kapal"},
  {no:58, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah Gardu Induk Segoromadu"},
  {no:59, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah Gardu Induk Sampang"},
  {no:60, tgl:"2026-07-23", bulan:6, unit:"UIT JBM",        lokasi:"Tanah Gardu Induk Segoromadu - 2"},
  {no:61, tgl:"2026-07-28", bulan:6, unit:"UID Yogyakarta", lokasi:"Eks Gedung ULP Yogyakarta",           suratBaru:true},
  {no:62, tgl:"2026-07-28", bulan:6, unit:"UID Yogyakarta", lokasi:"Eks Kantor Jaga Krajan, Kalasan"},
  {no:63, tgl:"2026-07-28", bulan:6, unit:"UID Yogyakarta", lokasi:"Eks UP3 Sedayu"}
];
