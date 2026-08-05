/* ══ DATA IZIN PRINSIP — sumber: Daftar Persetujuan Izin Prinsip 2026 s.d. Bulan Juli.xlsx, sheet "Izin Prinsip" ══
   Setiap baris = satu aset. Kolom: [No, Bulan(1-12), Hari, SuratBaru(baris pertama kelompok surat), Unit Induk, Lokasi Aset, Kategori]
   Kategori dikelompokkan otomatis dari teks Lokasi Aset (Tanah/Rumah Dinas/Kantor/Gardu Induk/Mess/Lahan Pembangkit/Lainnya) — 
   koreksi manual di sini kalau ada yang salah kelompok. */
const IZIN_BULAN = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const IZIN_BULAN_S = ["","Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

const IZIN_ROWS = [
  [1,1,6,true,"UID Sumut","Space Kantor UP3 Medan","Kantor / Ruang Kerja"],
  [2,1,6,true,"UID Jateng","Eks Rumah Dinas Ir. Ramlan (JAJAR)","Rumah Dinas / Wisma"],
  [3,2,18,true,"UIP Sumbagteng","Kantor UPP Sumbagteng 2","Kantor / Ruang Kerja"],
  [4,2,23,true,"UIP JBT","Kantor UIP JBT","Kantor / Ruang Kerja"],
  [5,2,26,true,"UIP JBTB","Kantor UPP JBTB 1","Kantor / Ruang Kerja"],
  [6,2,26,true,"UID Sumut","Space Kantor UID Sumut","Kantor / Ruang Kerja"],
  [7,3,3,true,"Kantor Pusat","Tanah PLTMG Sambelia","Lahan Pembangkit"],
  [8,3,3,false,"Kantor Pusat","Tanah PLTMG Sumbawa 2","Lahan Pembangkit"],
  [9,3,14,true,"UID Sumut","Rumah Dinas Kisaran","Rumah Dinas / Wisma"],
  [10,3,14,false,"UID Sumut","Tanah Jl. Nias, Medan","Tanah Kosong"],
  [11,3,16,true,"Kantor Pusat","Tanah PLTD Lueng Bata","Lahan Pembangkit"],
  [12,3,16,false,"Kantor Pusat","Tanah GI Krueng Raya","Gardu Induk"],
  [13,3,16,false,"Kantor Pusat","Tanah GITET Ulee Kareng","Tanah Kosong"],
  [14,3,31,true,"UID Sumbar","Rumah Dinas Tan Malaka, Bukittinggi","Rumah Dinas / Wisma"],
  [15,5,6,true,"UIP3B Sum","Rumah Operator GI Salak","Gardu Induk"],
  [16,5,6,false,"UIP3B Sum","Rumah Operator GI Sidikalang","Gardu Induk"],
  [17,5,6,false,"UIP3B Sum","Rumah Operator GI Sibolga","Gardu Induk"],
  [18,5,6,false,"UIP3B Sum","Lahan Bangunan Koperasi UP2B","Lainnya"],
  [19,5,6,false,"UIP3B Sum","Ruang SP UP2B","Lainnya"],
  [20,5,6,true,"UIP JBB","Mess Elektrikal 2, Depok","Mess"],
  [21,5,6,false,"UIP JBB","Mess Elektrikal 3, Depok","Mess"],
  [22,5,6,false,"UIP JBB","Mess Elektrikal 4, Depok","Mess"],
  [23,5,6,false,"UIP JBB","Mess Elektrikal 5, Depok","Mess"],
  [24,5,6,false,"UIP JBB","Mess Elektrikal 6, Depok","Mess"],
  [25,5,6,false,"UIP JBB","Kantor UIP JBB","Kantor / Ruang Kerja"],
  [26,5,6,false,"UIP JBB","Tanah Bendungan Hilir, Jakarta Pusat","Tanah Kosong"],
  [27,5,7,true,"UID Jaya","Space Kantor UID Jaya","Kantor / Ruang Kerja"],
  [28,5,13,true,"Kantor Pusat","Tanah PLTGU Belawan","Lahan Pembangkit"],
  [29,5,13,true,"Pusdiklat","Space Parkir Kantor Pusdiklat","Kantor / Ruang Kerja"],
  [30,5,20,true,"UIP JBT","Tanah Akses Jalan PLTU Indramayu","Lahan Pembangkit"],
  [31,6,8,true,"UIP3B Sul","Tanah Tello","Tanah Kosong"],
  [32,6,8,true,"UID Sumut","Tanah Jl. Meranti","Tanah Kosong"],
  [33,6,8,true,"UIP JBB","Tanah Andara, Jakarta Selatan","Tanah Kosong"],
  [34,6,25,true,"UID BALI","Tanah Kosong Desa Kutampi","Tanah Kosong"],
  [35,6,25,true,"UID Jateng","Eks Rumah Dinas , Ngarus, Pati","Rumah Dinas / Wisma"],
  [36,6,25,true,"UIP JBB","Mess Elektrikal IV","Mess"],
  [37,6,25,true,"UIP JBB","Tanah Marunda","Tanah Kosong"],
  [38,6,25,true,"UIP JBB","Tanah Tanjung Barat","Tanah Kosong"],
  [39,6,25,true,"PLN NP","Lahan UP Bakaru Jl. Poros Bakaru","Lainnya"],
  [40,6,25,false,"PLN NP","Lahan UP Bakaru Kel. Betteng","Lainnya"],
  [41,6,25,false,"PLN NP","Lahan UP Bakaru, Sabbang Paru","Lainnya"],
  [42,6,25,false,"PLN NP","Lahan UP Bakaru, Kel. Tadokkong","Lainnya"],
  [43,6,25,true,"Kantor Pusat","PLTMG Jayapura","Lahan Pembangkit"],
  [44,6,25,false,"Kantor Pusat","PLTMG Nabire-2","Lahan Pembangkit"],
  [45,6,25,false,"Kantor Pusat","PLTMG Biak","Lahan Pembangkit"],
  [46,6,25,false,"Kantor Pusat","PLTMG Manokwari","Lahan Pembangkit"],
  [47,7,23,true,"UID Jatim","Eks Kantor Rayon Dinoyo","Kantor / Ruang Kerja"],
  [48,7,23,true,"UID Jaya","Rumah Modernland","Lainnya"],
  [49,7,23,true,"UID Jatim","Tanah Gardu No. 31, Klojen, Malang","Tanah Kosong"],
  [50,7,23,true,"UIP3B Sum","Rumah Dinas A8","Rumah Dinas / Wisma"],
  [51,7,23,true,"UIT JBM","Tanah PLN UPT Surabaya","Kantor / Ruang Kerja"],
  [52,7,23,false,"UIT JBM","Tanah dan Bangunan Depan GI Blimbing","Gardu Induk"],
  [53,7,23,false,"UIT JBM","Tanah PLN UPT Malang","Kantor / Ruang Kerja"],
  [54,7,23,false,"UIT JBM","Tanah Gardu Induk Sekarputih","Gardu Induk"],
  [55,7,23,false,"UIT JBM","Tanah PLN UPT Probolinggo","Kantor / Ruang Kerja"],
  [56,7,23,false,"UIT JBM","Tanah Gardu Induk Jember","Gardu Induk"],
  [57,7,23,false,"UIT JBM","Tanah Gardu Induk Kapal","Gardu Induk"],
  [58,7,23,false,"UIT JBM","Tanah Gardu Induk Segoromadu","Gardu Induk"],
  [59,7,23,false,"UIT JBM","Tanah Gardu Induk Sampang","Gardu Induk"],
  [60,7,23,false,"UIT JBM","Tanah Gardu Induk Segoromadu - 2","Gardu Induk"],
  [61,7,28,true,"UID Yogyakarta","Eks Gedung ULP Yogyakarta","Kantor / Ruang Kerja"],
  [62,7,28,false,"UID Yogyakarta","Eks Kantor Jaga Krajan, Kalasan","Kantor / Ruang Kerja"],
  [63,7,28,false,"UID Yogyakarta","Eks UP3 Sedayu","Kantor / Ruang Kerja"]
];

/* Agregasi (dihitung dari IZIN_ROWS saat load) */
const IZIN_AGG = (function(){
  const totalAset = IZIN_ROWS.length;
  const totalSurat = IZIN_ROWS.filter(r=>r[3]).length;
  const perBulan = {}; for(let b=1;b<=7;b++) perBulan[b]=0;
  IZIN_ROWS.forEach(r=>{ perBulan[r[1]] = (perBulan[r[1]]||0)+1; });
  const perUnit = {};
  IZIN_ROWS.forEach(r=>{ perUnit[r[4]] = (perUnit[r[4]]||0)+1; });
  const perKategori = {};
  IZIN_ROWS.forEach(r=>{ perKategori[r[6]] = (perKategori[r[6]]||0)+1; });
  const unitTerbanyak = Object.entries(perUnit).sort((a,b)=>b[1]-a[1])[0];
  return { totalAset, totalSurat, rataRata: totalAset/totalSurat, perBulan, perUnit, perKategori, unitTerbanyak };
})();
