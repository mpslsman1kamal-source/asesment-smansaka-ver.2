/* admin-soal.js — Model & Bank Soal Asesmen (model_bank_soal_asesmen): manajemen paket soal */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$;
  var STP = { 'Siap Ujian': 'ok', 'Draft Guru': 'warn', 'Menunggu Verifikasi': 'info', 'Perlu Revisi': 'err' };
  App.register('admin/soal', {
    role: 'admin', layout: 'staf', title: 'Model & Bank Soal',
    prefetch: function () { return [{ action: 'model.list', data: {} }, { action: 'guru.list', data: {} }]; },
    init: function (el) {
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Model & Bank Soal Asesmen', 'Paket soal terverifikasi per mata pelajaran, komposisi butir, dan kesiapan kunci jawaban.', raw(U.str(C.btn('primary', 'add_circle', 'Buat Paket Soal Baru', 'id="p-add"'))))}
        <div id="p-stat" class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg"></div>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg mb-space-lg"><h2 class="font-headline-sm mb-1">Komposisi Butir Saat Ini</h2><p class="font-body-sm text-on-surface-variant mb-space-sm">Jumlah butir dan poin per tipe di seluruh paket (tidak termasuk butir diarsipkan).</p><div id="p-komp" class="grid grid-cols-2 md:grid-cols-4 gap-space-sm"></div></section>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg">
          <div class="flex flex-wrap items-center gap-2 mb-space-md">${C.search('p-q', 'Cari kode atau mata pelajaran…')}<span data-ft></span>${C.select('p-st', [['', 'Status: Semua'], ['Siap Ujian', 'Siap Ujian'], ['Draft Guru', 'Draft Guru'], ['Menunggu Verifikasi', 'Menunggu Verifikasi'], ['Perlu Revisi', 'Perlu Revisi']])}</div>
          <div id="p-tv"></div></section>`);
      var tf = '', sf = '', tv;
      function ap() { tv.setFilter(function (r) { return (!tf || r.Tingkat === tf) && (!sf || r.Status === sf); }); }
      $('[data-ft]', el).innerHTML = U.str(C.select('p-t', [['', 'Tingkat: Semua']].concat(C.tingkatList().map(function (t) { return [t, 'Kelas ' + t]; }))));
      $('#p-t', el).onchange = function () { tf = this.value; ap(); };
      $('#p-st', el).onchange = function () { sf = this.value; ap(); };
      $('#p-q', el).oninput = U.debounce(function () { tv.setQuery(this.value); }, 150);
      tv = new TableView({ el: $('#p-tv', el), rowId: 'ID_Paket', size: 10, searchKeys: ['ID_Paket', 'Nama', 'Mapel', 'GuruNama'], emptyIcon: 'folder_copy', emptyText: 'Belum ada paket soal.',
        columns: [
          { key: 'ID_Paket', label: 'Kode & Mata Pelajaran', render: function (r) { return raw('<div class="font-tabular-code font-semibold text-primary">' + esc(r.ID_Paket) + '</div><div class="font-medium">' + esc(r.Mapel) + '</div><div class="font-body-sm text-on-surface-variant">' + esc(r.Nama) + '</div>'); } },
          { key: 'GuruNama', label: 'Guru Penyusun', render: function (r) { return raw(r.GuruNama ? '<div>' + esc(r.GuruNama) + '</div><div class="font-body-sm text-on-surface-variant">NIP ' + esc(r.GuruNIP) + '</div>' : '<span class="text-on-surface-variant">—</span>'); } },
          { key: 'Tingkat', label: 'Sasaran', render: function (r) { return 'Kelas ' + (r.Tingkat || '—'); } },
          { key: 'stat', label: 'Komposisi Soal', sort: false, render: function (r) { var s = r.stat; return raw('<div class="font-medium">' + s.total + ' Butir</div><div class="font-body-sm text-on-surface-variant">' + [s.PG + ' PG', s.PGK ? s.PGK + ' PGK' : '', s.BS ? s.BS + ' B/S' : '', s.URAIAN + ' Uraian'].filter(Boolean).join(' • ') + '</div>'); } },
          { key: null, label: 'Total Bobot', sort: false, td: 'font-tabular-code', render: function (r) { return Math.round(r.stat.bobot * 100) / 100 + ' Poin'; } },
          { key: 'Status', label: 'Status Paket', render: function (r) { return U.badge(r.Status, STP[r.Status] || 'mute', true); } },
          { key: null, label: 'Kunci & Bobot', sort: false, render: function (r) { var s = r.stat, ok = s.total > 0 && s.lengkap === s.total; return raw('<span class="inline-flex items-center gap-1 ' + (ok ? 'text-status-success-text' : 'text-status-warning-text') + ' font-label-md">' + U.str(U.ic(ok ? 'check_circle' : 'error', 'text-[18px]')) + (s.total ? (ok ? 'Lengkap (' : 'Kurang ' + (s.total - s.lengkap) + ' kunci (') + s.lengkap + '/' + s.total + ')' : 'Belum ada butir') + '</span>'); } },
          { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function () { return raw(U.str(C.iconBtn('butir', 'visibility', 'Lihat butir soal')) + U.str(C.iconBtn('edit', 'edit', 'Ubah paket')) + U.str(C.iconBtn('del', 'delete', 'Hapus paket', 'danger'))); } }],
        onAction: function (a, r) {
          if (a === 'butir') App.go('admin/butir?paket=' + encodeURIComponent(r.ID_Paket));
          else if (a === 'edit') form(r);
          else if (a === 'del') U.confirm({ title: 'Hapus paket ' + r.ID_Paket + '?', message: 'Paket beserta ' + r.stat.total + ' butir soalnya akan dihapus permanen. Paket yang dipakai jadwal tidak dapat dihapus.', ok: 'Hapus Paket', danger: true }).then(function (y) { if (y) C.act(null, 'model.delete', { ID_Paket: r.ID_Paket }, { inv: ['model.', 'soal.', 'dash.'], done: reload }); });
        } });
      function form(r) {
        r = r || {}; var edit = !!r.ID_Paket, gr = (Api.peek('guru.list', {}) || {}).guru || [], tl = C.tingkatList();
        U.modal({ title: edit ? 'Ubah Paket Soal' : 'Buat Paket Soal Baru', width: 'max-w-2xl',
          body: h`<form class="grid grid-cols-1 sm:grid-cols-2 gap-4" autocomplete="off">
            ${U.field({ name: 'ID_Paket', label: 'Kode Paket', required: true, value: r.ID_Paket, mono: true, placeholder: 'MTK-X-01', attrs: edit ? 'readonly' : '', hint: edit ? 'Kode tidak dapat diubah.' : 'Huruf/angka/tanda hubung.' })}
            ${U.field({ name: 'Mapel', label: 'Mata Pelajaran', required: true, value: r.Mapel, hint: 'Harus sama dengan mapel pada akun guru pengampu.' })}
            ${U.field({ name: 'Nama', label: 'Nama Paket', value: r.Nama, cls: 'sm:col-span-2', placeholder: 'Asesmen Sumatif Akhir Semester' })}
            ${U.field({ name: 'Tingkat', label: 'Tingkat', type: 'select', value: r.Tingkat || tl[0], options: tl })}
            ${U.field({ name: 'JenisSoal', label: 'Format', type: 'select', value: r.JenisSoal || 'PG', options: [{ value: 'PG', label: 'Pilihan Ganda (PG)' }, { value: 'AKM', label: 'AKM Terpadu' }, { value: 'CAMPURAN', label: 'Campuran (PG + Esai)' }] })}
            ${U.field({ name: 'GuruID', label: 'Guru Penyusun', type: 'select', value: r.GuruID, options: [{ value: '', label: '— Pilih guru —' }].concat(gr.map(function (g) { return { value: g.ID, label: g.Nama + ' (' + g.Mapel + ')' }; })) })}
            ${U.field({ name: 'Status', label: 'Status Paket', type: 'select', value: r.Status || 'Draft Guru', options: ['Siap Ujian', 'Draft Guru', 'Menunggu Verifikasi', 'Perlu Revisi'] })}
            ${U.field({ name: 'JumlahSoal', label: 'Target Jumlah Butir', type: 'number', value: r.JumlahSoal || '', attrs: 'min="0"' })}
            ${U.field({ name: 'BobotDefault', label: 'Bobot Default / Butir', type: 'number', value: r.BobotDefault || 2, attrs: 'min="0.5" step="0.5"' })}
            ${U.field({ name: 'KKM', label: 'KKM', type: 'number', value: r.KKM || 75, attrs: 'min="0" max="100"' })}
            ${U.field({ name: 'DurasiMenit', label: 'Durasi (menit)', type: 'number', value: r.DurasiMenit || 90, attrs: 'min="5" max="360"' })}
            ${U.field({ name: 'Rombel', label: 'Rombel Sasaran', value: r.Rombel, cls: 'sm:col-span-2', placeholder: 'ID kelas dipisah koma (opsional)' })}</form>`,
          buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Simpan Paket', primary: true, onClick: function (x, b) {
            var d = U.formData(x.body); if (edit) d.ID_Paket = r.ID_Paket;
            ['JumlahSoal', 'BobotDefault', 'KKM', 'DurasiMenit'].forEach(function (k) { d[k] = +d[k] || 0; });
            C.act(b, 'model.save', d, { inv: ['model.', 'dash.'], done: function (res) { x.close(); reload(); } }); } }] });
      }
      $('#p-add', el).onclick = function () { form(); };
      function reload() { el._reload(); }
      el._tv = tv;
    },
    show: function (el) {
      var set = function (r) {
        el._tv.setRows(r.paket); var p = r.paket, tot = 0, siap = 0, bob = 0, jn = { PG: [0, 0], PGK: [0, 0], BS: [0, 0], URAIAN: [0, 0] }, mp = {}, lengkap = 0;
        p.forEach(function (x) { tot += x.stat.total; siap += x.Status === 'Siap Ujian' ? 1 : 0; mp[x.Mapel] = 1; if (x.stat.total && x.stat.lengkap === x.stat.total) lengkap++; ['PG', 'PGK', 'BS', 'URAIAN'].forEach(function (k) { jn[k][0] += x.stat[k] || 0; }); });
        U.mount($('#p-stat', el), h`${C.stat({ label: 'Total Paket Soal', value: p.length, icon: 'folder_copy', foot: Object.keys(mp).length + ' mata pelajaran', footKind: 'ok' })}${C.stat({ label: 'Total Butir Soal', value: U.num(tot), icon: 'ballot', foot: jn.PG[0] + ' PG • ' + (jn.PGK[0] + jn.BS[0]) + ' PGK/BS • ' + jn.URAIAN[0] + ' Uraian', footKind: 'info' })}${C.stat({ label: 'Status Verifikasi', value: siap, icon: 'verified', foot: 'Siap Ujian dari ' + p.length, footKind: siap === p.length && p.length ? 'ok' : 'warn' })}${C.stat({ label: 'Kunci Lengkap', value: lengkap, icon: 'key', foot: 'Paket berkunci lengkap', footKind: lengkap === p.length && p.length ? 'ok' : 'warn' })}`);
        var tipe = [['PG', 'Pilihan Ganda Tunggal'], ['PGK', 'PG Kompleks'], ['BS', 'Benar / Salah'], ['URAIAN', 'Uraian / Esai']];
        U.mount($('#p-komp', el), h`${tipe.map(function (t) { return h`<div class="p-3 rounded-lg bg-surface-container-low"><div class="font-label-md text-on-surface-variant">${t[1]}</div><div class="font-headline-md text-headline-md">${jn[t[0]][0]}<span class="font-body-sm text-on-surface-variant"> butir</span></div></div>`; })}`);
      };
      el._reload = function () { Api.swr('model.list', {}, set, { force: true, ttl: 0 }); };
      Api.swr('model.list', {}, function (r) { if (r.success) set(r); else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } });
      Api.swr('guru.list', {}, function () { });
    }
  });
})();
