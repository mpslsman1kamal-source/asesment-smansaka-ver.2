/* admin-guru.js — Data Guru & Pengampu (w_05_data_guru) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, $ = U.$;
  var KIND = { Aktif: 'ok', Terkunci: 'err', 'Belum Aktivasi': 'warn' };
  function mapelList(g) { return String(g.Mapel || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  App.register('admin/guru', {
    role: 'admin', layout: 'staf', title: 'Data Guru',
    prefetch: function () { return [{ action: 'guru.list', data: {} }, { action: 'kelas.list', data: {} }]; },
    init: function (el) {
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Data Guru & Pengampu Mata Pelajaran', 'Kelola NIP, mata pelajaran yang diampu, dan akun masuk guru.', raw(U.str(C.btn('ghost', 'download', 'Export Excel (.xlsx)', 'id="g-exp"')) + U.str(C.btn('ghost', 'upload_file', 'Impor Excel', 'id="g-imp"')) + U.str(C.btn('primary', 'person_add', 'Tambah Guru Baru', 'id="g-add"'))))}
        <div id="g-stat" class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg"></div>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg">
          <div class="flex flex-wrap items-center gap-2 mb-space-md">${C.search('g-q', 'Cari nama, NIP, atau mapel…')}<span data-fm></span>${C.select('g-st', [['', 'Status Akun: Semua'], ['Aktif', 'Aktif'], ['Belum Aktivasi', 'Belum Aktivasi'], ['Terkunci', 'Terkunci']])}</div>
          <div id="g-bar" hidden class="flex flex-wrap items-center gap-2 mb-space-md p-2.5 rounded-lg bg-primary-fixed/40"><span class="font-label-md px-2">Aksi Massal (<b id="g-n" class="font-tabular-code">0</b>)</span><button data-b="kred" class="${U.BTN.soft}">${U.ic('key', 'text-[18px]')}Lihat Kredensial</button><button data-b="reset" class="${U.BTN.soft}">${U.ic('lock_reset', 'text-[18px]')}Reset Sandi</button><button data-b="hapus" class="${U.BTN.soft} !text-status-error-text">${U.ic('delete', 'text-[18px]')}Hapus</button></div>
          <div id="g-tv"></div></section>`);
      var mf = '', sf = '', tv;
      function ap() { tv.setFilter(function (r) { return (!mf || mapelList(r).indexOf(mf) >= 0) && (!sf || r.status === sf); }); }
      function mapelOpts() { var s = {}; (el._rows || []).forEach(function (g) { mapelList(g).forEach(function (m) { s[m] = 1; }); }); return [['', 'Semua Mata Pelajaran']].concat(Object.keys(s).sort().map(function (m) { return [m, m]; })); }
      el._mapel = function () { $('[data-fm]', el).innerHTML = U.str(C.select('g-m', mapelOpts())); $('#g-m', el).value = mf; $('#g-m', el).onchange = function () { mf = this.value; ap(); }; };
      tv = new TableView({ el: $('#g-tv', el), rowId: 'ID', selectable: true, size: 10, searchKeys: ['Nama', 'NIP', 'Mapel', 'Email'], emptyText: 'Belum ada data guru.', emptyIcon: 'badge',
        columns: [
          { key: 'No', label: 'No', td: 'font-tabular-code text-on-surface-variant' },
          { key: 'NIP', label: 'NIP / Identitas', td: 'font-tabular-code' },
          { key: 'Nama', label: 'Nama Guru & Gelar', render: function (g) { return raw('<div class="font-medium">' + U.esc(g.Nama) + '</div><div class="font-body-sm text-on-surface-variant">' + U.esc(g.Email || g.WA || '') + '</div>'); } },
          { key: 'Mapel', label: 'Mata Pelajaran', render: function (g) { return raw(mapelList(g).map(function (m) { return '<span class="inline-block mr-1 mb-1 px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm">' + U.esc(m) + '</span>'; }).join('')); } },
          { key: 'Rombel', label: 'Kelas yang Diampu', render: function (g) { var km = C.kelasMap(); var t = String(g.Rombel || '').split(',').map(function (s) { s = s.trim(); return (km[s] || {}).Nama || s; }).filter(Boolean).join(', '); return t || '—'; } },
          { key: 'status', label: 'Status Akun', render: function (g) { return U.badge(g.status, KIND[g.status] || 'mute', true); } },
          { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function () { return raw(U.str(C.iconBtn('reset', 'key', 'Reset sandi')) + U.str(C.iconBtn('edit', 'edit', 'Ubah')) + U.str(C.iconBtn('del', 'delete', 'Hapus', 'danger'))); } }],
        onSelect: function (ids) { $('#g-bar', el).hidden = !ids.length; $('#g-n', el).textContent = ids.length; },
        onAction: function (a, g) {
          if (a === 'edit') form(g); else if (a === 'reset') reset([g.ID]);
          else if (a === 'del') U.confirm({ title: 'Hapus guru?', message: g.Nama + ' dan akunnya akan dihapus.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'guru.delete', { ids: [g.ID] }, { inv: ['guru.', 'dash.'], done: reload }); });
        } });
      function reset(ids) { U.confirm({ title: 'Atur ulang sandi?', message: ids.length + ' sandi guru akan diganti dengan sandi acak baru.', ok: 'Atur Ulang' }).then(function (y) { if (y) C.act(null, 'guru.resetSandi', { ids: ids }, { done: function (r) { C.kredensialModal(r.kredensial, 'Sandi Baru Guru'); reload(); } }); }); }
      $('#g-q', el).oninput = U.debounce(function () { tv.setQuery(this.value); }, 150);
      $('#g-st', el).onchange = function () { sf = this.value; ap(); };
      $('#g-bar', el).onclick = function (e) {
        var b = e.target.closest('[data-b]'); if (!b) return; var ids = tv.selected();
        if (b.dataset.b === 'kred') Api.call('guru.kredensial', { ids: ids }).then(function (r) { r.success ? C.kredensialModal(r.kredensial, 'Kredensial Guru') : U.toast(r.message, 'err'); });
        else if (b.dataset.b === 'reset') reset(ids);
        else U.confirm({ title: 'Hapus ' + ids.length + ' guru?', message: 'Akun guru terpilih dihapus permanen.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'guru.delete', { ids: ids }, { inv: ['guru.', 'dash.'], done: function () { tv.clearSel(); reload(); } }); });
      };
      function form(g) {
        g = g || {}; var edit = !!g.ID, kl = C.kelasOpts(), sel = String(g.Rombel || '').split(',').map(function (s) { return s.trim(); });
        U.modal({ title: edit ? 'Ubah Data Guru' : 'Tambah Guru Baru', subtitle: edit ? '' : 'Username akun = NIP. Sandi awal dibuat otomatis.', width: 'max-w-2xl',
          body: h`<form class="grid grid-cols-1 sm:grid-cols-2 gap-4" autocomplete="off">
            ${U.field({ name: 'NIP', label: 'NIP / Identitas', required: true, value: g.NIP, mono: true, attrs: 'inputmode="numeric"', hint: '8–20 digit angka.' })}
            ${U.field({ name: 'Nama', label: 'Nama Lengkap & Gelar', required: true, value: g.Nama })}
            ${U.field({ name: 'Mapel', label: 'Mata Pelajaran yang Diampu', required: true, value: g.Mapel, cls: 'sm:col-span-2', hint: 'Pisahkan dengan koma bila lebih dari satu. Menentukan hak akses bank soal & rekap.' })}
            <div class="sm:col-span-2"><span class="block font-label-md mb-1">Kelas yang Diampu</span><div class="flex flex-wrap gap-2">${kl.map(function (k) { return h`<label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low font-label-md cursor-pointer"><input type="checkbox" data-k value="${k[0]}" ${sel.indexOf(k[0]) >= 0 ? raw('checked') : ''} class="rounded border-border-strong text-primary-container">${k[1]}</label>`; })}</div></div>
            ${U.field({ name: 'WA', label: 'Nomor WhatsApp', value: g.WA, attrs: 'inputmode="tel"' })}
            ${U.field({ name: 'Email', label: 'Email', type: 'email', value: g.Email })}
            ${edit ? U.field({ name: 'sandi', label: 'Sandi baru (opsional)', hint: 'Kosongkan bila tidak diubah.', cls: 'sm:col-span-2' }) : ''}</form>`,
          buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: edit ? 'Simpan Perubahan' : 'Simpan Guru', primary: true, onClick: function (x, b) {
            var d = U.formData(x.body); d.Rombel = U.$$('[data-k]:checked', x.body).map(function (c) { return c.value; }).join(','); delete d.on; if (edit) d.ID = g.ID; if (!d.sandi) delete d.sandi;
            C.act(b, 'guru.save', d, { inv: ['guru.', 'dash.'], done: function (res) { x.close(); reload(); if (res.kredensial && res.kredensial.sandi) C.kredensialModal(res.kredensial, edit ? 'Sandi Diubah' : 'Akun Guru Baru'); } }); } }] });
      }
      $('#g-add', el).onclick = function () { form(); };
      $('#g-exp', el).onclick = function () { U.downloadText('data-guru.csv', 'text/csv', U.csv([['No', 'NIP', 'Nama', 'Mapel', 'Rombel', 'WA', 'Email', 'Status']].concat(tv.filtered().map(function (g) { return [g.No, "'" + g.NIP, g.Nama, g.Mapel, g.Rombel, g.WA, g.Email, g.status]; })))); };
      $('#g-imp', el).onclick = function () {
        C.importFlow({ judul: 'Impor Data Guru', kunci: 'NIP', action: 'guru.import', inv: ['guru.', 'dash.'], namaTemplate: 'template-guru.xlsx', header: ['NIP', 'Nama', 'Mapel', 'Rombel', 'WA', 'Email'], contoh: [['197408121999031004', 'Contoh Guru, S.Pd', 'Matematika', 'X-1,X-2', '6281234567890', 'guru@sekolah.sch.id']],
          map: function (r) { return { NIP: C.pick(r, ['NIP']), Nama: C.pick(r, ['Nama', 'Nama Guru']), Mapel: C.pick(r, ['Mapel', 'Mata Pelajaran']), Rombel: C.pick(r, ['Rombel', 'Kelas']), WA: C.pick(r, ['WA', 'WhatsApp']), Email: C.pick(r, ['Email']) }; }, done: reload });
      };
      function reload() { el._reload(); }
      el._tv = tv;
    },
    show: function (el) {
      var set = function (r) { el._rows = r.guru; el._tv.setRows(r.guru); el._mapel();
        var g = r.guru, aktif = g.filter(function (x) { return x.status === 'Aktif'; }).length, mp = {}; g.forEach(function (x) { mapelList(x).forEach(function (m) { mp[m] = 1; }); });
        var pk = Api.peek('model.list', {}); U.mount($('#g-stat', el), h`${C.stat({ label: 'Total Guru', value: g.length, icon: 'groups', foot: 'Terdaftar', footKind: 'info' })}${C.stat({ label: 'Akun Aktif', value: aktif, icon: 'manage_accounts', foot: (g.length - aktif) + ' belum aktif/terkunci', footKind: g.length - aktif ? 'warn' : 'ok' })}${C.stat({ label: 'Mapel Tercover', value: Object.keys(mp).length, icon: 'menu_book', foot: 'Mata pelajaran', footKind: 'ok' })}${C.stat({ label: 'Paket Soal Dibuat', value: pk && pk.paket ? pk.paket.length : '—', icon: 'quiz', foot: 'Bank soal', footKind: 'info' })}`); };
      el._reload = function () { Api.swr('guru.list', {}, set, { force: true, ttl: 0 }); };
      Api.swr('guru.list', {}, function (r) { if (r.success) set(r); else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } });
      Api.swr('kelas.list', {}, function () { el._tv.refresh(); });
    }
  });
})();
