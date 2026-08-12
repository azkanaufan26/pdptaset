/* ══════════════════════════════════════════════════════════════════
   izin-prinsip.js — Dashboard & tabel Realisasi Persetujuan Izin Prinsip

   Data diambil langsung dari Google Sheets lewat izin-fetch.js;
   kalau gagal, jatuh ke FALLBACK_IZIN di data-izin-prinsip.js.
   ══════════════════════════════════════════════════════════════════ */

const IZ_BULAN   = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const IZ_BULAN_S = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

/* ── Penyeragaman nama unit ────────────────────────────────────────
   Di sheet, unit yang sama kadang ditulis berbeda ("UID Jateng" /
   "UID JATENG", "UIP3B Sum" / "UIP3B su"). Tanpa penyeragaman, satu
   unit akan terhitung sebagai dua baris berbeda di distribusi.
   Kunci di kiri = hasil normalisasi (huruf besar, spasi dirapatkan). */
const IZ_ALIAS = {
  "UIP3B SU":  "UIP3B Sum",
  "UIP3B SUM": "UIP3B Sum",
  "UIP3B SUL": "UIP3B Sul",
  "UID JATENG":"UID Jateng",
  "UID BALI":  "UID Bali",
  "UID JAYA":  "UID Jaya",
  "PUSDIKLAT": "Pusdiklat"
};
function izUnitRapi(nama){
  const N = String(nama).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
  if(IZ_ALIAS[N]) return IZ_ALIAS[N];
  return String(nama).replace(/\s+/g,' ').trim();
}

/* ── Aturan kategori jenis aset ────────────────────────────────────
   Dicocokkan BERURUTAN — aturan pertama yang cocok yang dipakai,
   jadi urutannya menentukan. Ubah/tambah di sini kalau ada aset yang
   salah kelompok; tidak perlu menyentuh bagian lain.
   Catatan: aturan ini disusun ulang dari teks lokasi, jadi hasilnya
   bisa berbeda dari pengelompokan versi sebelumnya. Angka per kategori
   ditampilkan di legenda supaya mudah diperiksa. */
const IZ_KATEGORI = [
  { nama:"Mess",                 warna:"#F59E0B", uji:/\bMESS\b/ },
  { nama:"Rumah Dinas / Wisma",  warna:"#16A34A", uji:/RUMAH DINAS|WISMA|RUMAH OPERATOR|\bRUMAH\b/ },
  { nama:"Gardu Induk",          warna:"#17A5C4", uji:/GARDU|GITET|\bGI\b/ },
  { nama:"Lahan Pembangkit",     warna:"#0B2A66", uji:/PLTMG|PLTGU|PLTU|PLTD|PLTA|PEMBANGKIT|BAKARU/ },
  { nama:"Kantor / Ruang Kerja", warna:"#1B62D6", uji:/KANTOR|RUANG|GEDUNG|\bUPT\b|\bUP3\b|\bULP\b|\bUPP\b|SPACE|PARKIR/ },
  { nama:"Tanah Kosong",         warna:"#93C5FD", teks:"#2563EB", uji:/TANAH|LAHAN/ },
  { nama:"Lainnya",              warna:"#94A3B8", teks:"#475569", uji:/.*/ }
];
/* Kunci koreksi manual: teks lokasi diseragamkan dulu (huruf besar,
   spasi dirapatkan, tanda baca di ujung dibuang) supaya "Tanah Tello"
   dan "Tanah  Tello ," tetap cocok ke entri yang sama. */
function izKunci(lokasi){
  return String(lokasi).replace(/\u00a0/g,' ').replace(/\s+/g,' ')
    .replace(/[.,;:\-\s]+$/,'').trim().toUpperCase();
}
function izKategori(lokasi){
  // 1) Koreksi manual menang atas aturan apa pun (lihat IZ_KOREKSI di data-izin-prinsip.js)
  if(typeof IZ_KOREKSI !== 'undefined'){
    const nama = IZ_KOREKSI[izKunci(lokasi)];
    if(nama){
      const k = IZ_KATEGORI.find(x=>x.nama===nama);
      if(k) return k;
    }
  }
  // 2) Aturan kata kunci
  const L = String(lokasi).toUpperCase();
  for(const k of IZ_KATEGORI){ if(k.uji.test(L)) return k; }
  return IZ_KATEGORI[IZ_KATEGORI.length-1];
}

/* ── Keadaan modul ── */
let IZIN = [];
let izinSumber = "";
let izinCariTeks = "";
let izinFilterUnit = "semua";

