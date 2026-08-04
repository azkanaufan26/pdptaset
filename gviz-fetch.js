/* ══ Live fetch dari Google Sheets (Rekap 5105000101) via Google Visualization API ══
   Teknik JSONP (script tag), bukan fetch()/XHR — supaya tidak terkendala CORS,
   karena endpoint gviz Google tidak selalu mengirim header CORS untuk permintaan lintas-origin. */

const GVIZ_FILE_ID = "1q9f-1edCwsR488dRTmUHyZxy3rBEo5wT";
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
function findHeaderRow(rows){
  for(let r=0;r<rows.length;r++){
    const cArr = rows[r] && rows[r].c || [];
    for(let c=0;c<cArr.length;c++){
      if(cellText(rows[r],c) === "UNIT INDUK"){
        let janCol = -1;
        for(let c2=c;c2<cArr.length;c2++){ if(cellText(rows[r],c2)==="Januari"){ janCol=c2; break; } }
        if(janCol>-1) return { headerRow:r, unitCol:c, janCol };
      }
    }
  }
  throw new Error('Header "UNIT INDUK" tidak ditemukan.');
}
function parseUnitTable(rows, headerInfo){
  const { headerRow, unitCol, janCol } = headerInfo;
  const units = []; let totalRow = null;
  for(let r=headerRow+2; r<rows.length; r++){
    const nama = cellText(rows[r], unitCol);
    if(nama === null){
      let blankStreak=0, rr=r;
      while(rr<rows.length && cellText(rows[rr],unitCol)===null){ blankStreak++; rr++; if(blankStreak>2) break; }
      if(blankStreak>2) break;
      continue;
    }
    if(nama.toUpperCase()==="TOTAL"){ totalRow = BULAN_ID.map((_,i)=>cellNum(rows[r], janCol+i)); break; }
    units.push({ nama, grup: (typeof grupUntuk==='function'?grupUntuk(nama):"Lainnya"), v: BULAN_ID.map((_,i)=>cellNum(rows[r], janCol+i)) });
  }
  if(!totalRow) throw new Error('Baris "TOTAL" tidak ditemukan.');
  return { units, totalRow };
}
function findLastRowByLabel(rows, label){
  let found=null;
  for(let r=0;r<rows.length;r++){
    const cArr = rows[r] && rows[r].c || [];
    for(let c=0;c<cArr.length;c++){ if(cellText(rows[r],c)===label){ found={row:r,labelCol:c}; } }
  }
  return found;
}
function parseTargetBlock(rows){
  const real = findLastRowByLabel(rows, "Pendapatan Aset Properti");
  const target = findLastRowByLabel(rows, "Target Bulanan");
  if(!real || !target) throw new Error('Baris target/realisasi tidak ditemukan.');
  return {
    realKum: BULAN_ID.map((_,i)=>cellNum(rows[real.row], real.labelCol+1+i)),
    targetKum: BULAN_ID.map((_,i)=>cellNum(rows[target.row], target.labelCol+1+i))
  };
}
function parseGvizResponse(resp){
  const rows = resp.table.rows;
  const headerInfo = findHeaderRow(rows);
  const { units, totalRow } = parseUnitTable(rows, headerInfo);
  const { realKum, targetKum } = parseTargetBlock(rows);
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

  const s = document.createElement('script');
  s.src = "https://docs.google.com/spreadsheets/d/" + GVIZ_FILE_ID + "/gviz/tq?gid=" + GVIZ_GID +
          "&tqx=out:json;responseHandler=" + cbName;
  s.onerror = function(){
    if(done) return; done = true;
    clearTimeout(timer);
    delete window[cbName];
    onFailure(new Error("Gagal memuat script dari Google Sheets — periksa apakah sheet masih di-share publik."));
  };
  document.head.appendChild(s);
}
