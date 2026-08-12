/* ══════════════════════════════════════════════════════════════════
   izin-fetch.js — Ambil data Izin Prinsip langsung dari Google Sheets

   Sumber: file yang sama dengan data pendapatan, tab "Rekap 5105000101",
   rentang B151:F214 (baris 151 = header, 152–214 = 63 baris aset).

   Tiga hal yang membuat rentang ini tidak bisa dibaca lurus begitu saja:

   1. KOLOM TANGGAL TER-MERGE. Hanya baris pertama tiap surat yang berisi
      tanggal; baris berikutnya kosong. Google mengirim sel kosong apa
      adanya, jadi tanggal harus diisi turun (forward-fill) — kalau tidak,
      31 dari 63 aset akan kehilangan bulan dan grafik tren jadi salah.
      Sel tanggal yang terisi sekaligus menandai AWAL SURAT BARU, dan
      itulah dasar penghitungan "jumlah surat".

   2. KOLOM D TERSEMBUNYI. Rentang B:F berisi lima kolom (B,C,D,E,F) dan
      Google tetap mengirim kolom D yang disembunyikan. Karena itu posisi
      kolom tidak di-hardcode, melainkan dikenali dari isinya.

   3. FORMAT TANGGAL BERUBAH-UBAH. gviz bisa mengirim "Date(2026,0,6)",
      objek tanggal, atau teks "6 Januari 2026" tergantung format sel.
      Ketiganya ditangani.
   ══════════════════════════════════════════════════════════════════ */

const IZIN_FILE_ID = "1pJ7S4GBoa8O0Fi-KOsVtTlOzBZSnsAQ0ea9bUS-v5F4";
const IZIN_GID     = "1664615468";
const IZIN_RANGE   = "B151:F214";
const IZIN_TIMEOUT_MS = 12000;

const BLN_NAMA = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function izTeks(row, i){
  const c = row && row.c && row.c[i];
  if(!c) return '';
  const v = (c.f !== undefined && c.f !== null && c.f !== '') ? c.f : c.v;
  if(v === null || v === undefined) return '';
  return String(v).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
}

/* Kembalikan {y,m,d} atau null. Menerima "Date(2026,0,6)", objek Date,
   angka serial, dan teks berbahasa Indonesia "6 Januari 2026". */
function izTanggal(row, i){
  const c = row && row.c && row.c[i];
  if(!c) return null;
  const v = c.v;

  if(v instanceof Date && !isNaN(v)) return {y:v.getFullYear(), m:v.getMonth(), d:v.getDate()};

  if(typeof v === 'string'){
    const g = v.match(/^Date\((\d+),(\d+),(\d+)/);
    if(g) return {y:+g[1], m:+g[2], d:+g[3]};
  }

  // Teks terformat, mis. "6 Januari 2026" (bisa ada di c.f)
  const t = izTeks(row, i);
  if(t){
    const g = t.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if(g){
      const mi = BLN_NAMA.findIndex(b => b.toLowerCase() === g[2].toLowerCase());
      if(mi > -1) return {y:+g[3], m:mi, d:+g[1]};
    }
    const g2 = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);  // 6/1/2026
    if(g2) return {y:+g2[3], m:+g2[2]-1, d:+g2[1]};
  }
  return null;
}

