/* ══ Live fetch dari Google Sheets (Rekap 5105000101) via Google Visualization API ══
   Teknik JSONP (script tag), bukan fetch()/XHR — supaya tidak terkendala CORS,
   karena endpoint gviz Google tidak selalu mengirim header CORS untuk permintaan lintas-origin. */

const GVIZ_FILE_ID = "1pJ7S4GBoa8O0Fi-KOsVtTlOzBZSnsAQ0ea9bUS-v5F4";
const GVIZ_GID = "1664615468"; // tab "Rekap 5105000101"
const GVIZ_TIMEOUT_MS = 12000;

const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function cellText(row, idx){
  const c = row && row.c && row.c[idx];
  if(!c || c.v === null || c.v === undefined) return null;
  return String(c.v).trim();
}
function cellNum(row, idx){
  const c = row && row.c && row.c[idx];
  if(!c || c.v === null || c.v === undefined || c.v === '') return 0;
  const n = Number(c.v);
  return isNaN(n) ? 0 : n;
}
/* Normalisasi teks sel: buang non-breaking space, rapatkan spasi ganda,
   samakan huruf besar — supaya "UNIT  INDUK", "Unit Induk", dsb tetap cocok. */
function norm(v){
  if(v === null || v === undefined) return '';
  return String(v).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
}

function diagnosaIsi(rows){
  // Ambil contoh isi sel yang tidak kosong, untuk ditampilkan di pesan error
  const contoh = [];
  for(let r=0; r<Math.min(rows.length, 15) && contoh.length<10; r++){
    const cArr = (rows[r] && rows[r].c) || [];
    for(let c=0; c<cArr.length && contoh.length<10; c++){
      const t = cellText(rows[r], c);
      if(t !== null && t !== '') contoh.push('R'+r+'C'+c+'="'+String(t).slice(0,22)+'"');
    }
  }
  return 'total baris='+rows.length+'; isi awal: '+(contoh.join(', ') || '(semua kosong)');
}

function findHeaderRow(rows){
  // Cara 1: cari sel yang mengandung "UNIT INDUK"
  for(let r=0;r<rows.length;r++){
    const cArr = (rows[r] && rows[r].c) || [];
    for(let c=0;c<cArr.length;c++){
      if(norm(cellText(rows[r],c)).indexOf("UNIT INDUK") > -1){
        let janCol = -1;
        for(let c2=0;c2<cArr.length;c2++){ if(norm(cellText(rows[r],c2))==="JANUARI"){ janCol=c2; break; } }
        if(janCol>-1) return { headerRow:r, unitCol:c, janCol };
      }
    }
  }
  // Cara 2 (cadangan): cari baris yang punya "JANUARI" + "FEBRUARI",
  // lalu tebak kolom nama unit = kolom teks terakhir di sebelah kirinya.
  for(let r=0;r<rows.length;r++){
    const cArr = (rows[r] && rows[r].c) || [];
    let janCol=-1, febCol=-1;
    for(let c=0;c<cArr.length;c++){
      const t = norm(cellText(rows[r],c));
      if(t==="JANUARI" && janCol<0) janCol=c;
      if(t==="FEBRUARI" && febCol<0) febCol=c;
    }
    if(janCol>-1 && febCol>janCol){
      let unitCol = -1;
      for(let c=janCol-1;c>=0;c--){ if(norm(cellText(rows[r],c)) !== ''){ unitCol=c; break; } }
      if(unitCol<0) unitCol = Math.max(janCol-1, 0);
      return { headerRow:r, unitCol, janCol };
    }
  }
  throw new Error('Struktur sheet tidak dikenali (header "UNIT INDUK"/"Januari" tidak ketemu). DIAGNOSA: ' + diagnosaIsi(rows));
}
function parseUnitTable(rows, headerInfo){
  const { headerRow, unitCol, janCol } = headerInfo;
  const units = []; let totalRow = null;
  for(let r=headerRow+1; r<rows.length; r++){
    const nama = cellText(rows[r], unitCol);
    if(nama === null || String(nama).trim()==='') continue;  // baris kosong pemisah — lewati
    const N = norm(nama);
    if(/^[A-Z]$/.test(N)) continue;                          // baris penanda kolom "a b c d ..."
    if(N === "UNIT INDUK") continue;                         // header duplikat
    if(N === "TOTAL" || N === "GRAND TOTAL" || N === "JUMLAH"){
      totalRow = BULAN_ID.map((_,i)=>cellNum(rows[r], janCol+i)); break;
    }
    units.push({ nama, grup: (typeof grupUntuk==='function'?grupUntuk(nama):"Lainnya"), v: BULAN_ID.map((_,i)=>cellNum(rows[r], janCol+i)) });
  }
  if(!totalRow){
    // TOTAL tidak ketemu — kalau unit sudah terbaca, hitung sendiri sebagai cadangan
    if(units.length){
      totalRow = BULAN_ID.map((_,i)=>units.reduce((a,u)=>a+(u.v[i]||0),0));
    }else{
      throw new Error('Baris unit dan "TOTAL" tidak ditemukan setelah header. DIAGNOSA: ' + diagnosaIsi(rows));
    }
  }
  return { units, totalRow };
}
function findLastRowByLabel(rows, label){
  const L = norm(label);
  let found=null;
  for(let r=0;r<rows.length;r++){
    const cArr = (rows[r] && rows[r].c) || [];
    for(let c=0;c<cArr.length;c++){ if(norm(cellText(rows[r],c))===L){ found={row:r,labelCol:c}; } }
  }
  return found;
}
function parseTargetBlock(rows){
  const real = findLastRowByLabel(rows, "Pendapatan Aset Properti");
  const target = findLastRowByLabel(rows, "Target Bulanan");
  if(!real || !target) return null;   // biarkan pemanggil memakai cadangan
  return {
    realKum: BULAN_ID.map((_,i)=>cellNum(rows[real.row], real.labelCol+1+i)),
    targetKum: BULAN_ID.map((_,i)=>cellNum(rows[target.row], target.labelCol+1+i))
  };
}
function parseGvizResponse(resp){
  let rows = resp.table.rows;

  /* Jaring pengaman: kalau Google tetap "memakan" baris judul dan memindahkannya
     jadi label kolom (resp.table.cols[].label), bangun ulang baris itu di depan
     supaya pencarian header tetap ketemu. */
  const cols = resp.table.cols || [];
  const adaLabel = cols.some(c => c && c.label && String(c.label).trim() !== '');
  if(adaLabel){
    const barisJudul = { c: cols.map(c => (c && c.label) ? { v: c.label } : null) };
    rows = [barisJudul].concat(rows);
  }

  const headerInfo = findHeaderRow(rows);
  const { units, totalRow } = parseUnitTable(rows, headerInfo);

  let blok = parseTargetBlock(rows);
  if(!blok){
    // Blok target/realisasi tidak ketemu di sheet — pakai target RKAP 2026 yang sudah diketahui,
    // dan realisasi dihitung dari baris TOTAL. Dashboard tetap tampil dengan angka benar.
    blok = {
      realKum: totalRow.slice(),
      targetKum: [5909472831.80,9236251512.40,11818962795.10,48753291720.50,53924094433.43,
                  59833586257.23,67959137926.53,79778122553.83,86399624239.13,95991138363.43,
                  115770114336.53,147737300000.00]
    };
  }
  const { realKum, targetKum } = blok;
  // n = berapa bulan yang sudah terisi (nilai realKum > 0)
  let n = 0; for(let i=0;i<12;i++){ if(realKum[i]>0) n=i+1; }
  const targetPct = targetKum.map(v => Math.round((v / targetKum[11]) * 10000)/100);
  return {
    n, target: targetKum.map(v=>v/1e9), targetPct, targetThn: targetKum[11]/1e9,
    units: units.map(u=>({ nama:u.nama, grup:u.grup, v:u.v.slice(0,n) })),
    kum: realKum.slice(0,n),
    totalRowSheet: totalRow.slice(0,n)
  };
}

