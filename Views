/* ══════════════════════════════════════════════════════════════════
   views.js — routing antar halaman + view "Realisasi" dan "Analisis"

   Dimuat PALING AKHIR, setelah app.js dan izin-prinsip.js, supaya
   seluruh data (TAHUN, DATA_2025) dan seluruh elemen DOM sudah siap.

   File ini TIDAK mengubah logika perhitungan yang sudah ada — ia hanya
   membaca hasil parsing yang sudah tersimpan di TAHUN[tahun].
   ══════════════════════════════════════════════════════════════════ */

/* ── Judul topbar per halaman ── */
const JUDUL_VIEW = {
  'home':            ['Dashboard Monitoring Aset Properti', 'Pilih dashboard yang ingin ditampilkan.'],
  'dash-pendapatan': ['Dashboard Monitoring Pendapatan Aset Properti', 'KPI Beyond kWh — Pendayagunaan Aset Properti (Tanah dan Bangunan) PLN Group'],
  'dash-izin':       ['Dashboard Realisasi Persetujuan Izin Prinsip', 'Persetujuan izin prinsip pendayagunaan aset properti PLN Group'],
  'tabel-realisasi': ['Realisasi Pendayagunaan Aset Properti', 'Data lengkap seluruh unit induk, pusat-pusat, dan anak perusahaan'],
  'tabel-izin':      ['Realisasi Persetujuan Izin Prinsip', 'Daftar lengkap surat dan aset izin prinsip seluruh unit induk'],
  'analisis':        ['Analisis Realisasi Pendayagunaan Aset Properti', 'Pembacaan atas capaian, sebaran, dan risiko pencapaian target tahunan']
};
/* Halaman yang memakai baris filter di atas */
const VIEW_PAKAI_FILTER = { 'dash-pendapatan':true, 'tabel-realisasi':true, 'analisis':true };
/* Halaman yang memakai dropdown Unit (hanya dashboard pendapatan yang punya grafik per unit) */
const VIEW_PAKAI_UNIT = { 'dash-pendapatan':true };
/* Menu mana yang disorot untuk tiap halaman */
const NAV_UNTUK_VIEW = { 'home':'home', 'dash-pendapatan':'home', 'dash-izin':'home',
                         'tabel-realisasi':'tabel-realisasi', 'tabel-izin':'tabel-izin', 'analisis':'analisis' };

let viewAktif = 'home';

function gantiView(v){
  if(!JUDUL_VIEW[v]) v = 'home';
  viewAktif = v;

  document.querySelectorAll('[data-view]').forEach(s=>s.classList.toggle('on', s.dataset.view===v));
  document.querySelectorAll('.nav a[data-nav]').forEach(a=>a.classList.toggle('on', a.dataset.nav===NAV_UNTUK_VIEW[v]));

  const j = JUDUL_VIEW[v];
  const jh = document.getElementById('judulHalaman'), sh = document.getElementById('subHalaman');
  if(jh) jh.textContent = j[0];
  if(sh) sh.textContent = j[1];

  const per = document.querySelector('.per');
  if(per) per.style.display = (v==='home') ? 'none' : '';

  const fb = document.getElementById('filterBar');
  if(fb) fb.hidden = !VIEW_PAKAI_FILTER[v];
  const fu = document.getElementById('fUnitWrap');
  if(fu) fu.style.display = VIEW_PAKAI_UNIT[v] ? '' : 'none';

  // Status bar live hanya relevan untuk halaman yang memakai data pendapatan
  const lb = document.getElementById('liveStatus');
  if(lb) lb.style.display = (v==='dash-izin' || v==='tabel-izin' || v==='home') ? 'none' : '';

  if(v==='tabel-realisasi') renderTabelRealisasi();
  if(v==='analisis') renderAnalisis();
  if((v==='tabel-izin' || v==='dash-izin') && typeof renderIzin === 'function' && IZIN.length) renderIzin();

  window.scrollTo({top:0, behavior:'auto'});
  if(location.hash.slice(1) !== v) history.replaceState(null,'','#'+v);
}

