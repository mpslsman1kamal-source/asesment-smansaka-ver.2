/* admin-dashboard.js — Dashboard Admin (dashboard_admin_asesmen) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, $ = U.$;
  App.register('admin/dashboard', {
    role: 'admin', layout: 'staf', title: 'Dashboard Administrator',
    prefetch: function () { return [{ action: 'dash.admin', data: {} }]; },
    init: function (el) {
      el.innerHTML = '<div data-err hidden></div><div data-root></div>';
      el.addEventListener('click', function (e) {
        var a = e.target.closest('[data-go]'); if (a) { App.go(a.dataset.go); return; }
        if (e.target.closest('[data-retry]')) el._reload && el._reload();
      });
    },
    show: function (el) {
      var root = $('[data-root]', el);
      if (!root.firstChild) U.mount(root, h`<div class="grid grid-cols-2 lg:grid-cols-4 gap-space-md">${[1, 2, 3, 4].map(function () { return raw('<div class="h-28 rounded-xl bg-surface-container-low animate-pulse"></div>'); })}</div>`);
      el._reload = function () { C.load(el, 'dash.admin', {}, function (r) { draw(root, r.dash); }, { ttl: 15000, force: true }); };
      C.load(el, 'dash.admin', {}, function (r) { draw(root, r.dash); }, { ttl: 15000 });
    }
  });

  function draw(root, d) {
    var s = d.statistik || {}, k = d.kapasitas || {}, l = d.latensi || {}, me = Api.me() || {}, cfg = App.config || {};
    var pers = Math.min(100, k.persen || 0), warna = pers > 80 ? 'bg-error' : pers > 50 ? 'bg-status-warning-text' : 'bg-primary-container';
    U.mount(root, h`
    <div class="flex flex-col gap-space-lg">
      <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div><h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">Selamat datang, ${me.nama || 'Administrator'}</h1>
          <p class="font-body-md text-on-surface-variant mt-0.5">${cfg.NAMA_SEKOLAH || ''} — ringkasan sistem asesmen hari ini.</p></div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-success-bg text-status-success-text self-start">${U.ic('database', 'text-[20px]')}<div class="leading-tight"><div class="font-label-sm uppercase tracking-wide">Status Database</div><div class="font-label-md font-semibold">Terhubung · Google Sheets</div></div></div>
      </section>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        ${C.stat({ label: 'Siswa Aktif', value: U.num(s.siswa), icon: 'groups', foot: s.guru + ' guru aktif', footKind: 'info' })}
        ${C.stat({ label: 'Kelas / Rombel', value: U.num(s.kelas), icon: 'meeting_room', foot: 'Aktif', footKind: 'ok' })}
        ${C.stat({ label: 'Butir Siap Diujikan', value: U.num(s.butir), icon: 'quiz', foot: s.paket + ' paket soal', footKind: 'info' })}
        ${C.stat({ label: 'Sesi Hari Ini', value: U.num(s.jadwalHariIni), icon: 'event_available', foot: s.berlangsung ? s.berlangsung + ' berlangsung' : 'Belum ada yang berlangsung', footKind: s.berlangsung ? 'ok' : 'mute' })}
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-space-lg">
        <section class="xl:col-span-2 bg-surface-card rounded-xl shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-space-md md:px-space-lg py-space-md border-b border-border-standard/60"><h2 class="font-headline-sm text-headline-sm text-on-surface">Jadwal Asesmen Terdekat &amp; Status Sesi</h2><button type="button" data-go="admin/jadwal" class="font-label-md text-primary hover:underline">Lihat semua</button></div>
          <div class="overflow-x-auto"><table class="w-full text-left text-body-md min-w-[640px]"><thead><tr class="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wide"><th class="py-2.5 px-4">Jam Sesi</th><th class="py-2.5 px-4">Mata Pelajaran</th><th class="py-2.5 px-4">Kelas &amp; Ruang</th><th class="py-2.5 px-4">Status</th><th class="py-2.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody>${(d.mendatang || []).length ? d.mendatang.map(function (j) { return h`<tr class="border-b border-border-standard/50 hover:bg-surface-container-low/60"><td class="py-3 px-4"><div class="font-tabular-code text-tabular-code">${j.JamMulai}–${j.JamSelesai}</div><div class="font-body-sm text-on-surface-variant">${U.hariTgl(j.Tanggal)}</div></td><td class="py-3 px-4 font-medium">${j.Mapel}</td><td class="py-3 px-4"><div>${j.Kelas}</div><div class="font-body-sm text-on-surface-variant">${j.Lab || '—'}</div></td><td class="py-3 px-4">${U.statusJadwalBadge(j.status)}</td><td class="py-3 px-4"><div class="flex justify-end gap-1"><button type="button" data-go="admin/token" class="px-2.5 py-1 rounded-lg bg-surface-container-low text-primary font-label-md hover:bg-surface-container">Token</button><button type="button" data-go="admin/rekap" class="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md hover:bg-surface-container">Rekap</button></div></td></tr>`; })
            : raw('<tr><td colspan="5" class="py-10 text-center text-on-surface-variant">Belum ada jadwal mendatang.</td></tr>')}</tbody></table></div>
        </section>

        <div class="flex flex-col gap-space-lg">
          <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-sm">Aksi Cepat Administrator</h2>
            <div class="grid grid-cols-2 gap-2">${[['admin/token', 'key', 'Buat Token Baru'], ['admin/kartu', 'badge', 'Cetak Kartu Massal'], ['admin/soal', 'upload_file', 'Unggah Bank Soal'], ['admin/rekap', 'download', 'Unduh Rekap Nilai']].map(function (a) { return h`<button type="button" data-go="${a[0]}" class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors text-center">${U.ic(a[1], 'text-primary text-[26px]')}<span class="font-label-md leading-tight">${a[2]}</span></button>`; })}</div></section>

          <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-sm">Status Kapasitas GAS Engine</h2>
            <div class="flex justify-between font-label-md mb-1"><span>Sel Google Sheets</span><span class="font-tabular-code">${U.num(k.sel)} / ${U.num(k.batasSel)} (${k.persen || 0}%)</span></div>
            <div class="h-2 rounded-full bg-surface-container overflow-hidden mb-space-md"><div class="h-full ${warna}" style="width:${Math.max(1, pers)}%"></div></div>
            <div class="flex justify-between font-label-md mb-1"><span>Respons server (rata-rata)</span><span class="font-tabular-code">${l.n ? l.rata + ' ms' : '—'}</span></div>
            <div class="flex justify-between font-label-md mb-1"><span>Respons terlambat (P95)</span><span class="font-tabular-code">${l.n ? l.p95 + ' ms' : '—'}</span></div>
            <div class="flex justify-between font-label-md mb-1"><span>Hasil ujian tersimpan</span><span class="font-tabular-code">${U.num(s.hasil)}</span></div>
            <div class="flex justify-between font-label-md"><span>Notifikasi WA / Email</span><span>${U.badge(d.notif && d.notif.wa ? 'WA On' : 'WA Off', d.notif && d.notif.wa ? 'ok' : 'mute')} ${U.badge(d.notif && d.notif.email ? 'Email On' : 'Email Off', d.notif && d.notif.email ? 'ok' : 'mute')}</span></div>
            <p class="font-body-sm text-on-surface-variant mt-space-sm">Kuota eksekusi harian Apps Script tidak dapat dibaca aplikasi; pantau di dasbor Apps Script bila perlu.</p></section>
        </div>
      </div>
    </div>`);
  }
})();