/* ══ Loader dengan JSONP + timeout + fallback ══ */
function loadLiveData(onSuccess, onFailure){
  let done = false;
  const cbName = "__pln_gviz_cb_" + Date.now();
  const timer = setTimeout(()=>{
    if(done) return; done = true;
    delete window[cbName];
    onFailure(new Error("Timeout — tidak ada respons dari Google Sheets dalam " + (GVIZ_TIMEOUT_MS/1000) + " detik."));
  }, GVIZ_TIMEOUT_MS);

  window[cbName] = function(resp){
    if(done) return; done = true;
    clearTimeout(timer);
    delete window[cbName];
    try{
      if(resp.status === 'error'){
        throw new Error((resp.errors && resp.errors[0] && resp.errors[0].detailed_message) || 'Google Sheets mengembalikan error.');
      }
      const data = parseGvizResponse(resp);
      onSuccess(data);
    }catch(e){ onFailure(e); }
  };

  /* Jaring pengaman: kalau karena satu dan lain hal Google tetap memakai handler
     bawaannya (google.visualization.Query.setResponse) alih-alih callback kita,
     tangkap juga dari sana supaya tidak berakhir timeout. */
  window.google = window.google || {};
  window.google.visualization = window.google.visualization || {};
  window.google.visualization.Query = window.google.visualization.Query || {};
  const prevSetResponse = window.google.visualization.Query.setResponse;
  window.google.visualization.Query.setResponse = function(resp){
    if(typeof window[cbName] === 'function'){ window[cbName](resp); }
    else if(typeof prevSetResponse === 'function'){ prevSetResponse(resp); }
  };

  const s = document.createElement('script');
  // PENTING: parameter di dalam tqx dipisah dengan TITIK DUA (responseHandler:namaFungsi),
  // bukan tanda sama dengan. Kalau salah, Google mengabaikan callback kita dan
  // memakai handler bawaannya, sehingga respons tidak pernah sampai -> timeout.
  // headers=0 : jangan biarkan Google menebak-nebak baris mana yang jadi judul kolom —
  // kirim SEMUA baris apa adanya, karena baris "UNIT INDUK" ada di tengah sheet (baris 6),
  // bukan di baris pertama, dan kita mencarinya sendiri lewat teksnya.
  s.src = "https://docs.google.com/spreadsheets/d/" + GVIZ_FILE_ID + "/gviz/tq?gid=" + GVIZ_GID +
          "&headers=0&tqx=out:json;responseHandler:" + cbName;
  s.onerror = function(){
    if(done) return; done = true;
    clearTimeout(timer);
    delete window[cbName];
    onFailure(new Error("Gagal memuat script dari Google Sheets — periksa apakah sheet masih di-share publik."));
  };
  document.head.appendChild(s);
}
