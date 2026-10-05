const BULAN=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const BULAN_S=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const M  = n => (n/1e9).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
const JT = n => (n/1e6).toLocaleString('id-ID',{maximumFractionDigits:0});
const P  = n => n.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1});
const el = id => document.getElementById(id);

let TAHUN = { "2025": (typeof DATA_2025 !== "undefined" ? DATA_2025 : null) }; // "2026" ditambahkan setelah data live/fallback siap
let fTahun="2026", fBulan=0, fKelompok="semua", fUnit="Kantor Pusat";
let dataSourceNote = "";
let dataLive = null;         // true = data live dari sheet, false = data cadangan, null = belum dimuat
let tglUpdateSheet = null;   // {teks, tanggal} dari sel "Update data …" di sheet, null kalau belum/tidak ada

/* ── badge "Data diperbarui" di topbar (tampil di semua halaman) ── */
function tampilkanTglUpdate(){
  const wrap = el('tglUpdWrap'), lbl = el('tglUpdLabel');
  if(!wrap || !lbl) return;
  // saat dashboard memakai data cadangan, tanggal di sheet tidak mewakili angka yang tampil
  if(tglUpdateSheet && tglUpdateSheet.tanggal && dataLive !== false){
    lbl.textContent = tglUpdateSheet.tanggal;
    wrap.title = 'Dari sheet "Rekap 5105000101": ' + tglUpdateSheet.teks;
    wrap.hidden = false;
  }else{
    wrap.hidden = true;
  }
}

/* Segala error skrip dilaporkan ke status bar. Tanpa ini, satu file yang
   gagal dimuat membuat dashboard berhenti di "Memuat…" tanpa keterangan. */
let errorSkrip = [];
window.addEventListener('error', function(ev){
  try{
    errorSkrip.push((ev.message || 'error tidak diketahui') +
      (ev.filename ? '  [' + ev.filename.split('/').pop() + ':' + ev.lineno + ']' : ''));
    const bar = document.getElementById('liveStatus');
    if(bar && bar.className.indexOf('ok') === -1) setLiveStatus('bad', errorSkrip.join('  ·  '));
  }catch(_){}
});

/* ── status bar live ── */
function setLiveStatus(kind, text){
  const bar = el('liveStatus'), dot = bar.querySelector('.dot'), txt = el('liveStatusText');
  bar.className = 'livebar ' + kind;
  dot.className = 'dot ' + kind;
  txt.textContent = text;
}

