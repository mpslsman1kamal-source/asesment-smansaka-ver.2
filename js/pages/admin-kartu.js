/* admin-kartu.js — Cetak Kartu Asesmen Siswa (cetak_kartu_asesmen_siswa) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$, $$ = U.$$;
  var MAKS = 120;
  App.register('admin/kartu', {
    role: 'admin', layout: 'staf', title: 'Cetak Kartu Asesmen',
    prefetch: function () { return [{ action: 'kartu.siswa', data: {} }, { action: 'kelas.list', data: {} }]; },
    init: function (el) {
      el._sel = {}; el._q = ''; el._pv = '';
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Cetak Kartu Asesmen Siswa', 'Penerbitan kartu peserta berisi identitas, ruang/meja, username, dan sandi awal.', raw(''))}
        <div class="grid grid-cols-1 xl:grid-cols-5 gap-space-lg items-start">
          <div class="xl:col-span-3 flex flex-col gap-space-lg">
            <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm mb-space-sm flex items-center gap-2">${U.ic('tune', 'text-primary')}Pengaturan Kartu Ujian</h2>
              <div class="grid sm:grid-cols-2 gap-4"><div><label class="block font-label-md mb-1" for="k-kelas">Pilih Kelas / Rombel</label><span data-kk></span></div><div><label class="block font-label-md mb-1" for="k-tpl">Desain Template Dokumen</label><select id="k-tpl" class="${U.INP}"></select></div></div>
              <p id="k-tplinfo" class="font-body-sm text-on-surface-variant mt-2"></p></section>
            <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg">
              <div class="flex flex-wrap items-center gap-2 mb-space-sm"><button type="button" id="k-all" class="${U.BTN.soft}">${U.ic('check_circle', 'text-[18px]')}<span data-l>Pilih Semua</span></button><button type="button" id="k-inv" class="${U.BTN.ghost}">Balik Pilihan</button>${C.search('k-q', 'Cari nama atau NISN…')}</div>
              <div id="k-list" class="max-h-[420px] overflow-y-auto flex flex-col gap-1.5 pr-1"></div></section>
            <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm mb-space-sm">Opsi Tata Letak Kertas Cetak</h2>
              <div class="grid sm:grid-cols-2 gap-3"><label class="flex items-center gap-2 p-3 rounded-lg border border-border-standard cursor-pointer"><input type="radio" name="k-lay" value="a4x4" checked class="text-primary-container">1 Lembar A4 (4 Kartu)</label><label class="flex items-center gap-2 p-3 rounded-lg border border-border-standard cursor-pointer"><input type="radio" name="k-lay" value="a6" class="text-primary-container">Kartu Satuan A6</label>
                <label class="flex items-center gap-2 p-3 rounded-lg border border-border-standard cursor-pointer"><input type="checkbox" id="k-ttd" checked class="rounded text-primary-container">Sertakan nama &amp; TTD Kepala Sekolah</label><label class="flex items-center gap-2 p-3 rounded-lg border border-border-standard cursor-pointer"><input type="checkbox" id="k-garis" checked class="rounded text-primary-container">Cetak garis potong</label></div>
              <div class="flex flex-wrap gap-2 mt-space-md"><button type="button" id="k-print" class="${U.BTN.primary}">${U.ic('print', 'text-[18px]')}<span data-l>Cetak Massal (0 Siswa)</span></button><button type="button" id="k-pdf" class="${U.BTN.ghost}">${U.ic('picture_as_pdf', 'text-[18px]')}<span>Unduh PDF Batch</span></button></div>
              <div class="mt-space-md p-3 rounded-lg bg-status-info-bg text-status-info-text font-body-sm flex gap-2">${U.ic('info', 'text-[18px]')}<span>Cetak pada kertas minimal 160 gsm. Maksimal ${MAKS} kartu per berkas PDF; pilihan lebih banyak otomatis dipecah menjadi beberapa berkas. Kartu memuat sandi awal — simpan dan bagikan dengan aman.</span></div></section>
          </div>
          <aside class="xl:col-span-2 xl:sticky xl:top-24"><section class="bg-surface-card rounded-xl shadow-sm p-space-md"><h2 class="font-headline-sm mb-space-sm flex items-center gap-2">${U.ic('visibility', 'text-primary')}Pratinjau Kartu Peserta</h2><div id="k-pv"></div><p class="font-body-sm text-on-surface-variant mt-2">Pratinjau tata letak. Sandi hanya tampil pada PDF hasil cetak.</p></section></aside>
        </div>`);
      $('#k-tpl', el).onchange = function () { info(el); };
      $('#k-q', el).oninput = U.debounce(function () { el._q = this.value.toLowerCase(); list(el); }, 120);
      $('#k-all', el).onclick = function () { var v = vis(el), all = v.every(function (s) { return el._sel[s.ID]; }); v.forEach(function (s) { if (all) delete el._sel[s.ID]; else el._sel[s.ID] = 1; }); list(el); };
      $('#k-inv', el).onclick = function () { vis(el).forEach(function (s) { if (el._sel[s.ID]) delete el._sel[s.ID]; else el._sel[s.ID] = 1; }); list(el); };
      $('#k-list', el).addEventListener('click', function (e) { var r = e.target.closest('[data-id]'); if (!r) return; var id = r.dataset.id; if (e.target.closest('[data-lihat]')) { el._pv = id; pv(el); return; } if (el._sel[id]) delete el._sel[id]; else el._sel[id] = 1; el._pv = id; list(el); });
      $('#k-print', el).onclick = function () { cetak(el, true, this); }; $('#k-pdf', el).onclick = function () { cetak(el, false, this); };
    },
    show: function (el) {
      el._load = function (kelasId) { Api.swr('kartu.siswa', kelasId ? { kelasId: kelasId } : {}, function (r) { if (!r.success) return; el._data = r; el._kelas = kelasId || ''; fill(el); }, { ttl: 5000 }); };
      $('[data-kk]', el).innerHTML = U.str(C.select('k-kelas', C.kelasOpts('Semua kelas')));
      var sel = $('#k-kelas', el); sel.value = el._kelas || ''; sel.onchange = function () { el._sel = {}; el._load(this.value); };
      Api.swr('kelas.list', {}, function () { var v = sel.value; sel.innerHTML = U.str(C.kelasOpts('Semua kelas').map(function (o) { return raw('<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'); }).reduce(function (a, b) { return raw(U.str(a) + U.str(b)); }, raw(''))); sel.value = v; });
      el._load(el._kelas);
    }
  });
  function vis(el) { var q = el._q; return ((el._data && el._data.siswa) || []).filter(function (s) { return !q || (s.Nama + ' ' + s.NISN).toLowerCase().indexOf(q) >= 0; }); }
  function fill(el) {
    var tpl = el._data.template || [], sel = $('#k-tpl', el), keep = sel.value;
    sel.innerHTML = '<option value="">Desain bawaan sistem</option>' + tpl.map(function (t) { return '<option value="' + esc(t.ID) + '">' + esc(t.Nama) + (t.Aktif ? ' (aktif)' : '') + '</option>'; }).join('');
    sel.value = keep || (tpl.filter(function (t) { return t.Aktif; })[0] || {}).ID || ''; info(el); list(el);
  }
  function info(el) { var id = $('#k-tpl', el).value, t = ((el._data && el._data.template) || []).filter(function (x) { return x.ID === id; })[0]; $('#k-tplinfo', el).textContent = t ? (t.mime && /document/.test(t.mime) ? 'Template Google Docs: placeholder {{NAMA}}, {{NISN}}, {{KELAS}}, {{RUANG}}, {{MEJA}}, {{USERNAME}}, {{PASSWORD}} diganti otomatis.' : 'Berkas template dipilih. Hanya Google Docs yang dipakai untuk mail-merge kartu; selain itu memakai desain bawaan.') : 'Memakai desain kartu bawaan sistem (logo sekolah, QR, identitas, sandi).'; }
  function list(el) {
    var v = vis(el), n = Object.keys(el._sel).length;
    U.mount($('#k-list', el), v.length ? h`${v.map(function (s) { var on = el._sel[s.ID]; return h`<div data-id="${s.ID}" class="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${on ? 'bg-primary-fixed/50 ring-1 ring-primary-container/40' : 'bg-surface-container-low hover:bg-surface-container'}"><span class="w-5 h-5 rounded border ${on ? 'bg-primary-container border-primary-container text-white' : 'border-border-strong bg-white'} inline-flex items-center justify-center">${on ? U.ic('check', 'text-[14px]') : ''}</span><span class="w-9 h-9 rounded-full bg-surface-container text-primary inline-flex items-center justify-center font-label-md">${U.initials(s.Nama)}</span><div class="min-w-0 flex-1"><div class="font-medium truncate">${s.Nama}</div><div class="font-body-sm text-on-surface-variant font-tabular-code truncate">NISN ${s.NISN} · ${s.Kelas}${s.Meja ? ' · Meja ' + s.Meja : ''}</div></div><button type="button" data-lihat class="font-label-md text-primary hover:underline">Lihat</button></div>`; })}` : h`<p class="py-8 text-center text-on-surface-variant">Tidak ada siswa.</p>`);
    $('#k-print [data-l]', el).textContent = 'Cetak Massal (' + n + ' Siswa)'; $('#k-all [data-l]', el).textContent = v.length && v.every(function (s) { return el._sel[s.ID]; }) ? 'Batal Pilih Semua' : 'Pilih Semua Siswa (' + v.length + ')';
    if (!el._pv && v[0]) el._pv = v[0].ID; pv(el);
  }
  function pv(el) {
    var s = ((el._data && el._data.siswa) || []).filter(function (x) { return x.ID === el._pv; })[0], sk = (el._data && el._data.sekolah) || {};
    if (!s) { U.mount($('#k-pv', el), h`<p class="py-10 text-center text-on-surface-variant">Pilih siswa untuk melihat pratinjau.</p>`); return; }
    var row = function (a, b) { return h`<div class="grid grid-cols-[110px_8px_1fr] gap-x-1 py-0.5"><span class="text-on-surface-variant">${a}</span><span>:</span><span class="font-semibold break-words">${b}</span></div>`; };
    U.mount($('#k-pv', el), h`<div class="mx-auto max-w-[360px] rounded-xl border-2 border-primary-container/60 bg-white overflow-hidden shadow-sm"><div class="bg-primary-container text-on-primary px-3 py-2.5 flex items-center gap-2"><img src="img/logo.png" alt="" class="w-9 h-9 object-contain bg-white rounded p-0.5"><div class="leading-tight"><div class="font-label-md font-bold uppercase">${sk.nama || ''}</div><div class="font-label-sm opacity-90">Kartu Peserta ${sk.jenis || 'Asesmen'} ${sk.tahun || ''}</div></div></div>
      <div class="p-3 font-body-sm">${row('Nama', s.Nama)}${row('NISN', s.NISN)}${row('Kelas / Sesi', s.Kelas + (s.Sesi ? ' / Sesi ' + s.Sesi : ''))}${row('Ruang', (s.Lab || '-') + (s.Meja ? ' (Meja ' + s.Meja + ')' : ''))}${row('Username', s.Username)}${row('Sandi', s.adaSandi ? '•••••••• (tercetak di PDF)' : 'Belum dibuat')}
      <div class="mt-3 flex items-end justify-between"><div class="w-16 h-16 bg-surface-container rounded flex items-center justify-center">${U.ic('qr_code_2', 'text-[44px] text-on-surface-variant')}</div><div class="text-right text-[11px]"><div>${sk.kota || ''}</div><div class="mt-6 font-semibold">${sk.kepsek || '________________'}</div><div>${sk.nip ? 'NIP. ' + sk.nip : ''}</div></div></div></div></div>`);
  }
  function cetak(el, buka, btn) {
    var ids = Object.keys(el._sel); if (!ids.length) return U.toast('Pilih minimal satu siswa.', 'err');
    var lay = $('input[name=k-lay]:checked', el).value, tpl = $('#k-tpl', el).value, parts = []; for (var i = 0; i < ids.length; i += MAKS) parts.push(ids.slice(i, i + MAKS));
    U.busy(btn, true, 'Membuat PDF…'); var n = 0;
    (function next(k) {
      if (k >= parts.length) { U.busy(btn, false); U.toast(n + ' kartu dibuat (' + parts.length + ' berkas).', 'ok'); return; }
      Api.call('kartu.pdf', { ids: parts[k], layout: lay, ttd: $('#k-ttd', el).checked, garis: $('#k-garis', el).checked, templateId: tpl || undefined }, { timeout: 120000 }).then(function (r) {
        if (!r.success) { U.busy(btn, false); return U.toast(r.message, 'err'); }
        n += r.jumlah || parts[k].length;
        if (buka && parts.length === 1) { var bin = atob(r.base64), u = new Uint8Array(bin.length); for (var j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j); var w = window.open(URL.createObjectURL(new Blob([u], { type: 'application/pdf' })), '_blank'); if (!w) U.downloadB64(r.namaFile, r.mime, r.base64); }
        else U.downloadB64(parts.length > 1 ? r.namaFile.replace(/\.pdf$/i, '-' + (k + 1) + '.pdf') : r.namaFile, r.mime, r.base64);
        next(k + 1);
      });
    })(0);
  }
})();
