/* ══ Render Dashboard Realisasi Persetujuan Izin Prinsip ══ */
(function(){
  const elp = id => document.getElementById(id);
  const KAT_WARNA = {
    "Kantor / Ruang Kerja":"#1B62D6", "Gardu Induk":"#17A5C4", "Tanah Kosong":"#93C5FD",
    "Lahan Pembangkit":"#0B2A66", "Mess":"#F59E0B", "Rumah Dinas / Wisma":"#16A34A", "Lainnya":"#94A3B8"
  };

  /* KPI */
  function renderKpi(){
    const a = IZIN_AGG;
    const kpi = [
      {ic:'#EFF5FF',st:'#1B62D6',path:'M4 3h8v10H4V3Zm2 3h4M6 8h4M6 11h2',lbl:'Total Surat Izin Prinsip', big:a.totalSurat, cap:'surat terbit Jan–Jul 2026'},
      {ic:'#ECFDF3',st:'#16A34A',path:'M2 8l4 4 8-9',lbl:'Total Aset Tercakup', big:a.totalAset, cap:'aset dalam '+a.totalSurat+' surat'},
      {ic:'#FFF7E6',st:'#F59E0B',path:'M8 2v12M2 8h12',lbl:'Rata-rata Aset / Surat', big:a.rataRata.toLocaleString('id-ID',{maximumFractionDigits:1}), cap:'aset per surat izin prinsip'},
      {ic:'#F5F0FF',st:'#7C3AED',path:'M2 14V8l6-6 6 6v6H2Z',lbl:'Unit Teraktif', big:a.unitTerbanyak[0], cap:a.unitTerbanyak[1]+' aset — terbanyak'}
    ];
    elp('izinKpi').innerHTML = kpi.map(k=>`<div class="card"><div class="kpi">
      <span class="ic" style="background:${k.ic}"><svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="${k.st}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${k.path}"/></svg></span>
      <div style="min-width:0"><p class="lbl">${k.lbl}</p><p class="big" style="color:${k.st};font-size:22px">${k.big}</p><p class="cap">${k.cap}</p></div>
    </div></div>`).join('');
  }

  /* Tren bulanan — bar chart Jan..Jul */
  function chartTren(){
    const bulanAda = [1,2,3,4,5,6,7];
    const vals = bulanAda.map(b=>IZIN_AGG.perBulan[b]||0);
    const W=520,H=210,L=30,R=10,T=16,B=26,iw=W-L-R,ih=H-T-B;
    const maks = Math.max(...vals,1)*1.25;
    const bw = iw/bulanAda.length*0.5;
    const x = i => L + iw/bulanAda.length*i + iw/bulanAda.length/2;
    const y = v => T+ih-(v/maks)*ih;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren jumlah aset izin prinsip per bulan">`;
    [0,0.5,1].forEach(f=>{ const v=maks*f; s+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#EEF2F7"/>`; });
    vals.forEach((v,i)=>{
      const hgt = T+ih-y(v);
      s += `<rect x="${x(i)-bw/2}" y="${y(v)}" width="${bw}" height="${hgt}" rx="3" fill="${v===0?'#FCA5A5':'#1B62D6'}"/>`;
      s += `<text x="${x(i)}" y="${y(v)-7}" text-anchor="middle" font-size="11" font-weight="700" fill="${v===0?'#DC2626':'#0B2A66'}">${v}</text>`;
      s += `<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="10" fill="#334155">${IZIN_BULAN_S[bulanAda[i]]}</text>`;
    });
    s += `</svg>`;
    elp('izinChartTren').innerHTML = s;
    const bulanKosong = bulanAda.filter((b,i)=>vals[i]===0).map(b=>IZIN_BULAN[b]);
    elp('izinTrenNote').innerHTML = bulanKosong.length
      ? `Tidak ada surat izin prinsip terbit di bulan <b>${bulanKosong.join(', ')}</b> — perlu dicek apakah karena memang tidak ada permohonan, atau proses tertunda.`
      : `Setiap bulan Jan–Jul 2026 ada surat izin prinsip yang terbit.`;
  }

  /* Distribusi per Unit Induk — horizontal bar, judul bisa diklik buka tabel lengkap */
  function chartUnit(){
    const entries = Object.entries(IZIN_AGG.perUnit).sort((a,b)=>b[1]-a[1]);
    const maks = entries[0][1];
    elp('izinUnitList').innerHTML = entries.map(([nama,jml])=>{
      const w = Math.max(jml/maks*100,4);
      return `<li><span class="nm" title="${nama}">${nama}</span><span class="br"><i style="width:${w}%"></i></span><b>${jml}</b></li>`;
    }).join('');
  }

  /* Kategori jenis aset — donut */
  function chartKategori(){
    const entries = Object.entries(IZIN_AGG.perKategori).sort((a,b)=>b[1]-a[1]);
    const total = IZIN_AGG.totalAset;
    const r=46,cx=64,cy=64,c=2*Math.PI*r;
    let acc=0, segs='';
    entries.forEach(([kat,jml])=>{
      const frac = jml/total, dash = frac*c;
      segs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${KAT_WARNA[kat]||'#94A3B8'}" stroke-width="20"
        stroke-dasharray="${dash} ${c-dash}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${cx} ${cy})"/>`;
      acc += dash;
    });
    const svg = `<svg class="chart" viewBox="0 0 128 128" role="img" aria-label="Distribusi kategori aset" style="max-width:150px;margin:0 auto;display:block">
      ${segs}<text x="64" y="60" text-anchor="middle" font-size="20" font-weight="800" fill="#0B2A66">${total}</text>
      <text x="64" y="75" text-anchor="middle" font-size="8.5" fill="#64748B">aset</text></svg>`;
    const legend = entries.map(([kat,jml])=>`<li><i style="background:${KAT_WARNA[kat]||'#94A3B8'}"></i>${kat}
      <b>${jml}</b><span class="pct">${(jml/total*100).toFixed(0)}%</span></li>`).join('');
    elp('izinChartKategori').innerHTML = svg;
    elp('izinKategoriLegend').innerHTML = legend;
  }

  /* Modal tabel lengkap 63 aset, dipicu klik judul panel Unit */
  function bukaModalTabel(){
    const rows = IZIN_ROWS.map(r=>{
      const [no,bulan,hari,suratBaru,unit,lokasi,kategori] = r;
      return `<tr><td>${no}</td><td>${suratBaru? (String(hari).padStart(2,'0')+'/'+String(bulan).padStart(2,'0')) : '—'}</td>
        <td>${unit}</td><td>${lokasi}</td><td><span class="izin-tag" style="background:${(KAT_WARNA[kategori]||'#94A3B8')+'22'};color:${KAT_WARNA[kategori]||'#64748B'}">${kategori}</span></td></tr>`;
    }).join('');
    elp('izinModalBody').innerHTML = `<table><thead><tr><th>No</th><th>Tanggal Surat</th><th>Unit Induk</th><th>Lokasi Aset</th><th>Kategori</th></tr></thead><tbody>${rows}</tbody></table>`;
    elp('izinModalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function tutupModal(){
    elp('izinModalOverlay').style.display = 'none';
    document.body.style.overflow = '';
  }

  function init(){
    renderKpi(); chartTren(); chartUnit(); chartKategori();
    const judul = elp('izinUnitTitle');
    judul.style.cursor = 'pointer';
    judul.title = 'Klik untuk lihat daftar lengkap 63 aset';
    judul.onclick = bukaModalTabel;
    elp('izinModalClose').onclick = tutupModal;
    elp('izinModalOverlay').onclick = e => { if(e.target.id==='izinModalOverlay') tutupModal(); };
    document.addEventListener('keydown', e => { if(e.key==='Escape') tutupModal(); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