/* ══ Ringkasan angka ══ */
function izRingkas(rows){
  const surat  = rows.filter(r=>r.suratBaru).length || 0;
  const perBln = Array(12).fill(0);
  rows.forEach(r=>{ if(r.bulan>=0 && r.bulan<12) perBln[r.bulan]++; });

  const perUnit = {};
  rows.forEach(r=>{ const u = izUnitRapi(r.unit); perUnit[u] = (perUnit[u]||0)+1; });
  const unitUrut = Object.entries(perUnit).sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0],'id'));

  const perKat = {};
  rows.forEach(r=>{ const k = izKategori(r.lokasi).nama; perKat[k] = (perKat[k]||0)+1; });
  const katUrut = IZ_KATEGORI.filter(k=>perKat[k.nama]).map(k=>({...k, n:perKat[k.nama]})).sort((a,b)=>b.n-a.n);

  let bulanTerakhir = 0;
  for(let i=0;i<12;i++) if(perBln[i]>0) bulanTerakhir = i;

  return { surat, aset:rows.length, perBln, unitUrut, katUrut, bulanTerakhir };
}

/* ══ KPI ══ */
function izRenderKpi(R){
  const rata = R.surat ? R.aset/R.surat : 0;
  const top  = R.unitUrut[0];
  const kartu = [
    {bg:"#EFF5FF", st:"#1B62D6", path:"M4 3h8v10H4V3Zm2 3h4M6 8h4M6 11h2", lbl:"Total Surat Izin Prinsip",
     big:`${R.surat}`, warna:"#0B2A66", cap:`surat terbit Jan–${IZ_BULAN[R.bulanTerakhir]} 2026`},
    {bg:"#ECFDF3", st:"#16A34A", path:"M3 8l3 3 7-7", lbl:"Total Aset Tercakup",
     big:`${R.aset}`, warna:"#16A34A", cap:`aset dalam ${R.surat} surat`},
    {bg:"#FFF7E6", st:"#F59E0B", path:"M8 2v12M2 8h12", lbl:"Rata-rata Aset / Surat",
     big:`${rata.toLocaleString('id-ID',{maximumFractionDigits:1})}`, warna:"#F59E0B", cap:"aset per surat izin prinsip"},
    {bg:"#F5F0FF", st:"#7C3AED", path:"M2 14V8l6-6 6 6v6H2Z", lbl:"Unit Teraktif",
     big:top?top[0]:"—", warna:"#7C3AED", cap:top?`${top[1]} aset — terbanyak`:"belum ada data"}
  ];
  el('izinKpi').innerHTML = kartu.map(k=>`<div class="card"><div class="kpi">
    <span class="ic" style="background:${k.bg}"><svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="${k.st}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${k.path}"/></svg></span>
    <div style="min-width:0"><p class="lbl">${k.lbl}</p><p class="big" style="color:${k.warna};${k.big.length>9?'font-size:19px':''}">${k.big}</p><p class="cap">${k.cap}</p></div></div></div>`).join('');
}

/* ══ Tren bulanan ══ */
function izRenderTren(R){
  const n = R.bulanTerakhir + 1;
  const data = R.perBln.slice(0, n);
  const maks = Math.max(...data, 1);
  const W=560,H=250,L=18,Rg=14,T=26,B=30,iw=W-L-Rg,ih=H-T-B;
  const bw = iw/n*0.5;
  const x = i => L + iw/n*i + iw/n/2;
  const y = v => T + ih - (v/maks)*ih;

  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren jumlah aset izin prinsip per bulan">`;
  s += `<line x1="${L}" y1="${T+ih}" x2="${W-Rg}" y2="${T+ih}" stroke="#E5EAF1"/>`;
  data.forEach((v,i)=>{
    const nol = v===0;
    if(!nol) s += `<rect x="${x(i)-bw/2}" y="${y(v)}" width="${bw}" height="${T+ih-y(v)}" rx="3" fill="#1B62D6"/>`;
    s += `<text x="${x(i)}" y="${nol ? T+ih-7 : y(v)-7}" text-anchor="middle" font-size="11" font-weight="700" fill="${nol?'#DC2626':'#0F172A'}">${v}</text>`;
    s += `<text x="${x(i)}" y="${H-9}" text-anchor="middle" font-size="10" fill="${nol?'#DC2626':'#64748B'}">${IZ_BULAN_S[i]}</text>`;
  });
  el('izinChartTren').innerHTML = s + `</svg>`;

  const kosong = [];
  for(let i=0;i<n;i++) if(R.perBln[i]===0) kosong.push(IZ_BULAN[i]);
  el('izinTrenNote').innerHTML = kosong.length
    ? `Tidak ada surat izin prinsip terbit di bulan <b>${kosong.join(', ')}</b> — perlu dicek apakah karena memang tidak ada permohonan, atau proses tertunda.`
    : `Surat izin prinsip terbit di seluruh bulan Januari–${IZ_BULAN[R.bulanTerakhir]}.`;
}

