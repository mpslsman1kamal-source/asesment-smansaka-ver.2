/* boot.js — dijalankan terakhir: mulai aplikasi */
(function () {
  'use strict';
  if (!Api.configured()) {
    document.getElementById('app').innerHTML = '<div style="max-width:560px;margin:12vh auto;padding:24px;font-family:Inter,sans-serif"><h1 style="font-size:22px;margin:0 0 8px">Aplikasi belum dihubungkan ke server</h1><p style="color:#434655;line-height:1.6">Buka berkas <b>js/config.js</b>, lalu ganti <code>GANTI_DENGAN_URL_EXEC_ANDA</code> dengan URL Web App Google Apps Script Anda (berakhiran <code>/exec</code>). Simpan, lalu unggah ulang ke GitHub.</p></div>';
    return;
  }
  App.start();
})();