/* ══════════════════════════════════════════════════════════════════
   VIEW: Realisasi — tabel lengkap seluruh unit
   ══════════════════════════════════════════════════════════════════ */

let tblCari = '';
let tblMode = 'kum';                       // 'kum' = kumulatif, 'bln' = tambahan per bulan
let tblSort = { kol:'total', arah:'desc' };  // kol: 'nama' | 'grup' | 'total' | angka indeks bulan

const RIBU = n => Math.round(n/1e6).toLocaleString('id-ID');

/* Ubah deret kumulatif jadi tambahan per bulan */
function keTambahan(v){ return v.map((n,i)=> i===0 ? n : n - v[i-1]); }

function lingkupTabel(){
  const cfg = TAHUN[fTahun];
  const cari = tblCari.trim().toLowerCase();
  return cfg.units.filter(d =>
    (fKelompok==='semua' || d.grup===fKelompok) &&
    (cari==='' || d.nama.toLowerCase().indexOf(cari) > -1));
}

function urutkan(rows, m){
  const arah = tblSort.arah==='asc' ? 1 : -1;
  return rows.slice().sort((a,b)=>{
    let x, y;
    if(tblSort.kol==='nama'){ return a.nama.localeCompare(b.nama,'id') * arah; }
    if(tblSort.kol==='grup'){ const c=a.grup.localeCompare(b.grup,'id'); return (c!==0?c:a.nama.localeCompare(b.nama,'id')) * arah; }
    if(tblSort.kol==='total'){ x=a.v[m]||0; y=b.v[m]||0; }
    else { const i=+tblSort.kol; const av=tblMode==='bln'?keTambahan(a.v):a.v, bv=tblMode==='bln'?keTambahan(b.v):b.v; x=av[i]||0; y=bv[i]||0; }
    return (x-y) * arah;
  });
}

function renderTabelRealisasi(){
  const cfg = TAHUN[fTahun];
  if(!cfg) return;
  const n = cfg.n, m = Math.min(fBulan, n-1);
  const rows = urutkan(lingkupTabel(), m);
  const totalLingkup = rows.reduce((a,d)=>a+(d.v[m]||0), 0);
  const totalSemua = cfg.kum[m] || 1;

  const panah = k => tblSort.kol===String(k) ? `<span class="ar">${tblSort.arah==='asc'?'▲':'▼'}</span>` : '';
  const kelas = k => tblSort.kol===String(k) ? ' class="sorted"' : '';

  let head = `<thead><tr>
    <th style="width:26px">#</th>
    <th${tblSort.kol==='nama'?' class="sorted unm"':' class="unm"'} data-sort="nama" style="min-width:170px">Unit${panah('nama')}</th>
    <th${kelas('grup')} data-sort="grup">Kelompok${panah('grup')}</th>`;
  for(let i=0;i<n;i++) head += `<th${kelas(i)} data-sort="${i}" class="num${tblSort.kol===String(i)?' sorted':''}" style="text-align:right">${BULAN_S[i]}${panah(i)}</th>`;
  head += `<th${kelas('total')} data-sort="total" class="num${tblSort.kol==='total'?' sorted':''}" style="text-align:right">s.d. ${BULAN_S[m]}${panah('total')}</th>
    <th class="num" style="text-align:right">% Kontribusi</th></tr></thead>`;

  const body = rows.map((d,idx)=>{
    const seri = tblMode==='bln' ? keTambahan(d.v) : d.v;
    let tds = '';
    for(let i=0;i<n;i++){
      const val = seri[i]||0;
      const warna = val < 0 ? ' style="text-align:right;color:#B91C1C"' : (val===0 ? ' style="text-align:right;color:#CBD5E1"' : ' style="text-align:right"');
      tds += `<td class="num"${warna}>${val===0?'–':RIBU(val)}</td>`;
    }
    const kontrib = totalSemua ? (d.v[m]||0)/totalSemua*100 : 0;
    return `<tr>
      <td style="color:#94A3B8">${idx+1}</td>
      <td class="unm">${d.nama}</td>
      <td><span class="gpill">${d.grup}</span></td>
      ${tds}
      <td class="num" style="text-align:right;font-weight:700">${RIBU(d.v[m]||0)}</td>
      <td class="num" style="text-align:right;color:${kontrib>=5?'#0B2A66':'#64748B'}">${P(kontrib)}%</td>
    </tr>`;
  }).join('');

  // Baris total mengikuti mode tampilan
  let ftds = '';
  for(let i=0;i<n;i++){
    const jml = rows.reduce((a,d)=>{ const s = tblMode==='bln'?keTambahan(d.v):d.v; return a+(s[i]||0); },0);
    ftds += `<td class="num" style="text-align:right">${RIBU(jml)}</td>`;
  }
  const foot = `<tfoot><tr>
    <td></td><td class="unm" style="font-weight:800">TOTAL LINGKUP</td><td></td>
    ${ftds}
    <td class="num" style="text-align:right">${RIBU(totalLingkup)}</td>
    <td class="num" style="text-align:right">${P(totalSemua?totalLingkup/totalSemua*100:0)}%</td>
  </tr></tfoot>`;

  el('tblUnit').innerHTML = head + `<tbody>${body||`<tr><td colspan="${n+5}" style="padding:16px;color:#64748B">Tidak ada unit yang cocok dengan pencarian.</td></tr>`}</tbody>` + foot;
  el('tblCount').innerHTML = `<b>${rows.length}</b> dari ${cfg.units.length} unit · total lingkup <b>Rp ${M(totalLingkup)} M</b> (${P(totalSemua?totalLingkup/totalSemua*100:0)}% dari PLN Group)`;

  // Klik header untuk mengurutkan
  el('tblUnit').querySelectorAll('th[data-sort]').forEach(th=>{
    th.onclick = ()=>{
      const k = th.dataset.sort;
      if(tblSort.kol===k) tblSort.arah = tblSort.arah==='asc' ? 'desc' : 'asc';
      else { tblSort.kol = k; tblSort.arah = (k==='nama'||k==='grup') ? 'asc' : 'desc'; }
      renderTabelRealisasi();
    };
  });

  renderBarUnit(rows, m);
  renderLingkup(rows, m, n);
}