/* ══ Distribusi per unit induk ══ */
function izRenderUnit(R){
  const maks = R.unitUrut[0] ? R.unitUrut[0][1] : 1;
  el('izinUnitList').innerHTML = R.unitUrut.map(([nama,n])=>
    `<li><span class="nm" title="${nama}">${nama}</span>
      <span class="br"><i style="width:${n/maks*100}%"></i></span>
      <b>${n}</b></li>`).join('');
  el('izinUnitTitle').innerHTML = `Distribusi per Unit Induk <span style="font-size:11px;font-weight:600">↗</span>`;
}

/* ══ Donut kategori ══ */
function izRenderKategori(R){
  const total = R.aset || 1;
  const S=190, cx=S/2, cy=S/2, rl=74, rd=46;
  let sudut = -Math.PI/2, s = `<svg class="chart" viewBox="0 0 ${S} ${S}" style="max-width:200px;margin:0 auto" role="img" aria-label="Sebaran kategori jenis aset">`;
  R.katUrut.forEach(k=>{
    const bagian = k.n/total*Math.PI*2;
    const a1 = sudut, a2 = sudut + bagian;
    const besar = bagian > Math.PI ? 1 : 0;
    const p = (r,a)=>`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
    s += `<path d="M ${p(rl,a1)} A ${rl} ${rl} 0 ${besar} 1 ${p(rl,a2)} L ${p(rd,a2)} A ${rd} ${rd} 0 ${besar} 0 ${p(rd,a1)} Z" fill="${k.warna}"/>`;
    sudut = a2;
  });
  s += `<text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="26" font-weight="800" fill="#0B2A66">${R.aset}</text>`;
  s += `<text x="${cx}" y="${cy+15}" text-anchor="middle" font-size="10" fill="#64748B">aset</text></svg>`;
  el('izinChartKategori').innerHTML = s;

  el('izinKategoriLegend').innerHTML = R.katUrut.map(k=>
    `<li><i style="background:${k.warna}"></i>${k.nama}<b>${k.n}</b><span class="pct">${Math.round(k.n/total*100)}%</span></li>`).join('');
}

/* ══ Tabel lengkap (view "Izin Prinsip" di menu) ══ */
function izRenderTabel(){
  const cari = izinCariTeks.trim().toLowerCase();
  const rows = IZIN.filter(r=>{
    const unitOk = izinFilterUnit==='semua' || izUnitRapi(r.unit)===izinFilterUnit;
    const cariOk = cari==='' || (r.lokasi+' '+r.unit).toLowerCase().indexOf(cari) > -1;
    return unitOk && cariOk;
  });

  const tglIndo = t => {
    const g = String(t).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return g ? `${+g[3]} ${IZ_BULAN[+g[2]-1]} ${g[1]}` : t;
  };

  el('izinTabel').innerHTML =
    `<thead><tr>
      <th style="width:34px">No.</th>
      <th style="min-width:120px">Tanggal Surat</th>
      <th style="min-width:120px">Unit Induk</th>
      <th style="min-width:230px">Lokasi Aset</th>
      <th>Kategori</th>
    </tr></thead>
    <tbody>${rows.length ? rows.map((r,i)=>{
      const k = izKategori(r.lokasi);
      return `<tr${r.suratBaru && i>0 ? ' style="border-top:2px solid #E5EAF1"':''}>
        <td style="color:#94A3B8">${r.no}</td>
        <td${r.suratBaru?' style="font-weight:600"':' style="color:#94A3B8"'}>${r.suratBaru?tglIndo(r.tgl):'↑ surat sama'}</td>
        <td>${izUnitRapi(r.unit)}</td>
        <td>${r.lokasi}</td>
        <td><span class="izin-tag" style="background:${k.warna}1F;color:${k.teks||k.warna}">${k.nama}</span></td>
      </tr>`;}).join('')
      : `<tr><td colspan="5" style="padding:16px;color:#64748B">Tidak ada aset yang cocok dengan pencarian.</td></tr>`}
    </tbody>`;

  const surat = rows.filter(r=>r.suratBaru).length;
  el('izinTabelCount').innerHTML = `<b>${rows.length}</b> aset dari ${IZIN.length} · ${surat} surat`;
}

function izIsiFilterUnit(R){
  const sel = el('izinFilterUnit');
  if(!sel) return;
  sel.innerHTML = `<option value="semua">Semua unit</option>` +
    R.unitUrut.map(([nama,n])=>`<option value="${nama}">${nama} (${n})</option>`).join('');
  sel.value = izinFilterUnit;
}

/* ══ Modal daftar lengkap (dipicu dari judul distribusi unit) ══ */
function izRenderModal(){
  const tglIndo = t => {
    const g = String(t).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return g ? `${+g[3]} ${IZ_BULAN[+g[2]-1]} ${g[1]}` : t;
  };
  el('izinModalBody').innerHTML =
    `<table><thead><tr><th style="width:34px">No.</th><th>Tanggal Surat</th><th>Unit Induk</th><th>Lokasi Aset</th><th>Kategori</th></tr></thead>
     <tbody>${IZIN.map(r=>{
       const k = izKategori(r.lokasi);
       return `<tr><td style="color:#94A3B8">${r.no}</td><td>${r.suratBaru?tglIndo(r.tgl):''}</td><td>${izUnitRapi(r.unit)}</td><td>${r.lokasi}</td>
         <td><span class="izin-tag" style="background:${k.warna}1F;color:${k.teks||k.warna}">${k.nama}</span></td></tr>`;}).join('')}
     </tbody></table>`;
  const h = document.querySelector('.izin-modal-head h3');
  if(h) h.textContent = `Daftar Lengkap Izin Prinsip — ${IZIN.length} Aset`;
}

/* ══ Render seluruh bagian izin prinsip ══ */
function renderIzin(){
  if(!IZIN.length) return;
  const R = izRingkas(IZIN);
  izRenderKpi(R);
  izRenderTren(R);
  izRenderUnit(R);
  izRenderKategori(R);
  izIsiFilterUnit(R);
  izRenderTabel();
  izRenderModal();

  ['izinSumber','izinSumber2'].forEach(id=>{ const sb = el(id); if(sb) sb.innerHTML = izinSumber; });
}

/* ══ Boot ══ */
function izBoot(rows, live, pesan){
  IZIN = rows;
  izinSumber = live
    ? `Sumber: Google Sheets — Rekap 5105000101, rentang ${IZIN_RANGE} (diambil otomatis).`
    : `Sumber: data cadangan lokal — pengambilan langsung gagal (${pesan||'sebab tidak diketahui'}).`;
  try{ renderIzin(); }
  catch(e){
    console.error('Render izin prinsip gagal:', e);
    ['izinSumber','izinSumber2'].forEach(id=>{ const sb = el(id);
      if(sb) sb.innerHTML = `<span style="color:#B91C1C">Gagal menampilkan data izin prinsip: ${e.message}</span>`; });
  }
}

function izWire(){
  const judul = el('izinUnitTitle');
  const ov = el('izinModalOverlay');
  if(judul && ov){
    const buka  = ()=>{ ov.style.display = 'flex'; document.body.style.overflow = 'hidden'; };
    const tutup = ()=>{ ov.style.display = 'none';  document.body.style.overflow = ''; };
    judul.style.cursor = 'pointer';
    judul.title = 'Klik untuk lihat daftar lengkap aset';
    judul.onclick = buka;
    const btn = el('izinModalClose');
    if(btn) btn.onclick = tutup;
    ov.onclick = e =>{ if(e.target === ov) tutup(); };
    document.addEventListener('keydown', e =>{ if(e.key === 'Escape' && ov.style.display === 'flex') tutup(); });
  }
  const cari = el('izinCari');
  if(cari){ let t; cari.addEventListener('input', e=>{ clearTimeout(t); izinCariTeks = e.target.value; t = setTimeout(izRenderTabel, 180); }); }
  const sel = el('izinFilterUnit');
  if(sel) sel.onchange = e =>{ izinFilterUnit = e.target.value; izRenderTabel(); };
}

function izMulai(){
  izWire();
  if(typeof loadIzinData === 'function'){
    loadIzinData(
      rows => izBoot(rows, true),
      err  => izBoot(typeof FALLBACK_IZIN !== 'undefined' ? FALLBACK_IZIN : [], false, err.message)
    );
  }else{
    izBoot(typeof FALLBACK_IZIN !== 'undefined' ? FALLBACK_IZIN : [], false, 'izin-fetch.js tidak dimuat');
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', izMulai);
else izMulai();
