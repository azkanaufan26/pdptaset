# Dashboard Monitoring Pendapatan Aset Properti — PLN

Dashboard statis (HTML/CSS/JS, tanpa backend) yang menampilkan realisasi pendapatan
aset properti PLN Group vs target RKAP. Data 2026 diambil **otomatis** setiap kali
dashboard dibuka, langsung dari Google Sheets (sheet **Rekap 5105000101**) — tidak
perlu regenerate file setiap bulan.

## ⚠️ Penting — baca sebelum publish

Dashboard ini dirancang untuk di-host di **GitHub Pages**, yang berarti:

- **Kode dashboard ini akan bisa dilihat siapa saja** yang tahu URL-nya (GitHub Pages
  selalu publik, walau repository-nya di-set private).
- **Sheet Google Sheets sumber data juga harus di-share "Anyone with the link — Viewer"**,
  supaya dashboard bisa membacanya langsung dari browser pengguna tanpa login.

Ini adalah keputusan yang sudah didiskusikan dan disetujui sebelumnya. Kalau situasi
berubah (misalnya datanya jadi lebih sensitif), pertimbangkan pindah ke intranet PLN
atau SharePoint alih-alih GitHub Pages — lihat bagian "Alternatif yang lebih aman"
di bawah.

## Cara publish ke GitHub Pages

1. **Buat repository baru** di GitHub (Public atau Private — untuk Pages gratis
   biasa dipakai Public; kalau organisasi punya GitHub Enterprise Cloud, Private
   juga bisa dengan Pages access control).
2. Klik **Add file → Upload files**, upload **semua file di folder ini**:
   - `index.html`
   - `app.js`
   - `data-2025.js`
   - `data-2026-fallback.js`
   - `gviz-fetch.js`
   - `pln-logo.png`
   - `README.md` (opsional, boleh diikutkan)
3. Commit langsung ke branch `main`.
4. Buka **Settings → Pages** (di sidebar kiri repo).
5. Di bagian **Build and deployment → Source**, pilih **Deploy from a branch**.
6. Pilih branch **main**, folder **/ (root)**, klik **Save**.
7. Tunggu 1–2 menit, lalu buka URL yang muncul di bagian atas halaman Pages —
   formatnya `https://<username-github>.github.io/<nama-repo>/`.

Selesai — dashboard sudah live dan akan otomatis menampilkan data terbaru setiap
kali dibuka, mengikuti isi sheet Rekap 5105000101 di Google Sheets.

## Cara kerja auto-update

Setiap kali seseorang membuka dashboard ini di browser:

1. `gviz-fetch.js` mengirim permintaan ke Google Sheets lewat
   **Google Visualization API** (`/gviz/tq`) — endpoint publik yang tidak
   memerlukan login, khusus untuk membaca isi sheet yang sudah di-share publik.
2. Respons di-parse untuk mencari tabel unit (kolom "UNIT INDUK", "Januari"..."Desember")
   dan baris ringkasan target/realisasi — pencarian dilakukan **berdasarkan teks
   label**, bukan posisi baris/kolom tetap, supaya tidak gampang rusak kalau sheet
   sumber sedikit berubah (baris disisipkan, dsb).
3. Kalau berhasil, dashboard menampilkan data live dengan indikator hijau
   "Data 2026 berhasil dimuat langsung dari Google Sheets".
4. Kalau gagal (timeout, sheet tidak lagi di-share publik, dsb), dashboard otomatis
   memakai **data cadangan** (snapshot Juli 2026 yang sudah di-embed di
   `data-2026-fallback.js`) dengan indikator kuning yang menjelaskan alasannya —
   dashboard tidak akan pernah tampil kosong.

## Yang perlu kamu lakukan tiap bulan

**Tidak ada.** Selama kamu (atau tim) terus mengisi RAW DATA di Google Sheets seperti
biasa, dan sheet Rekap 5105000101 tetap otomatis ter-update dan tetap di-share
publik, dashboard ini akan selalu menampilkan angka terbaru tanpa perlu disentuh.

## Kalau sheet sumber pindah / berubah

Konfigurasi sumber data ada di dua baris awal `gviz-fetch.js`:

```js
const GVIZ_FILE_ID = "1q9f-1edCwsR488dRTmUHyZxy3rBEo5wT";
const GVIZ_GID = "1664615468"; // tab "Rekap 5105000101"
```

Kalau file Google Sheets-nya diganti atau tab-nya dipindah, cukup update dua nilai
ini (FILE_ID dari URL sheet, GID dari angka setelah `gid=` saat tab yang benar
sedang dibuka), commit ulang, dan dashboard langsung menyesuaikan — tidak perlu
mengubah bagian lain.

## Data 2025

Data tahun 2025 (untuk perbandingan YoY) bersifat historis dan sudah closed
(sesuai Laporan Keuangan per 31 Desember 2025), jadi di-embed statis di
`data-2025.js` — tidak perlu live-fetch karena tidak akan berubah lagi.

## Alternatif yang lebih aman (kalau kebutuhan berubah)

Kalau ke depannya data ini dianggap terlalu sensitif untuk publik:
- **Server intranet PLN** — hosting file statis ini di web server internal,
  dibatasi jaringan kantor/VPN.
- **GitHub Enterprise Cloud** dengan Pages access control — kode dan situsnya
  bisa benar-benar private, terbatas untuk anggota organisasi.
- **SharePoint/Teams** — untuk distribusi dokumen ke tim tanpa perlu web hosting.

Ketiganya butuh mengubah `gviz-fetch.js` supaya sumber datanya juga tidak lagi
mengandalkan sheet publik (misalnya diganti file `data.json` yang di-update manual,
atau API internal PLN) — tanya lagi kalau saatnya tiba.

---
Divisi Umum & Aset Properti — PT PLN (Persero) Kantor Pusat