/* Batang horizontal: 15 unit teratas dalam lingkup */
function renderBarUnit(rows, m){
  const top = rows.slice().sort((a,b)=>(b.v[m]||0)-(a.v[m]||0)).slice(0,15);
  el('judulBarUnit').textContent = `Perbandingan Antar Unit — ${top.length} Terbesar (s.d. ${BULAN[m]})`;
  if(!top.length){ el('chartBarUnit').innerHTML = `<p style="font-size:11.5px;color:#64748B;margin:0">Tidak ada data untuk ditampilkan.</p>`; return; }

  const maks = top[0].v[m] || 1;
  const sk = skalaOtomatis(maks);
  const BH = 20, GAP = 6, L = 148, R = 62, W = 560, T = 6;
  const H = T + top.length*(BH+GAP);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Perbandingan realisasi antar unit">`;
  top.forEach((d,i)=>{
    const y = T + i*(BH+GAP);
    const w = Math.max((d.v[m]||0)/maks * (W-L-R), 1);
    const nm = d.nama.length>22 ? d.nama.slice(0,21)+'…' : d.nama;
    s += `<text x="${L-8}" y="${y+BH/2+3.5}" text-anchor="end" font-size="10" fill="#334155">${nm}</text>`;
    s += `<rect x="${L}" y="${y}" width="${W-L-R}" height="${BH}" rx="3" fill="#F1F5F9"/>`;
    s += `<rect x="${L}" y="${y}" width="${w}" height="${BH}" rx="3" fill="${i<3?'#0B2A66':'#1B62D6'}"/>`;
    s += `<text x="${L+w+7}" y="${y+BH/2+3.5}" font-size="10" font-weight="700" fill="#0B2A66">${fmtSkala(d.v[m]||0, sk)}</text>`;
  });
  s += `<text x="${W-4}" y="${H-2}" text-anchor="end" font-size="9" fill="#94A3B8">${sk.sat}</text></svg>`;
  el('chartBarUnit').innerHTML = s;
}

