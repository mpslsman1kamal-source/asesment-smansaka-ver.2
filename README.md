# Asesmen Online (CBT) — Frontend

Aplikasi asesmen berbasis komputer untuk sekolah: **Admin**, **Guru**, dan **Siswa**.
Frontend statis (HTML/CSS/JS murni) yang dijalankan di **GitHub Pages**; backend berupa **REST API Google Apps Script** + Google Sheets.

## Isi folder (root folder ini = root repository GitHub)

| Berkas / folder | Fungsi |
|---|---|
| `index.html` | Satu-satunya halaman (SPA, navigasi `#/…`) |
| `css/app.css` | Tailwind hasil build (sudah jadi, tidak perlu di-build ulang) |
| `css/extra.css` | Gaya tambahan (animasi, cetak, teks soal) |
| `js/config.js` | **Satu-satunya berkas yang Anda ubah**: isi `GAS_URL` |
| `js/api.js`, `ui.js`, `table.js`, `app.js`, `boot.js` | Inti: API client (cache/SWR/batch), komponen UI, tabel, router & cangkang |
| `js/pages/*.js` | Halaman per peran (login, admin-*, bank, rekap, guru, siswa) |
| `img/` | Logo & favicon (ganti dengan logo sekolah Anda, nama berkas sama) |
| `DESIGN-SYNC.md` | Catatan kesesuaian desain Stitch ↔ PRD ↔ kode |
| `PANDUAN-INSTALASI.md` | Panduan pemasangan langkah demi langkah |

Backend (`.gs`) **tidak** ada di folder ini — dipasang terpisah di Apps Script.

## Pustaka luar (dimuat dari CDN saat dibutuhkan)
KaTeX 0.16.9 (rumus pada soal), SheetJS 0.18.5 (impor/ekspor Excel), Google Fonts (Inter, Material Symbols), QR via api.qrserver.com (tanda terima & kartu).

## Keamanan
Tidak ada token, kunci, atau sandi di frontend. Semua rahasia berada di *Script Properties* Apps Script.
