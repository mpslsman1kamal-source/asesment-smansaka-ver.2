/* admin-kelas.js — Data Kelas & Rombel (w_04_data_kelas_rombel) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, $ = U.$;
  App.register('admin/kelas', {
    role: 'admin', layout: 'staf', title: 'Data Kelas & Rombel',
    prefetch: function () { return [{ action: 'kelas.list', data: {} }]; },
    init: function (el) {
      el._tk = '';
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a, id = b.dataset.id, k = (el._rows || []).filter(function (x) { return x.ID_Kelas === id; })[0];
        if (a === 'tk') { el._tk = b.dataset.v; draw(el); }
        else if (a === 'add') form(el); else if (a === 'edit') form(el, k); else if (a === 'sesi') form(el, k);
        else if (a === 'alokasi') App.go('admin/siswa');
        else if (a === 'lihat') App.go('admin/siswa');
        else if (a === 'del') U.confirm({ title: 'Hapus kelas?', message: 'Kelas ' + k.Nama + ' akan dihapus. Kelas yang masih berisi siswa tidak dapat dihapus.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'kelas.delete', { ID_Kelas: id }, { inv: ['kelas.', 'dash.'], done: function () { el._reload(); } }); });
        else if (a === 'retry') el._reload();
      });
    },
    show: function (el) {
      el._reload = function () { Api.swr('kelas.list', {}, function (r) { el._rows = r.kelas; draw(el); }, { force: true, ttl: 0 }); };
      Api.swr('kelas.list', {}, function (r) { if (r.success) { el._rows = r.kelas; draw(el); } else U.mount(el, C.errorBox(r.message, true)); });
    }
  });

  function form(el, k) {
    k = k || {}; var edit = !!k.ID_Kelas, tl = C.tingkatList();
    U.modal({ title: edit ? 'Ubah Kelas / Rombel' : 'Tambah Kelas / Rombel', width: 'max-w-xl',
      body: h`<form class="grid grid-cols-1 sm:grid-cols-2 gap-4" autocomplete="off">
        ${U.field({ name: 'Nama', label: 'Nama Rombel', required: true, value: k.Nama, placeholder: 'Contoh: X-1', hint: 'Format Tingkat-Nama, mis. XI-IPA-2.' })}
        ${U.field({ name: 'Tingkat', label: 'Tingkat', type: 'select', value: k.Tingkat || tl[0], options: tl })}
        ${U.field({ name: 'WaliKelas', label: 'Wali Kelas', value: k.WaliKelas, cls: 'sm:col-span-2' })}
        ${U.field({ name: 'Kapasitas', label: 'Kapasitas Kursi', type: 'number', value: k.Kapasitas || 36, attrs: 'min="1" max="200"' })}
        ${U.field({ name: 'Sesi', label: 'Sesi Asesmen', value: k.Sesi, placeholder: 'Contoh: Sesi 1 Pagi' })}
        ${U.field({ name: 'Lab', label: 'Ruang / Lab CBT', value: k.Lab, placeholder: 'Contoh: Lab Komputer 01', cls: 'sm:col-span-2' })}</form>`,
      buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Simpan', primary: true, onClick: function (x, b) {
        var d = U.formData(x.body); d.Kapasitas = +d.Kapasitas || 36; if (edit) d.ID_Kelas = k.ID_Kelas;
        C.act(b, 'kelas.save', d, { inv: ['kelas.', 'dash.'], done: function () { x.close(); el._reload(); } }); } }] });
  }

  function draw(el) {
    var rows = el._rows || [], tl = C.tingkatList(), tk = el._tk, vis = rows.filter(function (r) { return !tk || r.Tingkat === tk; });
    var tot = rows.length, sis = rows.reduce(function (a, r) { return a + (r.terisi || 0); }, 0), rata = tot ? Math.round(sis / tot) : 0, labs = {}; rows.forEach(function (r) { if (r.Lab) labs[r.Lab] = 1; });
    var per = tl.map(function (t) { return t + ': ' + rows.filter(function (r) { return r.Tingkat === t; }).length; }).join(' · ');
    U.mount(el, h`${C.head('Data Kelas & Rombongan Belajar', 'Kapasitas kursi, wali kelas, dan pembagian ruang/sesi asesmen.', raw(U.str(C.btn('ghost', 'group_add', 'Alokasi Massal Siswa', 'data-a="alokasi"')) + U.str(C.btn('primary', 'add_circle', 'Tambah Kelas / Rombel', 'data-a="add"'))))}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
        ${C.stat({ label: 'Total Rombel', value: tot, icon: 'meeting_room', foot: per || '—', footKind: 'info' })}
        ${C.stat({ label: 'Siswa Terdistribusi', value: U.num(sis), icon: 'groups', foot: 'Terpetakan ke rombel', footKind: 'ok' })}
        ${C.stat({ label: 'Rata-rata Anggota', value: rata, icon: 'diversity_3', foot: 'Siswa / rombel', footKind: 'mute' })}
        ${C.stat({ label: 'Ruang CBT', value: Object.keys(labs).length, icon: 'devices', foot: Object.keys(labs).length ? 'Terdaftar' : 'Belum diatur', footKind: Object.keys(labs).length ? 'ok' : 'warn' })}</div>
      <div class="flex flex-wrap gap-2 mb-space-md">${[['', 'Semua Tingkat (' + tot + ')']].concat(tl.map(function (t) { return [t, 'Kelas ' + t + ' (' + rows.filter(function (r) { return r.Tingkat === t; }).length + ')']; })).map(function (t) { return h`<button type="button" data-a="tk" data-v="${t[0]}" class="px-3.5 py-1.5 rounded-full font-label-md ${tk === t[0] ? 'bg-primary-container text-on-primary' : 'bg-surface-card text-on-surface-variant hover:bg-surface-container'}">${t[1]}</button>`; })}</div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">${vis.length ? vis.map(function (k) {
        var p = k.Kapasitas ? Math.round(k.terisi / k.Kapasitas * 100) : 0, full = k.terisi >= k.Kapasitas;
        return h`<article class="bg-surface-card rounded-xl shadow-sm p-space-md flex flex-col gap-3 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between"><div><h3 class="font-headline-sm text-headline-sm">${k.Nama}</h3><p class="font-body-sm text-on-surface-variant">Tingkat ${k.Tingkat}</p></div><div class="flex gap-1">${C.iconBtn('', 'edit', 'Ubah', '', 'data-a="edit" data-id="' + U.esc(k.ID_Kelas) + '"')}${C.iconBtn('', 'delete', 'Hapus', 'danger', 'data-a="del" data-id="' + U.esc(k.ID_Kelas) + '"')}</div></div>
          <dl class="grid grid-cols-2 gap-2 font-body-sm"><div><dt class="text-on-surface-variant">Wali Kelas</dt><dd class="font-medium">${k.WaliKelas || '—'}</dd></div><div><dt class="text-on-surface-variant">Ruang / Lab CBT</dt><dd class="font-medium">${k.Lab || '—'}${k.Sesi ? ' (' + k.Sesi + ')' : ''}</dd></div></dl>
          <div><div class="flex justify-between font-label-md mb-1"><span>Kapasitas Kursi</span><span class="font-tabular-code">${k.terisi} / ${k.Kapasitas} (${full ? 'Penuh' : p + '%'})</span></div><div class="h-2 rounded-full bg-surface-container overflow-hidden"><div class="h-full ${p > 100 ? 'bg-error' : full ? 'bg-status-warning-text' : 'bg-primary-container'}" style="width:${Math.min(100, p)}%"></div></div></div>
          <div class="flex gap-2 pt-1"><button type="button" data-a="lihat" class="${U.BTN.soft} flex-1">Lihat Siswa (${k.terisi})</button><button type="button" data-a="sesi" data-id="${k.ID_Kelas}" class="${U.BTN.ghost} flex-1">${U.ic('tune', 'text-[18px]')}Atur Sesi</button></div></article>`; })
        : raw('<div class="col-span-full py-16 text-center text-on-surface-variant">Belum ada kelas. Klik “Tambah Kelas / Rombel”.</div>')}</div>`);
  }
})();