/* Kenali peran tiap kolom dari isinya, bukan dari posisinya. */
function izKenaliKolom(rows){
  const nKol = Math.max(...rows.map(r => (r && r.c) ? r.c.length : 0), 0);
  const skor = [];
  for(let c=0; c<nKol; c++){
    let tanggal=0, angka=0, unit=0, panjang=0, isi=0;
    for(const r of rows){
      const t = izTeks(r, c);
      if(t === '') continue;
      isi++;
      if(izTanggal(r, c)) tanggal++;
      if(/^\d+$/.test(t)) angka++;
      if(/^(UID|UIP|UIT|UIW|UIK|PLN|KANTOR PUSAT|PUSDIKLAT|PUSLITBANG|PUSHARLIS|PUSMANPRO|PUSERTIF)/i.test(t)) unit++;
      panjang += t.length;
    }
    skor.push({c, isi, tanggal, angka, unit, rata: isi ? panjang/isi : 0});
  }
  const pilih = (f) => skor.filter(s=>s.isi>0).sort(f)[0];
  const kTgl  = pilih((a,b)=> b.tanggal - a.tanggal);
  const kUnit = pilih((a,b)=> b.unit - a.unit);
  const kNo   = pilih((a,b)=> b.angka - a.angka);
  // Lokasi = kolom teks terpanjang yang bukan kolom unit
  const kLok  = skor.filter(s => s.isi>0 && s.c !== (kUnit&&kUnit.c)).sort((a,b)=> b.rata - a.rata)[0];

  if(!kUnit || !kUnit.unit) throw new Error('Kolom "Unit Induk" tidak ditemukan di rentang ' + IZIN_RANGE + '.');
  if(!kLok) throw new Error('Kolom "Lokasi Aset" tidak ditemukan di rentang ' + IZIN_RANGE + '.');
  return {
    no:  kNo  ? kNo.c  : -1,
    tgl: (kTgl && kTgl.tanggal) ? kTgl.c : -1,
    unit: kUnit.c,
    lokasi: kLok.c
  };
}

function izParse(resp){
  const rows = (resp.table && resp.table.rows) || [];
  if(!rows.length) throw new Error('Rentang ' + IZIN_RANGE + ' kosong.');

  const K = izKenaliKolom(rows);
  const out = [];
  let tglAktif = null;   // untuk mengisi turun sel tanggal yang ter-merge
  let no = 0;

  for(const r of rows){
    const unit   = izTeks(r, K.unit);
    const lokasi = izTeks(r, K.lokasi);

    // Lewati baris header dan baris kosong
    if(!unit || !lokasi) continue;
    if(/^UNIT\s*INDUK$/i.test(unit) || /^LOKASI\s*ASET$/i.test(lokasi)) continue;

    const tglBaris = K.tgl > -1 ? izTanggal(r, K.tgl) : null;
    const suratBaru = !!tglBaris;              // sel tanggal terisi = surat baru
    if(tglBaris) tglAktif = tglBaris;
    if(!tglAktif) continue;                    // aset sebelum tanggal pertama — abaikan

    no++;
    const pad = n => String(n).padStart(2,'0');
    out.push({
      no,
      tgl: `${tglAktif.y}-${pad(tglAktif.m+1)}-${pad(tglAktif.d)}`,
      bulan: tglAktif.m,
      unit, lokasi, suratBaru
    });
  }

  if(!out.length) throw new Error('Tidak ada baris aset yang terbaca dari ' + IZIN_RANGE + '.');
  return out;
}

function loadIzinData(onSuccess, onFailure){
  let done = false;
  const cbName = "__pln_izin_cb_" + Date.now();
  const timer = setTimeout(()=>{
    if(done) return; done = true;
    delete window[cbName];
    onFailure(new Error("Timeout — tidak ada respons dari Google Sheets dalam " + (IZIN_TIMEOUT_MS/1000) + " detik."));
  }, IZIN_TIMEOUT_MS);

  window[cbName] = function(resp){
    if(done) return; done = true;
    clearTimeout(timer);
    delete window[cbName];
    try{
      if(resp.status === 'error'){
        throw new Error((resp.errors && resp.errors[0] && resp.errors[0].detailed_message) || 'Google Sheets mengembalikan error.');
      }
      onSuccess(izParse(resp));
    }catch(e){ onFailure(e); }
  };

  const s = document.createElement('script');
  s.src = "https://docs.google.com/spreadsheets/d/" + IZIN_FILE_ID + "/gviz/tq?gid=" + IZIN_GID +
          "&range=" + IZIN_RANGE + "&headers=0&tqx=out:json;responseHandler:" + cbName;
  s.onerror = function(){
    if(done) return; done = true;
    clearTimeout(timer);
    delete window[cbName];
    onFailure(new Error("Gagal memuat script dari Google Sheets — periksa apakah sheet masih di-share publik."));
  };
  document.head.appendChild(s);
}