/* Garis kumulatif untuk lingkup yang sedang difilter */
function renderLingkup(rows, m, n){
  const total = Array.from({length:n},(_,i)=>rows.reduce((a,d)=>a+(d.v[i]||0),0));
  const sk = skalaOtomatis(Math.max(...total, 0));
  const W=440,H=240,L=54,R=16,T=22,B=26,iw=W-L-R,ih=H-T-B;
  const maks = Math.max(...total.map(v=>v/sk.div), 0.001)*1.25;
  const x=i=>L+(n<2?iw/2:iw/(n-1)*i), y=v=>T+ih-(v/maks)*ih;

  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren kumulatif lingkup terpilih">`;
  for(let g=0;g<=4;g++){
    const val=maks/4*g;
    s+=`<line x1="${L}" y1="${y(val)}" x2="${W-R}" y2="${y(val)}" stroke="#EEF2F7"/><text x="${L-6}" y="${y(val)+3.5}" text-anchor="end" font-size="9.5" fill="#94A3B8">${val.toLocaleString('id-ID',{maximumFractionDigits:val>=10?0:1})}</text>`;
  }
  s+=`<text x="${L-6}" y="${T-9}" text-anchor="end" font-size="9" fill="#94A3B8">${sk.sat}</text>`;
  s+=`<polyline points="${total.map((v,i)=>`${x(i)},${y(v/sk.div)}`).join(' ')}" fill="none" stroke="#1B62D6" stroke-width="2.6" stroke-linejoin="round"/>`;
  total.forEach((v,i)=>{
    s+=`<circle cx="${x(i)}" cy="${y(v/sk.div)}" r="3.2" fill="#1B62D6"/>`;
    const anchor = i===0?'start':(i===n-1?'end':'middle');
    s+=`<text x="${x(i)}" y="${y(v/sk.div)-9}" text-anchor="${anchor}" font-size="9.5" font-weight="700" fill="#0B2A66">${fmtSkala(v,sk)}</text>`;
    s+=`<text x="${x(i)}" y="${H-7}" text-anchor="middle" font-size="9.5" fill="#64748B">${BULAN_S[i]}</text>`;
  });
  el('chartLingkup').innerHTML = s+`</svg>`;

  const nm = fKelompok==='semua' ? (tblCari ? `hasil pencarian "${tblCari}"` : 'seluruh PLN Group') : `kelompok ${fKelompok}`;
  const rata = m>0 ? total[m]/(m+1) : total[0];
  el('lingkupNote').innerHTML = `Lingkup: <b>${nm}</b> — ${rows.length} unit. Rata-rata perolehan <b>Rp ${M(rata)} M</b> per bulan sepanjang Januari–${BULAN[m]}.`;
}

/* ══════════════════════════════════════════════════════════════════
   VIEW: Analisis
   ══════════════════════════════════════════════════════════════════ */

