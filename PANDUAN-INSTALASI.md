# Panduan Instalasi — Asesmen Online (untuk pemula)

Total pemasangan ±30 menit. Ada **dua bagian**: (A) backend di Google Apps Script, (B) frontend di GitHub Pages.

## Bahan
- Akun Google sekolah/pribadi.
- Akun GitHub (gratis): https://github.com
- Berkas: folder backend `.gs` (14 berkas + `appsscript.json`) dan `asesmen-online-frontend.zip`.

---
## A. Backend (Google Apps Script)

1. Buka https://script.google.com → **New project**. Beri nama "Asesmen Online API".
2. Hapus isi `Code.gs`. Untuk **setiap** berkas `.gs` (00_Config … 12_Dash_Sys, 99_Setup): klik **+ → Script**, beri nama sama (tanpa `.gs`), tempel isinya.
3. Buka **Project Settings (ikon roda gigi)** → centang **Show "appsscript.json" manifest file**. Kembali ke Editor, buka `appsscript.json`, ganti seluruh isinya dengan berkas `appsscript.json` yang diberikan. Simpan.
4. Pilih fungsi **`setupAppEnvironment`** di menu atas → **Run**. Setujui izin (klik *Advanced → Go to … (unsafe)* — wajar untuk skrip buatan sendiri).
5. Buka **Execution log**. Catat:
   - **Login admin pertama** (`admin` + sandi acak). **Hanya tampil sekali.** Lupa? jalankan `resetAksesDarurat`.
   - Tautan Spreadsheet database.
   `SESSION_SECRET` dan `CRED_KEY` dibuat otomatis di Script Properties — Anda tidak perlu mengisi apa pun.
6. **Deploy → New deployment → Web app**: *Execute as:* **Me**, *Who has access:* **Anyone** → Deploy. Salin URL berakhiran `/exec`.
7. (Opsional) Jalankan `isiDataContoh` untuk data uji — **hapus sebelum dipakai sungguhan**. `cekPerforma` untuk diagnosa.
8. Setiap kali kode `.gs` diubah: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (URL tidak berubah).

### Pemicu & kuota
`setupAppEnvironment` memasang pemicu `keepWarm` (tiap 1 menit: menjaga server hangat dan memproses antrean hasil/notifikasi). Di luar hari ujian jalankan `matikanKeepWarm` untuk menghemat kuota; nyalakan lagi H-1 dengan `nyalakanKeepWarm`.

### Logo sekolah di kartu (opsional)
Unggah logo ke Drive, salin ID file, tempel di fungsi `setLogoSekolah`, jalankan.

---
## B. Frontend (GitHub Pages)

1. Ekstrak `asesmen-online-frontend.zip`. Buka `js/config.js`, ganti `GANTI_DENGAN_URL_EXEC_ANDA` dengan URL `/exec` dari langkah A6. (Opsional: ganti `img/logo.png` dan `img/favicon.png` dengan logo sekolah.)
2. Di GitHub: **New repository** (mis. `asesmen-online`), Public, tanpa README.
3. Buka terminal **di dalam folder hasil ekstrak** (folder yang berisi `index.html` — folder inilah yang menjadi root repo):
```
git init
git add .
git commit -m "Pemasangan pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/asesmen-online.git
git push -u origin main
```
   Saat diminta sandi, gunakan **Personal Access Token** (GitHub → Settings → Developer settings → Tokens, centang `repo`).
4. Repo → **Settings → Pages** → Source: *Deploy from a branch*, Branch `main`, folder `/ (root)` → Save. Tunggu 1–2 menit; alamat situs tampil di halaman itu: `https://USERNAME.github.io/asesmen-online/`.
5. Update berikutnya: ubah berkas → `git add .` → `git commit -m "update"` → `git push`.

---
## C. Penggunaan pertama
1. Buka situs → `#/login/staf` → tab **Administrator** → masuk dengan login dari log.
2. **Pengaturan Sistem → Umum**: isi nama sekolah, tahun ajaran, KKM, kepala sekolah.
3. Urutan data: **Kelas → Siswa (impor Excel) → Guru → Paket soal → Butir soal → Jadwal**.
4. **Kartu Peserta**: cetak kartu (kata sandi awal siswa tersimpan terenkripsi sehingga dapat dicetak ulang). Placeholder template Docs: `{{NAMA}} {{NISN}} {{KELAS}} {{SESI}} {{RUANG}} {{MEJA}} {{USERNAME}} {{PASSWORD}} {{SEKOLAH}} {{JENIS}} {{TAHUN_AJARAN}} {{SEMESTER}} {{KOTA}} {{TANGGAL}} {{KEPSEK}} {{NIP_KEPSEK}}`.
5. Hari ujian: **Token Ujian** → rilis token, proyeksikan ke layar; siswa memasukkan token di halaman jadwal.
6. Setelah ujian: **Rekap** → koreksi uraian, unduh Excel / leger.

## D. Notifikasi WhatsApp (opsional, bawaan MATI)
Pengaturan Sistem → Notifikasi: isi **FONNTE_TOKEN** (satu-satunya rahasia yang Anda isi sendiri — disimpan di Script Properties, tidak pernah ke Sheets/frontend), lalu aktifkan saklar dan pilih peristiwa. Blast dikirim per batch lewat antrean.

## E. Migrasi dari aplikasi lama
Pengaturan Sistem → Migrasi: unggah/tempel data lama → **Dry-run** (tidak mengubah apa pun) → periksa laporan → **Jalankan**. Aman diulang (delta sync). Lakukan cutover di luar jam ujian.

## F. Batas yang perlu diketahui
- Perangkat siswa terkunci satu per akun; bila perlu pindah, admin menekan **Lepas kunci**.
- Sandi awal siswa disimpan **terenkripsi dapat dibalik** (kunci `CRED_KEY`) agar kartu bisa dicetak ulang; sandi guru/admin hanya hash.
- Ekspor Excel, mode template Google Docs, dan impor berkas diuji terhadap simulator, bukan akun Google nyata — uji sekali dengan 3 siswa contoh sebelum hari-H.
- Ukuran kertas kartu A6 mengikuti pengaturan cetak browser/PDF Google.
- QR memakai layanan api.qrserver.com (butuh internet); bila diblokir, kartu tetap tercetak tanpa QR.
- Kapasitas: Apps Script membatasi eksekusi bersamaan; sistem memakai cache, autosave delta, dan antrean tulis untuk ratusan siswa serentak, namun lakukan uji beban kecil di lab sebelum ujian besar.
- Pengaturan lain: `Pengaturan Sistem → Status Sistem` menampilkan kesiapan Script Properties.

## G. Masalah umum
| Gejala | Solusi |
|---|---|
| "URL server belum diatur" | Isi `GAS_URL` di `js/config.js`, push ulang |
| Situs 404 | Pastikan `index.html` ada di **root** repo, Pages aktif |
| "Authorization required" | Ulangi langkah A4/A6, akses *Anyone* |
| Perubahan backend tak berlaku | Deploy **New version** (A8) |
| Siswa "aktif di perangkat lain" | Admin → Data Siswa → Lepas kunci |