/* ── charts (sama seperti versi sebelumnya) ── */
function chartCombo(cfg,m){
  const W=620,H=300,L=46,R=12,T=26,B=30,iw=W-L-R,ih=H-T-B;
  const maks=Math.ceil(Math.max(...cfg.target,...cfg.kum.map(v=>v/1e9))/40)*40 || 40;
  const x=i=>L+iw/12*i+iw/24, y=v=>T+ih-(v/maks)*ih;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Target dan realisasi kumulatif">`;
  for(let g=0;g<=4;g++){const v=maks/4*g;s+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#EEF2F7"/><text x="${L-7}" y="${y(v)+4}" text-anchor="end" font-size="10" fill="#94A3B8">${v}</text>`;}
  s+=`<text x="${L-7}" y="${T-10}" text-anchor="end" font-size="9" fill="#94A3B8">Rp M</text>`;
  cfg.target.forEach((t,i)=>{const bw=iw/12*0.56;s+=`<rect x="${x(i)-bw/2}" y="${y(t)}" width="${bw}" height="${T+ih-y(t)}" rx="2" fill="#93C5FD"/>`;
    s+=`<text x="${x(i)}" y="${y(t)-5}" text-anchor="middle" font-size="9" fill="${i<=m?'#64748B':'#B4C3D6'}">${P(t)}</text>`;});
  const seri=cfg.kum.slice(0,m+1);
  s+=`<polyline points="${seri.map((v,i)=>`${x(i)},${y(v/1e9)}`).join(' ')}" fill="none" stroke="#0B2A66" stroke-width="2.6" stroke-linejoin="round"/>`;
  seri.forEach((v,i)=>{s+=`<circle cx="${x(i)}" cy="${y(v/1e9)}" r="3.6" fill="#0B2A66"/><text x="${x(i)}" y="${y(v/1e9)-11}" text-anchor="middle" font-size="10" font-weight="700" fill="#0B2A66">${M(v)}</text>`;});
  BULAN_S.forEach((b,i)=>{s+=`<text x="${x(i)}" y="${H-9}" text-anchor="middle" font-size="10" fill="${i<=m?'#334155':'#CBD5E1'}">${b}</text>`;});
  return s+`</svg>`;
}
/* Peta nama unit 2026 -> kunci padanan, untuk mencari deret 2025-nya.
   Catatan: UID Jawa Tengah dan UID Yogyakarta dua-duanya berasal dari
   "UID Jawa Tengah & DIY" (2025), begitu juga UIP Jawa Bagian Timur & UIP JBTB. */
const KEY_2026 = { "Kantor Pusat":"KP","PUSDIKLAT":"PUSDIKLAT","UID Jakarta Raya":"UID-JKT","UID Jawa Timur":"UID-JATIM","UID Jawa Barat":"UID-JABAR","UID Bali":"UID-BALI",
  "UID Jawa Tengah":"UID-JATENG","UID Yogyakarta":"UID-JATENG","UIT JBT":"UIT-TENGAH","UID Sulselrabar":"UID-SULSELRABAR","UID S2JB":"UID-S2JB","UID Kalselteng":"UID-KALSELTENG",
  "UID Sumbar":"UID-SUMBAR","UID Kaltimra":"UID-KALTIMRA","UIT JBB":"UIT-BARAT","UID Suluttenggo":"UID-SULUTTENGGO","UID Sumut":"UID-SUMUT","PUSLITBANG":"PUSLITBANG",
  "UID Kalbar":"UID-KALBAR","UID Aceh":"UID-ACEH","UID Riau & Kepri":"UID-RIAUKEPRI","UIP3B Sumatera":"UIP3B-SUM","UIP Jawa Bagian Timur":"UIP-JBTB","UIP JBTB":"UIP-JBTB","UIP Jawa Bagian Barat":"UIP-JBB",
  "UIP SBS":"UIP-SBS","UIK Tanjung Jati B":"UIK-TJB","PUSHARLIS":"PUSHARLIS","UIT JBTB":"UIT-TIMURBALI","UID Banten":"UID-BANTEN","UIW MMU":"UIW-MMU","UIP Kalimantan Bag Timur":"UIP-KALTIM",
  "UIP3B Kalimantan":"UIP3B-KAL","PUSMANPRO":"PUSMANPRO","UIW NTT":"UIW-NTT","UID Lampung":"UID-LAMPUNG","UIP SBT":"UIP-SBT","UIP3B Sulawesi":"UIP3B-SUL","UIP2B Jamali":"UIP2B-JAMALI",
  "UIW P2B":"UIW-P2B","UIW Bangka Belitung":"UIW-BABEL","UIW NTB":"UIW-NTB","UIP Sulawesi":"UIP-SULAWESI","UIP SBU":"UIP-SBU","PUSERTIF":"PUSERTIF","UIP Kalimantan Bag Barat":"UIP-KALBAR",
  "UIP Maluku Papua":"UIP-MALPA","UIP Nusa Tenggara":"UIP-NUSRA","PLN NP":"PLN-NP","PLN IP":"PLN-IP","PLN Batam":"PLN-BATAM","PLN Icon Plus":"PLN-ICON" };

/* Cari deret 2025 yang sepadan dengan unit 2026 terpilih */
function deret2025(namaUnit2026){
  const key = KEY_2026[namaUnit2026];
  if(!key) return null;
  const u = DATA_2025.units.find(d=>d.key===key);
  return u ? u.v : null;
}

/* Pilih satuan sumbu Y otomatis mengikuti besaran nilai unit yang sedang dilihat,
   supaya unit kecil (puluhan/ratusan juta) tidak tampil sebagai 0,04 M yang tak terbaca. */
function skalaOtomatis(maxRp){
  if(maxRp >= 1e9){
    const v = maxRp/1e9;
    return {div:1e9, sat:'Rp Miliar', dec: v>=100?0:2};
  }
  if(maxRp >= 1e6){
    const v = maxRp/1e6;
    return {div:1e6, sat:'Rp Juta', dec: v>=100?0:1};
  }
  if(maxRp >= 1e3) return {div:1e3, sat:'Rp Ribu', dec:0};
  return {div:1, sat:'Rp', dec:0};
}
const fmtSkala = (n, sk) => (n/sk.div).toLocaleString('id-ID',{minimumFractionDigits:sk.dec, maximumFractionDigits:sk.dec});

function chartUnit(v26, v25, m, nama){
  const W=440,H=280,L=52,R=16,T=30,B=28,iw=W-L-R,ih=H-T-B;
  const a26 = v26.slice(0,m+1);
  const a25 = v25 ? v25.slice(0,m+1) : null;
  const semua = a25 ? a26.concat(a25) : a26;
  const maxRp = Math.max(...semua, 0);
  const sk = skalaOtomatis(maxRp);
  const maks = Math.max(...semua.map(a=>a/sk.div), 0.001)*1.32;
  const x=i=>L+(a26.length<2?iw/2:iw/(a26.length-1)*i), y=n=>T+ih-(n/maks)*ih;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren ${nama} 2026 dibanding 2025">`;
  for(let g=0;g<=4;g++){
    const val=maks/4*g;
    const lbl = val.toLocaleString('id-ID',{maximumFractionDigits: val>=100?0:(val>=10?0:1)});
    s+=`<line x1="${L}" y1="${y(val)}" x2="${W-R}" y2="${y(val)}" stroke="#EEF2F7"/><text x="${L-6}" y="${y(val)+3.5}" text-anchor="end" font-size="9.5" fill="#94A3B8">${lbl}</text>`;
  }
  s+=`<text x="${L-6}" y="${T-12}" text-anchor="end" font-size="9" fill="#94A3B8">${sk.sat}</text>`;

  // deret 2025 (abu-abu, garis putus-putus) digambar dulu agar berada di belakang
  if(a25){
    s+=`<polyline points="${a25.map((n,i)=>`${x(i)},${y(n/sk.div)}`).join(' ')}" fill="none" stroke="#94A3B8" stroke-width="2.2" stroke-dasharray="5 3"/>`;
    a25.forEach((n,i)=>{
      s+=`<circle cx="${x(i)}" cy="${y(n/sk.div)}" r="2.8" fill="#94A3B8"/>`;
      const anchor = i===0 ? 'start' : (i===a25.length-1 ? 'end' : 'middle');
      s+=`<text x="${x(i)}" y="${y(n/sk.div)+14}" text-anchor="${anchor}" font-size="9" fill="#94A3B8">${fmtSkala(n,sk)}</text>`;
    });
  }
  // deret 2026 (biru tegas)
  s+=`<polyline points="${a26.map((n,i)=>`${x(i)},${y(n/sk.div)}`).join(' ')}" fill="none" stroke="#1B62D6" stroke-width="2.6"/>`;
  a26.forEach((n,i)=>{
    s+=`<circle cx="${x(i)}" cy="${y(n/sk.div)}" r="3.4" fill="#1B62D6"/>`;
    const anchor = i===0 ? 'start' : (i===a26.length-1 ? 'end' : 'middle');
    s+=`<text x="${x(i)}" y="${y(n/sk.div)-10}" text-anchor="${anchor}" font-size="10" font-weight="700" fill="#0B2A66">${fmtSkala(n,sk)}</text>`;
    s+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="9.5" fill="#64748B">${BULAN_S[i]}</text>`;
  });
  return s+`</svg>`;
}
function chartS(cfg,m){
  const W=560,H=170,L=34,R=10,T=14,B=22,iw=W-L-R,ih=H-T-B;
  const x=i=>L+iw/11*i,y=p=>T+ih-(p/115)*ih;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kurva S">`;
  [0,25,50,75,100].forEach(p=>{s+=`<line x1="${L}" y1="${y(p)}" x2="${W-R}" y2="${y(p)}" stroke="#EEF2F7"/><text x="${L-5}" y="${y(p)+3.5}" text-anchor="end" font-size="8" fill="#94A3B8">${p}%</text>`;});
  s+=`<polyline points="${cfg.targetPct.map((p,i)=>`${x(i)},${y(p)}`).join(' ')}" fill="none" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5 3"/>`;
  const rp=cfg.kum.slice(0,m+1).map(v=>v/1e9/cfg.targetThn*100);
  s+=`<polyline points="${rp.map((p,i)=>`${x(i)},${y(p)}`).join(' ')}" fill="none" stroke="#0B2A66" stroke-width="2.4"/>`;
  rp.forEach((p,i)=>{s+=`<circle cx="${x(i)}" cy="${y(p)}" r="2.8" fill="#0B2A66"/>`;
    if(i===rp.length-1)s+=`<text x="${x(i)}" y="${y(p)-8}" text-anchor="middle" font-size="9" font-weight="700" fill="#0B2A66">${P(p)}%</text>`;});
  BULAN_S.forEach((b,i)=>{s+=`<text x="${x(i)}" y="${H-6}" text-anchor="middle" font-size="8" fill="${i<=m?'#334155':'#CBD5E1'}">${b}</text>`;});
  return s+`</svg>`;
}
function isiTahun(){
  el('fTahun').innerHTML = Object.keys(TAHUN).sort().reverse().map(t=>`<option value="${t}"${t===fTahun?' selected':''}>${t}</option>`).join('');
}
function isiBulan(){
  const n=TAHUN[fTahun].n;
  if(fBulan>n-1) fBulan=n-1;
  el('fBulan').innerHTML=BULAN.slice(0,n).map((b,i)=>`<option value="${i}"${i===fBulan?' selected':''}>${b} ${fTahun}</option>`).join('');
}
function isiUnit(){
  const list=TAHUN[fTahun].units.filter(d=>fKelompok==='semua'||d.grup===fKelompok);
  el('fUnit').innerHTML=list.map(d=>`<option value="${d.nama}">${d.nama}</option>`).join('');
  if(!list.some(d=>d.nama===fUnit)) fUnit=list.length?list[0].nama:"";
  el('fUnit').value=fUnit;
}
function renderSafe(){
  try{ render(); }
  catch(e){
    console.error('Render error saat ganti filter:', e);
    setLiveStatus('warn', 'Terjadi error saat menerapkan filter: ' + e.message + ' — screenshot pesan ini dan kirim untuk diperbaiki.');
  }
}
function wireFilters(){
  el('fKelompok').innerHTML = `<option value="semua">Semua kelompok</option>`+Object.values(G).map(g=>`<option value="${g}">${g}</option>`).join('');
  el('fTahun').onchange=e=>{fTahun=e.target.value;fBulan=TAHUN[fTahun].n-1;isiBulan();isiUnit();renderSafe();};
  el('fBulan').onchange=e=>{fBulan=+e.target.value;renderSafe();};
  el('fKelompok').onchange=e=>{fKelompok=e.target.value;isiUnit();renderSafe();};
  el('fUnit').onchange=e=>{fUnit=e.target.value;renderSafe();};
  el('reset').onclick=()=>{fTahun="2026";fBulan=TAHUN["2026"].n-1;fKelompok='semua';fUnit='Kantor Pusat';
    el('fTahun').value=fTahun;el('fKelompok').value='semua';isiBulan();isiUnit();renderSafe();};
}

/* ── render utama (sama seperti versi sebelumnya) ── */
function render(){
  const cfg=TAHUN[fTahun], m=Math.min(fBulan, cfg.n-1), units=cfg.units;
  const lingkup=units.filter(d=>fKelompok==='semua'||d.grup===fKelompok);
  const realTotal=cfg.kum[m];
  const targetYtd=cfg.target[m], capaian=realTotal/1e9/targetYtd*100, progThn=realTotal/1e9/cfg.targetThn*100;
  const growth=m>0?realTotal-cfg.kum[m-1]:realTotal;
  const growthPrev=m>1?cfg.kum[m-1]-cfg.kum[m-2]:null;
  const growthPct=growthPrev&&growthPrev!==0?(growth-growthPrev)/Math.abs(growthPrev)*100:null;

  el('perLabel').textContent=`Januari – ${BULAN[m]} ${fTahun}`;
  el('updLabel').textContent = fTahun==="2025" ? "31 Desember 2025 (sesuai LK)" : (cfg.asOf || (dataSourceNote || `${BULAN[m]} ${fTahun}`));
  el('judulCombo').textContent=`Target vs Realisasi Pendapatan ${fTahun} (Kumulatif)`;

  const TAHUN26 = TAHUN["2026"];
  const mm=Math.min(m,TAHUN26.n-1);
  const y25=TAHUN["2025"].kum[mm], y26=TAHUN26.kum[mm];
  const yoyPct= y25 ? (y26-y25)/y25*100 : 0;

  const kpi=[
    {ic:'#ECFDF3',st:'#16A34A',path:'M2 12l4-4 3 3 5-6',lbl:'Realisasi YTD',warna:'#16A34A',
     big:`Rp ${M(realTotal)} M`,
     cap:`<b style="color:${capaian>=100?'#16A34A':'#DC2626'}">${capaian>=100?'▲':'▼'} ${P(Math.abs(capaian-100))}%</b> vs Target YTD<br>
          <span style="font-size:11px">${BULAN[mm]}: 2026 <b>${M(y26)}</b> vs 2025 <b>${M(y25)}</b> (<b style="color:${yoyPct>=0?'#16A34A':'#DC2626'}">${yoyPct>=0?'+':''}${P(yoyPct)}%</b>)</span>`},
    {ic:'#EFF5FF',st:'#1B62D6',path:'M8 2v12M2 8h12',lbl:'Target Tahunan',warna:'#0B2A66',
     big:`Rp ${P(cfg.targetThn)} M`,
     cap:`<div class="progress"><i style="width:${Math.min(progThn,100)}%"></i></div><span style="display:block;margin-top:4px">${P(progThn)}% tercapai · ${progThn>=100?'surplus':'sisa'} <b style="color:${progThn>=100?'#15803D':'#B45309'}">Rp ${P(Math.abs(cfg.targetThn-realTotal/1e9))} M</b></span>`},
    {ic:'#ECFDF3',st:'#16A34A',path:'M3 8l3 3 7-7',lbl:'Target YTD',warna:'#16A34A',
     big:`Rp ${P(targetYtd)} M`,
     cap:`ACHIEVEMENT<br><b style="font-size:16px;color:${capaian>=100?'#16A34A':'#DC2626'}">${P(capaian)}%</b>`},
    {ic:'#FFF7E6',st:'#F59E0B',path:'M2 12l4-5 3 2 5-6',lbl:`Perolehan ${BULAN[m]}`,warna:growth>=0?'#F59E0B':'#DC2626',
     big:`Rp ${M(growth)} M`,
     cap:growthPct===null?`tambahan bulan ${BULAN[m]}`:`<b style="color:${growthPct>=0?'#16A34A':'#DC2626'}">${growthPct>=0?'+':''}${P(growthPct)}%</b> vs ${BULAN[m-1]}`}
  ];
  el('ringkasan').innerHTML=kpi.map(k=>`<div class="card"><div class="kpi">
    <span class="ic" style="background:${k.ic}"><svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="${k.st}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${k.path}"/></svg></span>
    <div style="min-width:0"><p class="lbl">${k.lbl}</p><p class="big" style="color:${k.warna}">${k.big}</p><p class="cap">${k.cap}</p></div></div></div>`).join('');

  el('chartCombo').innerHTML=chartCombo(cfg,m);
  const selisih=realTotal/1e9-targetYtd;
  el('calloutCombo').style.cssText=selisih>=0?'':'background:#FEF2F2;border-color:#FECACA;color:#B91C1C';
  el('calloutCombo').innerHTML=selisih>=0
    ?`Realisasi YTD melampaui target: <b>+Rp ${P(selisih)} M</b> (+${P(capaian-100)}% di atas target ${BULAN[m]} ${fTahun})`
    :`Realisasi YTD di bawah target: <b>Rp ${P(selisih)} M</b> (${P(capaian)}% dari target ${BULAN[m]} ${fTahun})`;

  const top=[...lingkup].sort((a,b)=>b.v[m]-a.v[m]).slice(0,10);
  const maksTop=top[0]?.v[m]||1;
  el('topKontributor').innerHTML=top.map((d,i)=>{
    const w=Math.max(d.v[m]/maksTop*62,1);
    return `<li><span class="no">${i+1}</span><span class="nm" title="${d.nama}">${d.nama}</span><span></span>
      <span class="br" style="--w:${w}%"><i style="width:${w}%"></i><b>${M(d.v[m])}</b></span></li>`;}).join('');

  const u=units.find(d=>d.nama===fUnit) || units[0];
  if(u){
    const v25 = (fTahun==="2026") ? deret2025(u.nama) : null;
    el('chartUnit').innerHTML=chartUnit(u.v, v25, m, u.nama);
    let nota = `<b>${u.nama}</b> — ${u.grup}. Kontribusi terhadap total PLN Group: <b>${P(u.v[m]/realTotal*100)}%</b>`;
    if(v25){
      const a=v25[m]||0, b=u.v[m]||0;
      // pakai satuan yang sama dengan sumbu Y grafik di atasnya
      const sk = skalaOtomatis(Math.max(...u.v.slice(0,m+1), ...v25.slice(0,m+1), 0));
      const pct = a ? (b-a)/a*100 : null;
      nota += `<br>${BULAN[m]}: 2026 <b>${fmtSkala(b,sk)}</b> vs 2025 <b>${fmtSkala(a,sk)}</b> <span style="color:var(--teks-3)">(${sk.sat})</span>`;
      if(pct!==null) nota += ` — <b style="color:${pct>=0?'#15803D':'#B91C1C'}">${pct>=0?'+':''}${P(pct)}%</b>`;
      const key = KEY_2026[u.nama];
      if(key==="UID-JATENG") nota += `<br><span style="color:#B45309">Catatan: deret 2025 adalah UID Jawa Tengah &amp; DIY (sebelum pemekaran menjadi UID Jawa Tengah dan UID Yogyakarta).</span>`;
      if(key==="UIP-JBTB") nota += `<br><span style="color:#B45309">Catatan: deret 2025 adalah UIP Jawa Bagian Timur &amp; Bali.</span>`;
    }else if(fTahun==="2026"){
      nota += `<br><span style="color:#B45309">Tidak ada data pembanding 2025 untuk unit ini.</span>`;
    }
    el('unitNote').innerHTML = nota;
  }


  const aktif=lingkup.filter(d=>d.v[m]>0), nol=lingkup.filter(d=>d.v[m]<=0);
  const stagnan=m>0?lingkup.filter(d=>d.v[m]>0&&d.v[m]-d.v[m-1]<=0):[];
  const tumbuh=aktif.length-stagnan.length;
  el('statUnit').innerHTML=`
    <div class="b1"><p class="k">Total Entitas</p><p class="v">${lingkup.length}</p><p class="s">unit &amp; anak perusahaan</p></div>
    <div class="b2"><p class="k">Tumbuh</p><p class="v" style="color:#15803D">${tumbuh}</p><p class="s">${lingkup.length?P(tumbuh/lingkup.length*100):'0.0'}% dari total</p></div>
    <div class="b3"><p class="k">Stagnan</p><p class="v" style="color:#B45309">${stagnan.length}</p><p class="s">nihil tambahan ${BULAN[m]}</p></div>
    <div class="b4"><p class="k">Belum Realisasi</p><p class="v" style="color:#B91C1C">${nol.length}</p><p class="s">sejak Januari ${fTahun}</p></div>`;
  el('chartS').innerHTML=chartS(cfg,m);

  const atensi=[...stagnan.map(d=>({d,st:'stag'})),...nol.map(d=>({d,st:'nol'}))].sort((a,b)=>b.d.v[m]-a.d.v[m]).slice(0,12);
  el('tblAtensi').querySelector('tbody').innerHTML=atensi.length?atensi.map(({d,st})=>
    `<tr><td>${d.nama}</td><td class="num">${JT(d.v[m])}</td><td><span class="tag ${st==='stag'?'t-stag':'t-nol'}">${st==='stag'?'Stagnan':'Belum realisasi'}</span></td></tr>`).join('')
    :`<tr><td colspan="3" style="color:#64748B;padding:14px 6px">Seluruh unit dalam lingkup ini mencatat pertumbuhan.</td></tr>`;

  const kp=units[0]?.v[m]||0, kontribKP=realTotal? kp/realTotal*100 : 0, ins=[];
  const akhir25=TAHUN["2025"].kum[11]/1e9, t26=TAHUN26.targetThn;
  ins.push([capaian>=100?'ok':'warn',`Realisasi YTD <b>Rp ${M(realTotal)} M</b> — <b>${P(capaian)}%</b> dari target ${BULAN[m]} dan <b>${P(progThn)}%</b> dari target tahunan ${fTahun}.`]);
  ins.push([yoyPct>=0?'ok':'bad',`Dibanding periode sama 2025 (${BULAN[mm]}), pendapatan <b>${yoyPct>=0?'tumbuh':'turun'} ${P(Math.abs(yoyPct))}%</b> — Rp ${M(y26)} M vs Rp ${M(y25)} M.`]);
  ins.push(['warn',`Target 2026 (Rp ${P(t26)} M) <b>${P(Math.abs((t26-akhir25)/akhir25*100))}% lebih rendah</b> dari realisasi 2025 (Rp ${P(akhir25)} M) — perlu ditinjau apakah target sudah mencerminkan potensi aset.`]);
  ins.push(['ok',`Kantor Pusat menyumbang <b>${P(kontribKP)}%</b> total pendapatan (Rp ${M(kp)} M); konsentrasi tinggi pada satu entitas.`]);
  if(stagnan.length) ins.push(['warn',`<b>${stagnan.length} entitas</b> tanpa tambahan pendapatan di ${BULAN[m]}.`]);
  if(nol.length) ins.push(['bad',`<b>${nol.length} entitas</b> belum merealisasikan pendapatan sama sekali sepanjang ${fTahun}.`]);
  const sisa=cfg.targetThn-realTotal/1e9;
  if(sisa>0&&m<11) ins.push([progThn>=cfg.targetPct[m]?'ok':'warn',`Sisa target <b>Rp ${P(sisa)} M</b> dalam ${11-m} bulan (rata-rata Rp ${P(sisa/(11-m))} M/bulan).`]);
  const ikon={ok:['#16A34A','M2 8l4 4 8-9'],warn:['#F59E0B','M8 1l7 13H1L8 1Zm0 5v4m0 2v.5'],bad:['#DC2626','M4 4l8 8M12 4l-8 8']};
  el('insightList').innerHTML=ins.map(([t,txt])=>`<li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${ikon[t][0]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ikon[t][1]}"/></svg><span>${txt}</span></li>`).join('');

  // views.js dimuat setelah file ini — pakai penjagaan supaya tidak error
  // kalau render() sempat berjalan sebelum views.js siap.
  if(typeof refreshViews === 'function') refreshViews();
}

/* ══ inisialisasi: coba live fetch dulu, fallback kalau gagal ══ */
function sanitizeUnits(data){
  // buang baris yang lolos parsing tapi nama-nya tidak valid (bukan teks / kosong) —
  // jaring pengaman terakhir supaya satu baris aneh di sheet tidak merusak seluruh dashboard.
  if(data && Array.isArray(data.units)){
    data.units = data.units.filter(u => u && typeof u.nama === 'string' && u.nama.trim() !== '' && Array.isArray(u.v));
    // perbaiki label kelompok kalau sempat terisi "Lainnya" karena urutan pemuatan script
    if(typeof grupUntuk === 'function'){
      data.units.forEach(u => { if(!u.grup || u.grup === 'Lainnya') u.grup = grupUntuk(u.nama); });
    }
  }
  // hitung ulang total kumulatif kalau belum ada / tidak lengkap
  if(data && Array.isArray(data.units) && (!Array.isArray(data.kum) || data.kum.length < data.n)){
    data.kum = Array.from({length:data.n},(_,m)=>data.units.reduce((a,d)=>a+(d.v[m]||0),0));
  }
  return data;
}

function boot(withData, isLive, note){
  sanitizeUnits(withData);
  TAHUN["2026"] = withData;
  dataSourceNote = note || "";
  dataLive = !!isLive;
  tampilkanTglUpdate();
  fTahun="2026"; fBulan=withData.n-1; fKelompok="semua";
  fUnit = withData.units.some(u=>u.nama==="Kantor Pusat") ? "Kantor Pusat" : (withData.units[0]?.nama || "");
  isiTahun(); isiBulan(); isiUnit(); wireFilters(); render();
  if(isLive){
    setLiveStatus('ok', 'Data 2026 berhasil dimuat langsung dari Google Sheets (posisi bulan ' + BULAN[withData.n-1] + ').' +
      (tglUpdateSheet ? ' Data diperbarui ' + tglUpdateSheet.tanggal + '.' : ''));
  }else{
    setLiveStatus('warn', 'Gagal memuat data langsung — menampilkan data cadangan (' + (withData.asOf||'') + '). ' + note);
  }
}

/* boot dengan try/catch — kalau data live berhasil diambil tapi ada yang tidak terduga
   saat diproses/ditampilkan, dashboard tetap jatuh ke data cadangan dan menampilkan
   PESAN ERROR ASLINYA di banner (bukan macet diam-diam), supaya gampang didiagnosis
   cukup dari screenshot, tanpa perlu buka DevTools. */
function bootSafe(withData, isLive, note){
  try{
    boot(withData, isLive, note);
  }catch(e){
    console.error('Dashboard render error:', e);
    if(isLive){
      // data live gagal diproses -> coba lagi pakai data cadangan
      try{
        boot(FALLBACK_2026, false, 'Data live berhasil diambil tapi gagal ditampilkan (' + e.message + ').');
      }catch(e2){
        console.error('Fallback juga gagal:', e2);
        setLiveStatus('warn', 'Terjadi error saat menampilkan dashboard: ' + e2.message + ' — screenshot pesan ini dan kirim untuk diperbaiki.');
      }
    }else{
      setLiveStatus('warn', 'Terjadi error saat menampilkan data cadangan: ' + e.message + ' — screenshot pesan ini dan kirim untuk diperbaiki.');
    }
  }
}

(function mulai(){
  const hilang = [];
  if(typeof DATA_2025     === 'undefined') hilang.push('data-2025.js');
  if(typeof FALLBACK_2026 === 'undefined') hilang.push('data-2026-fallback.js');
  if(typeof grupUntuk     !== 'function')  hilang.push('data-2025.js (fungsi grupUntuk)');
  if(typeof loadLiveData  !== 'function')  hilang.push('gviz-fetch.js');
  if(errorSkrip.length){
    // Ada file yang gagal DIEKSEKUSI (bukan sekadar tidak ada). Pesan aslinya
    // jauh lebih menunjuk penyebab daripada sekadar "file tidak termuat".
    setLiveStatus('bad', 'Error skrip: ' + errorSkrip.join('  ·  ') +
      (hilang.length ? '  →  akibatnya belum tersedia: ' + hilang.join(', ') : ''));
    return;
  }
  if(hilang.length){
    setLiveStatus('bad', 'File berikut tidak termuat: ' + hilang.join(', ') +
      ' — pastikan file tersebut ada di repo dan nama filenya persis sama (huruf besar/kecil berpengaruh).');
    return;
  }
  // Tanggal update dimuat terpisah (permintaan kecil) — kalau gagal, badge cukup disembunyikan
  if(typeof loadUpdateLabel === 'function'){
    loadUpdateLabel(function(hasil){
      tglUpdateSheet = hasil;
      tampilkanTglUpdate();
      const bar = el('liveStatus');
      if(hasil && bar && bar.className.indexOf(' ok') > -1){
        const txt = el('liveStatusText');
        if(txt.textContent.indexOf('Data diperbarui') === -1) txt.textContent += ' Data diperbarui ' + hasil.tanggal + '.';
      }
    });
  }
  loadLiveData(
    function(liveData){ bootSafe(liveData, true); },
    function(err){ bootSafe(FALLBACK_2026, false, err.message); }
  );
})();