function renderAnalisis(){
  const cfg = TAHUN[fTahun];
  if(!cfg) return;
  const n = cfg.n, m = Math.min(fBulan, n-1), units = cfg.units;
  const real = cfg.kum[m], targetYtd = cfg.target[m], targetThn = cfg.targetThn;
  const capaian = real/1e9/targetYtd*100;
  const progThn = real/1e9/targetThn*100;
  const sisa = targetThn - real/1e9;
  const bulanSisa = 11 - m;

  // Run-rate: rata-rata perolehan bulanan sejauh ini, diproyeksikan ke Desember
  const rataBulanan = real/(m+1);
  const proyeksi = real + rataBulanan*bulanSisa;
  const proyeksiPct = proyeksi/1e9/targetThn*100;

  // Konsentrasi: berapa unit untuk mencapai 80% pendapatan
  const urut = units.slice().sort((a,b)=>(b.v[m]||0)-(a.v[m]||0));
  let akum=0, n80=0;
  for(const u of urut){ akum += u.v[m]||0; n80++; if(akum >= real*0.8) break; }
  const kp = units.find(u=>u.nama==='Kantor Pusat');
  const kontribKP = kp && real ? (kp.v[m]||0)/real*100 : 0;
  const top5 = real ? urut.slice(0,5).reduce((a,u)=>a+(u.v[m]||0),0)/real*100 : 0;

  const nol = units.filter(u=>(u.v[m]||0) <= 0);
  const stagnan = m>0 ? units.filter(u=>(u.v[m]||0)>0 && (u.v[m]-u.v[m-1])<=0) : [];

  // Perbandingan dengan 2025
  const T25 = TAHUN['2025'];
  const mm = Math.min(m, n-1);
  const y25 = T25 ? T25.kum[mm] : 0, y26 = cfg.kum[mm];
  const yoy = y25 ? (y26-y25)/y25*100 : 0;
  const akhir25 = T25 ? T25.kum[11]/1e9 : 0;

  // Sebaran per kelompok
  const perGrup = {};
  units.forEach(u=>{ perGrup[u.grup] = (perGrup[u.grup]||0) + (u.v[m]||0); });
  const grupUrut = Object.entries(perGrup).sort((a,b)=>b[1]-a[1]);

  /* ── kartu metrik ── */
  el('analMetrik').innerHTML = `
    <div><p class="k">Capaian vs Target YTD</p><p class="v" style="color:${capaian>=100?'#16A34A':'#DC2626'}">${P(capaian)}%</p><p class="s">Rp ${M(real)} M dari target Rp ${P(targetYtd)} M</p></div>
    <div><p class="k">Progres Target Tahunan</p><p class="v" style="color:#0B2A66">${P(progThn)}%</p><p class="s">sisa Rp ${P(Math.abs(sisa))} M dalam ${bulanSisa} bulan</p></div>
    <div><p class="k">Proyeksi Akhir Tahun</p><p class="v" style="color:${proyeksiPct>=100?'#16A34A':'#B45309'}">${P(proyeksiPct)}%</p><p class="s">Rp ${M(proyeksi)} M berdasar run-rate saat ini</p></div>
    <div><p class="k">Konsentrasi Pendapatan</p><p class="v" style="color:#7C3AED">${n80} unit</p><p class="s">menyumbang 80% dari total realisasi</p></div>`;

  /* ── analisis naratif ── */
  const perluPerBulan = bulanSisa>0 ? sisa/bulanSisa : 0;
  const rasioBeban = rataBulanan>0 ? perluPerBulan/(rataBulanan/1e9) : 0;

  el('analTulisan').innerHTML = `
    <h3>1. Posisi capaian</h3>
    <p>Sampai ${BULAN[m]} ${fTahun}, realisasi pendayagunaan aset properti mencapai <b>Rp ${M(real)} M</b> atau
    <b>${P(capaian)}%</b> dari target year-to-date. ${capaian>=100
      ? `Capaian ini <b>melampaui</b> target periodik, namun perlu dibaca hati-hati: terhadap target tahunan Rp ${P(targetThn)} M, progresnya baru <b>${P(progThn)}%</b>, sementara ${m+1} dari 12 bulan (${P((m+1)/12*100)}%) sudah berjalan.`
      : `Capaian ini <b>di bawah</b> target periodik, dengan selisih Rp ${P(Math.abs(real/1e9-targetYtd))} M yang harus dikejar pada bulan-bulan berikutnya.`}</p>

    <h3>2. Risiko pencapaian target tahunan</h3>
    <p>Dengan rata-rata perolehan <b>Rp ${M(rataBulanan)} M per bulan</b> sepanjang Januari–${BULAN[m]},
    proyeksi lurus sampai Desember menghasilkan <b>Rp ${M(proyeksi)} M</b> — setara <b>${P(proyeksiPct)}%</b> dari target tahunan.
    ${proyeksiPct>=100
      ? `Target tahunan berpeluang tercapai jika laju saat ini dipertahankan.`
      : `Untuk menutup sisa <b>Rp ${P(sisa)} M</b> dalam ${bulanSisa} bulan, dibutuhkan rata-rata <b>Rp ${P(perluPerBulan)} M per bulan</b> — sekitar <b>${P(rasioBeban)}×</b> laju rata-rata yang tercatat sejauh ini.
         ${rasioBeban>1.5 ? 'Selisih sebesar ini sulit ditutup hanya dengan kontrak berjalan; perlu percepatan kontrak baru atau penagihan yang tertunda.' : 'Selisih ini masih dalam jangkauan bila beberapa kontrak besar direalisasikan pada kuartal akhir.'}`}</p>
    <p style="font-size:11.5px;color:var(--teks-2)">Catatan metode: proyeksi ini linier dan mengabaikan musiman. Pendapatan sewa properti umumnya menumpuk pada bulan penagihan kontrak tahunan, sehingga realisasi aktual bisa melompat di luar pola ini.</p>

    <h3>3. Konsentrasi dan sebaran</h3>
    <p>Struktur pendapatan sangat terkonsentrasi: <b>${n80} dari ${units.length} entitas</b> sudah menyumbang 80% total realisasi,
    dengan lima terbesar menguasai <b>${P(top5)}%</b>${kp?` dan Kantor Pusat sendiri <b>${P(kontribKP)}%</b>`:''}.
    Konsentrasi setinggi ini berarti capaian PLN Group sangat sensitif terhadap satu-dua kontrak besar —
    tertundanya satu penagihan di entitas utama berdampak jauh lebih besar daripada seluruh perbaikan di unit-unit kecil digabung.</p>
    <p>Berdasarkan kelompok, kontribusi terbesar datang dari ${grupUrut.slice(0,3).map(([g,v])=>`<b>${g}</b> (${P(real?v/real*100:0)}%)`).join(', ')}.</p>

    <h3>4. Unit yang menahan capaian</h3>
    <p>Terdapat <b>${nol.length} entitas</b> yang belum mencatat realisasi sama sekali sepanjang ${fTahun}${nol.length?` — ${nol.slice(0,5).map(u=>u.nama).join(', ')}${nol.length>5?`, dan ${nol.length-5} lainnya`:''}`:''}.
    ${stagnan.length?`Selain itu <b>${stagnan.length} entitas</b> tidak mencatat tambahan pendapatan pada ${BULAN[m]}, yang perlu dipastikan apakah karena tidak ada kontrak aktif atau karena keterlambatan pencatatan di SAP.`:''}
    Nilai absolutnya kecil, tetapi ini indikator tata kelola: unit yang belum bergerak sepanjang tujuh bulan biasanya menandakan aset idle yang belum dipetakan, bukan sekadar target yang belum tertagih.</p>

    <h3>5. Perbandingan tahun sebelumnya</h3>
    <p>Dibanding periode yang sama tahun 2025 (Rp ${M(y25)} M), pendapatan ${yoy>=0?'tumbuh':'turun'} <b>${P(Math.abs(yoy))}%</b>.
    ${akhir25 ? `Yang perlu dicatat, target 2026 sebesar Rp ${P(targetThn)} M ${targetThn<akhir25?`justru <b>${P(Math.abs((targetThn-akhir25)/akhir25*100))}% lebih rendah</b> dari realisasi penuh 2025 (Rp ${P(akhir25)} M). Bila realisasi 2025 mencerminkan kapasitas normal, target 2026 kemungkinan belum menggambarkan potensi aset yang sebenarnya, dan capaian di atas 100% terhadap target berisiko dibaca sebagai prestasi padahal hanya menyamai tahun lalu.` : `sejalan dengan realisasi penuh 2025 (Rp ${P(akhir25)} M).`}` : ''}</p>

    <h3>6. Rekomendasi</h3>
    <p>Prioritas jangka pendek: (a) pastikan kontrak besar di entitas penyumbang utama tertagih sebelum tutup buku;
    (b) petakan aset idle di ${nol.length} entitas yang belum berealisasi dan tetapkan target minimum per unit;
    (c) tinjau ulang dasar penetapan target 2026 agar tidak menutupi ruang pertumbuhan;
    (d) lengkapi monitoring ini dengan GL 5105000104 supaya gambaran pendapatan properti menjadi utuh, tidak hanya transaksi di luar PLN Group.</p>

    <p class="src">Analisis disusun dari data Rekap 5105000101 posisi ${BULAN[m]} ${fTahun}; angka berubah otomatis mengikuti filter Tahun, Posisi bulan, dan Kelompok di atas.</p>`;

  /* ── temuan otomatis ── */
  const ins = [];
  ins.push([capaian>=100?'ok':'warn', `Realisasi YTD <b>Rp ${M(real)} M</b> — <b>${P(capaian)}%</b> dari target ${BULAN[m]}, <b>${P(progThn)}%</b> dari target tahunan.`]);
  ins.push([proyeksiPct>=100?'ok':'warn', `Proyeksi run-rate ke Desember: <b>Rp ${M(proyeksi)} M</b> (<b>${P(proyeksiPct)}%</b> dari target tahunan).`]);
  ins.push([yoy>=0?'ok':'bad', `Dibanding ${BULAN[mm]} 2025: <b>${yoy>=0?'tumbuh':'turun'} ${P(Math.abs(yoy))}%</b> — Rp ${M(y26)} M vs Rp ${M(y25)} M.`]);
  ins.push([n80<=10?'warn':'ok', `<b>${n80} entitas</b> menyumbang 80% realisasi; lima terbesar <b>${P(top5)}%</b>.`]);
  if(akhir25 && targetThn < akhir25) ins.push(['warn', `Target 2026 <b>${P(Math.abs((targetThn-akhir25)/akhir25*100))}% lebih rendah</b> dari realisasi penuh 2025 — perlu ditinjau.`]);
  if(bulanSisa>0 && sisa>0) ins.push([rasioBeban<=1?'ok':'warn', `Butuh <b>Rp ${P(perluPerBulan)} M/bulan</b> selama ${bulanSisa} bulan tersisa (<b>${P(rasioBeban)}×</b> laju saat ini).`]);
  if(nol.length) ins.push(['bad', `<b>${nol.length} entitas</b> belum merealisasikan pendapatan sama sekali sepanjang ${fTahun}.`]);
  if(stagnan.length) ins.push(['warn', `<b>${stagnan.length} entitas</b> tanpa tambahan pendapatan pada ${BULAN[m]}.`]);

  const ikon = {ok:['#16A34A','M2 8l4 4 8-9'], warn:['#F59E0B','M8 1l7 13H1L8 1Zm0 5v4m0 2v.5'], bad:['#DC2626','M4 4l8 8M12 4l-8 8']};
  el('analOtomatis').innerHTML = ins.map(([t,txt])=>
    `<li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${ikon[t][0]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ikon[t][1]}"/></svg><span>${txt}</span></li>`).join('');
}

