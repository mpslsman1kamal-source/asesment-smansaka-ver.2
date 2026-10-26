/* admin-template.js — Template Berkas & Cloud (template_berkas_cloud) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$;
  var TIPE = { gdoc: ['description', 'Google Doc'], xlsx: ['table_chart', 'Excel / Sheets'], docx: ['article', 'Word'], pdf: ['picture_as_pdf', 'PDF'], file: ['draft', 'Berkas'] };
  App.register('admin/template', {
    role: 'admin', layout: 'staf', title: 'Template Berkas',
    prefetch: function () { return [{ action: 'template.list', data: {} }]; },
    init: function (el) {
      el._kat = '';
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Template Berkas & Penyimpanan Cloud', 'Template dokumen resmi (kartu ujian, berita acara, format soal Excel) yang tersimpan di Google Drive sekolah.', raw(U.str(C.btn('ghost', 'folder_open', 'Buka Folder Root', 'id="tp-root"')) + U.str(C.btn('ghost', 'refresh', 'Segarkan dari Drive', 'id="tp-ref"'))))}
        <div id="tp-stat" class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg"></div>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg mb-space-lg"><h2 class="font-headline-sm mb-1 flex items-center gap-2">${U.ic('file_upload', 'text-primary')}Unggah Berkas Template ke Cloud</h2><p class="font-body-sm text-on-surface-variant mb-space-sm">Sistem meletakkan berkas di sub-folder Drive sesuai kategori. Format: .docx (otomatis diubah menjadi Google Docs bila tersedia), .xlsx, .pdf, .csv, gambar — maks. ±5 MB.</p>
          <div class="grid md:grid-cols-3 gap-4 items-end"><div class="md:col-span-2"><div id="tp-drop" tabindex="0" role="button" class="flex flex-col items-center justify-center gap-1 py-7 rounded-lg border-2 border-dashed border-border-standard text-on-surface-variant hover:bg-surface-container-low cursor-pointer">${U.ic('cloud_upload', 'text-[32px] text-primary')}<span class="font-label-md" id="tp-fn">Tarik & lepas berkas ke sini, atau klik untuk memilih</span></div></div><div class="flex flex-col gap-2">${U.field({ name: 'kat', id: 'tp-kat', label: 'Kategori Penggunaan', type: 'select', options: [] })}<button type="button" id="tp-up" class="${U.BTN.primary}" disabled>${U.ic('upload', 'text-[18px]')}Unggah Template</button></div></div></section>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><div id="tp-tabs" class="flex flex-wrap gap-2 mb-space-md"></div><div id="tp-tv"></div></section>
        <div class="mt-space-lg p-space-md rounded-xl bg-surface-card shadow-sm flex gap-3">${U.ic('info', 'text-primary text-[26px]')}<div><h3 class="font-label-md font-semibold">Placeholder Template Kartu (Google Docs)</h3><p class="font-body-sm text-on-surface-variant mt-0.5">Tulis penanda berikut di dokumen; sistem menggantinya per siswa: <span class="font-tabular-code">{{NAMA}} {{NISN}} {{KELAS}} {{SESI}} {{RUANG}} {{MEJA}} {{USERNAME}} {{PASSWORD}} {{SEKOLAH}} {{TAHUN_AJARAN}} {{KOTA}} {{TANGGAL}} {{KEPSEK}} {{NIP_KEPSEK}} {{JADWAL}}</span>. Hanya satu template per kategori yang aktif.</p></div></div>`);
      var file = null, inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.docx,.xlsx,.xls,.doc,.pdf,.csv,.png,.jpg,.jpeg';
      function pilih(f) { if (!f) return; if (f.size > 5 * 1024 * 1024) return U.toast('Ukuran berkas maksimal 5 MB.', 'err'); file = f; $('#tp-fn', el).textContent = f.name + ' (' + Math.round(f.size / 1024) + ' KB)'; $('#tp-up', el).disabled = false; }
      var drop = $('#tp-drop', el); drop.onclick = function () { inp.click(); }; drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') inp.click(); }; inp.onchange = function () { pilih(inp.files[0]); };
      drop.ondragover = function (e) { e.preventDefault(); }; drop.ondrop = function (e) { e.preventDefault(); pilih(e.dataTransfer.files[0]); };
      $('#tp-up', el).onclick = function () {
        if (!file) return; var b = this, fr = new FileReader(); U.busy(b, true, 'Mengunggah…');
        fr.onload = function () { C.act(b, 'template.upload', { nama: file.name, kategori: $('#tp-kat', el).value, mime: file.type, base64: String(fr.result).split(',')[1] }, { inv: 'template.', timeout: 120000, done: function () { file = null; $('#tp-fn', el).textContent = 'Tarik & lepas berkas ke sini, atau klik untuk memilih'; b.disabled = true; el._reload(); } }); };
        fr.readAsDataURL(file);
      };
      $('#tp-ref', el).onclick = function () { C.act(this, 'template.refresh', {}, { inv: 'template.', done: function () { el._reload(); } }); };
      $('#tp-root', el).onclick = function () { if (el._folder) window.open(el._folder, '_blank', 'noopener'); else U.toast('Folder template belum diatur. Jalankan setupAppEnvironment.', 'err'); };
      el.addEventListener('click', function (e) { var b = e.target.closest('[data-kat]'); if (b) { el._kat = b.dataset.kat; draw(el); } });
      el._tv = new TableView({ el: $('#tp-tv', el), rowId: 'ID', size: 8, searchKeys: ['Nama', 'Kategori'], emptyIcon: 'folder_off', emptyText: 'Belum ada template. Unggah berkas pertama di atas.',
        columns: [
          { key: 'Nama', label: 'Dokumen & Format', render: function (t) { var x = TIPE[t.tipe] || TIPE.file; return raw('<div class="flex items-center gap-2.5"><span class="w-9 h-9 rounded-lg bg-surface-container text-primary inline-flex items-center justify-center">' + U.str(U.ic(x[0], 'text-[20px]')) + '</span><div><div class="font-medium break-all">' + esc(t.Nama) + '</div><div class="font-body-sm text-on-surface-variant">' + esc(x[1]) + '</div></div></div>'); } },
          { key: 'Kategori', label: 'Kategori Penggunaan' },
          { key: 'Ukuran', label: 'Ukuran & Direktori', render: function (t) { return raw('<div class="font-tabular-code">' + (t.Ukuran || 0) + ' KB</div><div class="font-body-sm text-on-surface-variant">' + esc(t.Folder || '') + '</div>'); } },
          { key: 'Diubah', label: 'Terakhir Diperbarui', td: 'font-body-sm', render: function (t) { return raw(esc(String(t.Diubah || '').slice(0, 10)) + '<div class="text-on-surface-variant">oleh ' + esc(t.Oleh || '—') + '</div>'); } },
          { key: 'Aktif', label: 'Status Integrasi', render: function (t) { return t.Aktif ? U.badge(t.modul || 'Aktif', 'ok', true) : U.badge('Tidak aktif', 'mute'); } },
          { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function (t) { return raw(U.str(C.iconBtn('aktif', t.Aktif ? 'toggle_on' : 'toggle_off', t.Aktif ? 'Nonaktifkan' : 'Aktifkan untuk modul')) + U.str(C.iconBtn('buka', 'open_in_new', 'Buka di Drive')) + U.str(C.iconBtn('del', 'delete', 'Hapus', 'danger'))); } }],
        onAction: function (a, t, btn) {
          if (a === 'buka') window.open(t.url, '_blank', 'noopener');
          else if (a === 'aktif') C.act(btn, 'template.aktif', { ID: t.ID, aktif: !t.Aktif }, { inv: ['template.', 'kartu.'], done: function () { el._reload(); } });
          else if (a === 'del') U.confirm({ title: 'Hapus template?', message: t.Nama + ' akan dipindahkan ke tempat sampah Drive.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'template.delete', { ID: t.ID }, { inv: ['template.', 'kartu.'], done: function () { el._reload(); } }); });
        } });
    },
    show: function (el) {
      var set = function (r) { el._rows = r.template; el._folder = r.folderUrl; el._kats = r.kategori; draw(el); };
      el._reload = function () { Api.swr('template.list', {}, set, { force: true, ttl: 0 }); };
      Api.swr('template.list', {}, function (r) { if (r.success) set(r); else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } });
    }
  });
  function draw(el) {
    var rows = el._rows || [], kats = el._kats || [], sel = $('#tp-kat', el);
    if (sel.options.length !== kats.length) sel.innerHTML = kats.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
    var aktif = rows.filter(function (t) { return t.Aktif; }).length, cnt = {}; rows.forEach(function (t) { cnt[t.tipe] = (cnt[t.tipe] || 0) + 1; });
    U.mount($('#tp-stat', el), h`${C.stat({ label: 'Total Template', value: rows.length, icon: 'description', foot: Object.keys(cnt).map(function (k) { return cnt[k] + ' ' + (TIPE[k] || TIPE.file)[1]; }).join(' · ') || '—', footKind: 'info' })}${C.stat({ label: 'Template Aktif', value: aktif, icon: 'task_alt', foot: 'Dipakai modul terkait', footKind: aktif ? 'ok' : 'mute' })}${C.stat({ label: 'Folder Root', value: el._folder ? 'Terhubung' : 'Belum', icon: 'folder_special', foot: el._folder ? 'Google Drive' : 'Jalankan setup', footKind: el._folder ? 'ok' : 'warn' })}${C.stat({ label: 'Kategori', value: kats.length, icon: 'category', foot: 'Penggunaan dokumen', footKind: 'mute' })}`);
    U.mount($('#tp-tabs', el), h`${[['', 'Semua Template (' + rows.length + ')']].concat(kats.map(function (k) { return [k, k + ' (' + rows.filter(function (t) { return t.Kategori === k; }).length + ')']; })).map(function (t) { return h`<button type="button" data-kat="${t[0]}" class="px-3.5 py-1.5 rounded-full font-label-md ${el._kat === t[0] ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}">${t[1]}</button>`; })}`);
    el._tv.setRows(rows.filter(function (t) { return !el._kat || t.Kategori === el._kat; }));
  }
})();
