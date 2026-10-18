# Shadow Awakening: Distorsi

Game idle RPG bayangan yang berjalan langsung di browser dan bisa dipasang seperti aplikasi (PWA). Mendukung main offline.

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | Game lengkap, splash logo beranimasi + loading, semua meta tag |
| `sw.js` | Service worker: cache, main offline, pembaruan otomatis |
| `manifest.webmanifest` | Data aplikasi (nama, ikon, warna, pintasan) |
| `icons/` | Logo, favicon, ikon Apple/Android/Windows, gambar share, splash iOS |
| `favicon.ico`, `browserconfig.xml` | Ikon tab browser dan tile Windows |
| `404.html`, `robots.txt`, `sitemap.xml`, `.nojekyll` | Pendukung GitHub Pages dan SEO |
| `.github/workflows/pages.yml` | Deploy otomatis ke GitHub Pages |

## Tutorial & Panduan (baru)

Semuanya ada di dalam `index.html` (blok `<!-- BEGIN TUTORIAL -->` sampai `<!-- END TUTORIAL -->`), tanpa file tambahan.

- **Tutorial interaktif** (spotlight, 33 langkah): otomatis berjalan untuk pemain baru. Pemain lama mendapat tawaran satu kali. Bisa diulang di **Pengaturan > Ulangi Tutorial**.
- **Pusat Panduan** (33 artikel, bisa dicari): **Pengaturan > Panduan Bermain**, atau tombol **?** di header panel (membuka bantuan sesuai tab). Tabel skill, pet, karakter, senjata, area, dan cuaca dibangkitkan dari data game sehingga selalu sinkron.
- **Petunjuk kontekstual**: banner singkat muncul saat bos pertama, musuh elit, Ultimate siap, HP kritis, fitur baru terbuka (stage 2/4/6/7/8), dan sebagainya. Bisa dimatikan di Pengaturan.
- Pengaturan modul ada di awal blok: `REWARD` (hadiah sekali untuk yang menamatkan tutorial, kosongkan `{}` untuk menonaktifkan), `HINT_GAP`, `HINT_SHOW`. Isi langkah ada di `STEPS`, petunjuk di `HINTS`, artikel di `ART`.
- Status tersimpan di `S.tut` (ikut tersimpan/ekspor bersama progres).

## Cara pasang di GitHub Pages

1. Buat repository baru, misalnya `shadow-awakening` (Public).
2. Upload **semua** isi folder ini ke root repository (termasuk folder `icons` dan `.github`). Lewat web: **Add file > Upload files**, seret semua file dan folder.
3. Buka **Settings > Pages**, pada **Source** pilih **GitHub Actions**.
4. Buka tab **Actions**, tunggu workflow *Deploy ke GitHub Pages* selesai (centang hijau).
5. Game bisa dibuka di `https://USERNAME.github.io/shadow-awakening/`.

Workflow otomatis mengisi URL situs di meta tag dan kode versi cache (`BUILD`) di `sw.js` setiap kali kamu push, jadi pemain selalu mendapat versi terbaru.

### Tanpa GitHub Actions (cara manual)
Pada **Settings > Pages** pilih **Deploy from a branch**, branch `main`, folder `/ (root)`. Lalu:
- Ganti semua `https://USERNAME.github.io/shadow-awakening/` di `index.html`, `robots.txt`, `sitemap.xml` dengan URL situsmu.
- Setiap rilis baru, ubah `const BUILD = '__BUILD__'` di `sw.js` menjadi nilai baru (misalnya `'v4.0.1'`), supaya cache pemain diperbarui.

## Hemat baterai dan tidak lag di belakang layar

- Saat tab/aplikasi tidak terlihat: loop game berhenti total, semua timer berhenti, audio disuspend, progres disimpan.
- Saat jendela terlihat tapi tidak fokus: dibatasi 10 FPS.
- **Mode Hemat Baterai** (Pengaturan): 30 FPS dan grafis lebih ringan.
- Jika FPS turun terus, game otomatis mengurangi partikel dan resolusi.
- Jumlah efek dan teks melayang dibatasi agar memori tidak membengkak.

## Pasang sebagai aplikasi

- Android/Chrome: Pengaturan > **Pasang Game ke Layar Utama**, atau menu browser > Instal aplikasi.
- iPhone/iPad (Safari): tombol Bagikan > **Tambah ke Layar Utama**.
- Ikon aplikasi punya pintasan tekan-lama: Peta Dunia dan Misi.

## Uji lokal

Service worker butuh `http://localhost` atau HTTPS:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```
