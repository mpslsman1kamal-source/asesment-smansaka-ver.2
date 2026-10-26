/* admin-siswa.js — Kelola Data Siswa & Akun (kelola_data_siswa_akun) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, $ = U.$;
  var CATEGORY = { Aktif: 'ok', Terkunci: 'err', 'Belum Generate': 'warn' };

  // impor Excel berpotongan (maks 50 baris/permintaan), dengan pratinjau
  C.importFlow = function (o) { // {judul, action, header, contoh, namaTemplate, map(row)->obj, inv, done}
    var input = document.createElement('input'); input.type = 'file'; input.accept = '.xlsx,.xls,.csv';
    var m = U.modal({ title: o.judul, subtitle: 'Berkas Excel (.xlsx) atau CSV. Baris dengan ' + o.kunci + ' yang sudah ada akan diperbarui.', width: 'max-w-2xl', sticky: true,
      body: h`<div class="flex flex-col gap-3"><div class="p-3 rounded-lg bg-surface-container-low font-body-sm text-on-surface-variant">Kolom yang dibaca: <b class="font-tabular-code">${o.header.join(', ')}</b></div>
        <div class="flex flex-wrap gap-2"><button type="button" data-tpl class="${U.BTN.soft}">${U.ic('download', 'text-[18px]')}Unduh Template</button><button type="button" data-pick class="${U.BTN.primary}">${U.ic('upload_file', 'text-[18px]')}Pilih Berkas</button></div><div data-out class="font-body-md text-on-surface-variant"></div></div>`,
      buttons: [{ label: 'Tutup', onClick: function (x) { x.close(); } }, { label: 'Simpan ke Database', primary: true, id: 'imp-go', onClick: simpan }] });
    var go = $('#imp-go', m.el); go.disabled = true; var rows = [], out = $('[data-out]', m.el);
    $('[data-tpl]', m.el).onclick = function () { C.template(o.namaTemplate, o.header, o.contoh).catch(function (e) { U.toast(e.message, 'err'); }); };
    $('[data-pick]', m.el).onclick = function () { input.click(); };
    input.onchange = function () {
      if (!input.files[0]) return; out.textContent = 'Membaca berkas…';
      C.readSheet(input.files[0]).then(function (rs) {
        rows = rs.map(o.map).filter(function (r) { return Object.keys(r).some(function (k) { return r[k]; }); });
        if (!rows.length) { out.textContent = 'Tidak ada baris data yang terbaca.'; return; }
        out.textContent = 'Memeriksa ' + rows.length + ' baris…';
        kirim(true).then(function (t) { tampil(t, true); go.disabled = !(t.dibuat + t.diperbarui); });
      }).catch(function (e) { out.textContent = e.message; });
    };
    function kirim(dry) {
      var tot = { dibuat: 0, diperbarui: 0, gagal: 0, errors: [], kredensial: [] }, i = 0;
      return new Promise(function (res) {
        (function next() {
          if (i >= rows.length) return res(tot);
          var CH = o.chunk || 50, part = rows.slice(i, i + CH), off = i; i += CH;
          Api.call(o.action, Object.assign({}, o.extra || {}, { rows: part, dryRun: dry })).then(function (r) {
            if (!r.success) { tot.gagal += part.length; tot.errors.push({ baris: off + 1, nama: '', pesan: r.message }); }
            else { tot.dibuat += r.dibuat; tot.diperbarui += r.diperbarui; tot.gagal += r.gagal; (r.errors || []).forEach(function (e) { e.baris += off; tot.errors.push(e); }); tot.kredensial = tot.kredensial.concat(r.kredensial || []); }
            if (!dry) out.textContent = 'Menyimpan… ' + Math.min(i, rows.length) + '/' + rows.length; next();
          });
        })();
      });
    }
    function tampil(t, dry) {
      U.mount(out, h`<div class="grid grid-cols-3 gap-2 mb-2">${[['Akun baru', t.dibuat, 'ok'], ['Diperbarui', t.diperbarui, 'info'], ['Ditolak', t.gagal, t.gagal ? 'err' : 'mute']].map(function (x) { return h`<div class="p-3 rounded-lg bg-surface-container-low text-center"><div class="font-headline-md text-headline-md">${x[1]}</div>${U.badge(x[0], x[2])}</div>`; })}</div>
        ${dry ? raw('<p class="font-body-sm">Ini pratinjau — belum ada data yang disimpan.</p>') : ''}
        ${t.errors.length ? h`<div class="max-h-40 overflow-y-auto rounded-lg border border-border-standard"><table class="w-full text-body-sm"><tbody>${t.errors.slice(0, 100).map(function (e) { return h`<tr class="border-b border-border-standard/50"><td class="py-1.5 px-3 font-tabular-code">Baris ${e.baris}</td><td class="px-3">${e.nama}</td><td class="px-3 text-status-error-text">${e.pesan}</td></tr>`; })}</tbody></table></div>` : ''}`);
    }
    function simpan() {
      U.busy(go, true); kirim(false).then(function (t) {
        U.busy(go, false); go.disabled = true; tampil(t, false); Api.invalidate(o.inv); U.toast(t.dibuat + ' akun dibuat, ' + t.diperbarui + ' diperbarui.', 'ok');
        if (t.kredensial.length) { m.close(); C.kredensialModal(t.kredensial, 'Kredensial Akun Baru'); }
        o.done && o.done();
      });
    }
  };

  App.register('admin/siswa', {
    role: 'admin', layout: 'staf', title: 'Data Siswa',
    prefetch: function () { return [{ action: 'siswa.list', data: {} }, { action: 'kelas.list', data: {} }]; },
    init: function (el) {
      var kelasOpt = function () { return C.kelasOpts('Semua Kelas'); };
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Kelola Data Siswa & Akun', 'Data peserta asesmen beserta akun masuknya.', raw(
          U.str(C.btn('ghost', 'download', 'Ekspor', 'id="b-exp"')) + U.str(C.btn('ghost', 'upload_file', 'Impor Excel', 'id="b-imp"')) + U.str(C.btn('primary', 'person_add', 'Tambah Siswa', 'id="b-add"'))))}
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg">
          <div class="flex flex-wrap items-center gap-2 mb-space-md">${C.search('f-q', 'Cari nama, NISN, atau username…')}<span data-fk></span>${C.select('f-st', [['', 'Semua Status'], ['Aktif', 'Aktif'], ['Terkunci', 'Terkunci'], ['Belum Generate', 'Belum Generate']])}<button type="button" id="f-rs" class="${U.BTN.ghost}">${U.ic('filter_alt_off', 'text-[18px]')}Reset</button></div>
          <div id="bar" hidden class="flex flex-wrap items-center gap-2 mb-space-md p-2.5 rounded-lg bg-primary-fixed/40"><span class="font-label-md px-2"><b id="bar-n" class="font-tabular-code">0</b> dipilih</span>
            <button data-b="kred" class="${U.BTN.soft}">${U.ic('key', 'text-[18px]')}Lihat Kredensial</button><button data-b="reset" class="${U.BTN.soft}">${U.ic('lock_reset', 'text-[18px]')}Reset Sandi</button><button data-b="pindah" class="${U.BTN.soft}">${U.ic('swap_horiz', 'text-[18px]')}Pindah Kelas</button><button data-b="kunci" class="${U.BTN.soft}">${U.ic('lock', 'text-[18px]')}Kunci</button><button data-b="buka" class="${U.BTN.soft}">${U.ic('lock_open', 'text-[18px]')}Aktifkan</button><button data-b="hapus" class="${U.BTN.soft} !text-status-error-text">${U.ic('delete', 'text-[18px]')}Hapus</button><button data-b="x" class="ml-auto ${U.BTN.ghost}">Batal pilih</button></div>
          <div id="tv"></div></section>`);
      var self = this, tv, kf = '', sf = '';
      function setKelasSel() { $('[data-fk]', el).innerHTML = U.str(C.select('f-k', kelasOpt())); $('#f-k', el).value = kf; $('#f-k', el).onchange = function () { kf = this.value; ap(); }; }
      function ap() { tv.setFilter(function (r) { return (!kf || r.ID_Kelas === kf) && (!sf || r.status === sf); }); }
      var km = {};
      tv = new TableView({ el: $('#tv', el), rowId: 'ID', selectable: true, size: 10, searchKeys: ['Nama', 'NISN', 'Username', 'NIS'], emptyText: 'Belum ada data siswa.', emptyIcon: 'groups',
        columns: [
          { key: 'No', label: 'No', td: 'font-tabular-code text-on-surface-variant' },
          { key: 'NISN', label: 'NISN', td: 'font-tabular-code' },
          { key: 'Nama', label: 'Nama Lengkap', td: 'font-medium' },
          { key: 'JK', label: 'L/P' },
          { key: 'ID_Kelas', label: 'Kelas', render: function (r) { return (km[r.ID_Kelas] || {}).Nama || r.ID_Kelas; } },
          { key: 'Username', label: 'Username Akun', td: 'font-tabular-code' },
          { key: 'status', label: 'Status Kredensial', render: function (r) { return U.badge(r.status, CATEGORY[r.status] || 'mute', true); } },
          { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function () { return raw(U.str(C.iconBtn('edit', 'edit', 'Ubah')) + U.str(C.iconBtn('reset', 'lock_reset', 'Reset sandi')) + U.str(C.iconBtn('lepas', 'phonelink_erase', 'Lepas kunci perangkat')) + U.str(C.iconBtn('del', 'delete', 'Hapus', 'danger'))); } }],
        onSelect: function (ids) { $('#bar', el).hidden = !ids.length; $('#bar-n', el).textContent = ids.length; },
        onAction: function (a, r, btn) {
          if (a === 'edit') form(r);
          else if (a === 'reset') hapusReset([r.ID]);
          else if (a === 'lepas') C.act(btn, 'siswa.resetLogin', { nisn: r.NISN }, { msg: 'Kunci perangkat ' + r.Nama + ' dilepas.' });
          else if (a === 'del') U.confirm({ title: 'Hapus siswa?', message: r.Nama + ' (' + r.NISN + ') akan dihapus beserta akunnya.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'siswa.delete', { ids: [r.ID] }, { inv: 'siswa.', msg: 'Siswa dihapus.', done: reload }); });
        } });
      function hapusReset(ids) { U.confirm({ title: 'Atur ulang sandi?', message: ids.length + ' sandi akan diganti dengan sandi baru acak. Sandi lama tidak berlaku lagi.', ok: 'Atur Ulang' }).then(function (y) { if (y) C.act(null, 'siswa.resetSandi', { ids: ids }, { inv: 'siswa.', done: function (r) { C.kredensialModal(r.kredensial, 'Sandi Baru'); reload(); } }); }); }
      $('#f-q', el).oninput = U.debounce(function () { tv.setQuery(this.value); }, 150);
      $('#f-st', el).onchange = function () { sf = this.value; ap(); };
      $('#f-rs', el).onclick = function () { kf = ''; sf = ''; $('#f-q', el).value = ''; $('#f-st', el).value = ''; setKelasSel(); tv.setQuery(''); ap(); };
      $('#bar', el).onclick = function (e) {
        var b = e.target.closest('[data-b]'); if (!b) return; var ids = tv.selected(), k = b.dataset.b;
        if (k === 'x') tv.clearSel();
        else if (k === 'kred') Api.call('siswa.kredensial', { ids: ids }).then(function (r) { r.success ? C.kredensialModal(r.kredensial) : U.toast(r.message, 'err'); });
        else if (k === 'reset') hapusReset(ids);
        else if (k === 'kunci' || k === 'buka') C.act(b, 'siswa.toggle', { ids: ids, aktif: k === 'buka' }, { inv: 'siswa.', done: function () { tv.clearSel(); reload(); } });
        else if (k === 'hapus') U.confirm({ title: 'Hapus ' + ids.length + ' siswa?', message: 'Data dan akun siswa terpilih akan dihapus permanen.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'siswa.delete', { ids: ids }, { inv: 'siswa.', done: function () { tv.clearSel(); reload(); } }); });
        else if (k === 'pindah') pindah(ids);
      };
      function pindah(ids) {
        var m = U.modal({ title: 'Pindah Kelas', width: 'max-w-sm', body: h`${U.field({ name: 'kelasId', label: 'Kelas tujuan', type: 'select', options: C.kelasOpts().map(function (o) { return { value: o[0], label: o[1] }; }) })}`,
          buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Pindahkan', primary: true, onClick: function (x, b) { C.act(b, 'kelas.pindah', { ids: ids, kelasId: $('[name=kelasId]', x.el).value }, { inv: ['siswa.', 'kelas.'], done: function () { x.close(); tv.clearSel(); reload(); } }); } }] });
      }
      function form(r) {
        r = r || {}; var edit = !!r.ID;
        var m = U.modal({ title: edit ? 'Ubah Data Siswa' : 'Tambah Siswa', subtitle: edit ? '' : 'Akun dan sandi awal dibuat otomatis.', width: 'max-w-2xl',
          body: h`<form class="grid grid-cols-1 sm:grid-cols-2 gap-4" autocomplete="off">
            ${U.field({ name: 'NISN', label: 'NISN', required: true, value: r.NISN, mono: true, attrs: 'inputmode="numeric" maxlength="10"', hint: '10 digit angka.' })}
            ${U.field({ name: 'NIS', label: 'NIS', value: r.NIS })}
            ${U.field({ name: 'Nama', label: 'Nama Lengkap', required: true, value: r.Nama, cls: 'sm:col-span-2' })}
            ${U.field({ name: 'JK', label: 'Jenis Kelamin', type: 'select', required: true, value: r.JK || 'L', options: [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }] })}
            ${U.field({ name: 'TglLahir', label: 'Tanggal Lahir', type: 'date', value: r.TglLahir })}
            ${U.field({ name: 'ID_Kelas', label: 'Kelas / Rombel', type: 'select', required: true, value: r.ID_Kelas, options: C.kelasOpts().map(function (o) { return { value: o[0], label: o[1] }; }) })}
            ${U.field({ name: 'Sesi', label: 'Sesi', value: r.Sesi, placeholder: 'Contoh: 1' })}
            ${U.field({ name: 'Meja', label: 'No. Meja / Komputer', value: r.Meja, placeholder: 'Contoh: A-07' })}
            ${U.field({ name: 'WA', label: 'Nomor WhatsApp', value: r.WA, attrs: 'inputmode="tel"', placeholder: '628…' })}
            ${edit ? U.field({ name: 'Username', label: 'Username', value: r.Username, mono: true }) : ''}
            ${edit ? U.field({ name: 'sandi', label: 'Sandi baru (opsional)', type: 'text', hint: 'Kosongkan bila tidak diubah.' }) : ''}</form>`,
          buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: edit ? 'Simpan Perubahan' : 'Simpan Siswa', primary: true, onClick: function (x, b) {
            var d = U.formData(x.body); if (edit) d.ID = r.ID; if (!d.sandi) delete d.sandi;
            C.act(b, 'siswa.save', d, { inv: ['siswa.', 'kelas.', 'dash.'], done: function (res) { x.close(); reload(); if (!edit && res.kredensial) C.kredensialModal(res.kredensial, 'Akun Siswa Baru'); else if (res.kredensial && res.kredensial.sandi) C.kredensialModal(res.kredensial, 'Sandi Diubah'); } });
          } }] });
      }
      $('#b-add', el).onclick = function () { form(); };
      $('#b-exp', el).onclick = function () { var rs = tv.filtered(); U.downloadText('data-siswa.csv', 'text/csv', U.csv([['No', 'NISN', 'NIS', 'Nama', 'JK', 'Kelas', 'Username', 'Status']].concat(rs.map(function (r) { return [r.No, "'" + r.NISN, r.NIS, r.Nama, r.JK, (km[r.ID_Kelas] || {}).Nama || r.ID_Kelas, r.Username, r.status]; })))); };
      $('#b-imp', el).onclick = function () {
        C.importFlow({ judul: 'Impor Data Siswa', kunci: 'NISN', action: 'siswa.import', inv: ['siswa.', 'kelas.', 'dash.'], namaTemplate: 'template-siswa.xlsx', header: ['NISN', 'NIS', 'Nama', 'JK', 'Kelas', 'TglLahir', 'Sesi', 'Meja', 'WA'], contoh: [['0068492041', '2401', 'Contoh Siswa', 'L', 'X-1', '2009-05-14', '1', 'A-01', '6281234567890']],
          map: function (r) { return { NISN: C.pick(r, ['NISN']), NIS: C.pick(r, ['NIS']), Nama: C.pick(r, ['Nama', 'Nama Lengkap']), JK: C.pick(r, ['JK', 'L/P', 'Jenis Kelamin']), Kelas: C.pick(r, ['Kelas', 'Rombel']), TglLahir: C.pick(r, ['TglLahir', 'Tanggal Lahir']), Sesi: C.pick(r, ['Sesi']), Meja: C.pick(r, ['Meja']), WA: C.pick(r, ['WA', 'WhatsApp', 'No HP']) }; }, done: reload });
      };
      function reload() { el._reload && el._reload(); }
      el._setup = function () { var r = Api.peek('kelas.list', {}); km = C.kelasMap(); setKelasSel(); };
      el._tv = tv; el._ap = ap;
    },
    show: function (el) {
      el._setup && el._setup();
      var kl = function () { Api.swr('kelas.list', {}, function () { el._setup(); el._tv.refresh(); }); };
      el._reload = function () { Api.swr('siswa.list', {}, function (r) { el._tv.setRows(r.siswa); }, { force: true, ttl: 0 }); kl(); };
      Api.swr('siswa.list', {}, function (r, meta) { if (r.success) el._tv.setRows(r.siswa); else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } });
      kl();
    }
  });
})();
