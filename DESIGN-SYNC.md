# DESIGN-SYNC — Kesesuaian Desain Stitch ↔ PRD ↔ Kode

Dibangun dari `PRD_Aplikasi_Asesmen_Online.md` dan ekspor Stitch (`stitch_asesmen_online_sekolah_ui_ux.zip`). Prinsip: **tidak mengarang** — bila desain dan PRD berbeda, yang diikuti dan dicatat di bawah ini.

## Pemetaan halaman
| Stitch | Rute | Berkas |
|---|---|---|
| login_siswa_portal_asesmen_cbt | `#/login` | pages/login.js |
| login_terpadu_guru_admin | `#/login/staf` | pages/login.js |
| dashboard_admin_asesmen | `#/admin/dashboard` | admin-dashboard.js |
| kelola_data_siswa_akun, w_03 | `#/admin/siswa` | admin-siswa.js |
| w_04_data_kelas_rombel | `#/admin/kelas` | admin-kelas.js |
| w_05_data_guru | `#/admin/guru` | admin-guru.js |
| model_bank_soal_asesmen | `#/admin/soal` | admin-soal.js |
| bank_soal_mandiri | `#/admin/butir`, `#/guru/bank-soal` | bank.js |
| editor_butir_soal | `#/admin/editor`, `#/guru/editor` | bank.js |
| jadwal_asesmen | `#/admin/jadwal` | admin-jadwal.js |
| token_ujian | `#/admin/token` | admin-token.js |
| cetak_kartu_asesmen_siswa | `#/admin/kartu` | admin-kartu.js |
| template_berkas_cloud | `#/admin/template` | admin-template.js |
| rekap_nilai_siswa | `#/admin/rekap`, `#/guru/rekap` | rekap.js |
| dashboard_guru | `#/guru/dashboard` | guru.js |
| catatan_perilaku_siswa | `#/guru/catatan` | guru.js |
| w_16 jadwal & input token | `#/siswa/jadwal` | siswa.js |
| w_17 ruang asesmen | `#/siswa/ujian/:id` | siswa.js |
| w_18 validasi belum lengkap | modal di ruang asesmen | siswa.js |
| w_19 konfirmasi pengumpulan | modal di ruang asesmen | siswa.js |
| w_20 tanda terima | `#/siswa/resi/:id` | siswa.js |

## Halaman turunan (tidak ada di Stitch — dibuat dari PRD)
- `#/admin/pengaturan` — pengaturan umum, notifikasi WA/Email, kontak & blast, migrasi data, status sistem.
- `#/guru/jadwal` — jadwal mapel guru (baca-saja).
- `#/guru/panduan` — panduan penilaian (statis).
- `#/siswa/riwayat` — daftar asesmen yang sudah dikumpulkan + tautan tanda terima.

## Perbedaan yang disengaja
1. **Satu build Tailwind terpadu** (bukan bundel terpisah per peran); token warna Stitch dipertahankan.
2. Menu siswa: "Jadwal Ujian Saya" dan "Riwayat Pengumpulan" (bukan "Ruang Asesmen CBT"/"Riwayat & Nilai") — **siswa tidak melihat nilai** sesuai PRD.
3. Peran dipilih lewat tab pada login; menu akun hanya berisi Keluar (bukan "Ganti Peran"). Ganti sandi hanya untuk admin (route backend admin-only).
4. Panel "Standar Distribusi" pada paket soal diganti **komposisi aktual** butir; panel kuota diganti metrik jujur dari data nyata.
5. Jadwal tampilan Kalender / Per Lab berupa tampilan terkelompok; PDF jadwal lewat cetak browser.
6. Editor rumus: LaTeX dalam `\( … \)` yang dirender KaTeX (bukan editor rumus visual).
7. Tidak ada "Sinkron Akun Belajar.id" (tidak ada di PRD sebagai fitur yang dapat dijalankan).
8. Teks versi "GAS v4.2" dari mockup diganti versi sistem nyata dari backend.
9. Pada ruang asesmen, "Tetap Selesaikan" tidak disediakan saat masih ada soal kosong — sesuai aturan PRD "semua soal wajib terjawab" (kecuali waktu habis → dikumpulkan otomatis).
10. Resi menampilkan status "Menunggu koreksi guru" untuk soal uraian, tanpa nilai.