/* ══════════════════════════════════════════════════════════════════
   Dipanggil app.js setiap kali filter berubah
   ══════════════════════════════════════════════════════════════════ */
function refreshViews(){
  if(viewAktif==='tabel-realisasi') renderTabelRealisasi();
  if(viewAktif==='analisis') renderAnalisis();
}

/* ══════════════════════════════════════════════════════════════════
   Inisialisasi
   ══════════════════════════════════════════════════════════════════ */
function initRouter(){
  document.querySelectorAll('.nav a[data-nav]').forEach(a=>{
    a.addEventListener('click', e=>{ e.preventDefault(); gantiView(a.dataset.nav); });
  });
  document.querySelectorAll('.pick[data-goto]').forEach(b=>{
    b.addEventListener('click', ()=> gantiView(b.dataset.goto));
  });

  const cari = el('cariUnit');
  if(cari){
    let t;
    cari.addEventListener('input', e=>{ clearTimeout(t); tblCari = e.target.value; t = setTimeout(renderTabelRealisasi, 180); });
  }
  const bKum = el('modeKum'), bBln = el('modeBln');
  if(bKum && bBln){
    bKum.onclick = ()=>{ tblMode='kum'; bKum.classList.add('on'); bBln.classList.remove('on'); renderTabelRealisasi(); };
    bBln.onclick = ()=>{ tblMode='bln'; bBln.classList.add('on'); bKum.classList.remove('on'); renderTabelRealisasi(); };
  }

  const awal = location.hash.slice(1);
  gantiView(JUDUL_VIEW[awal] ? awal : 'home');
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRouter);
else initRouter();
