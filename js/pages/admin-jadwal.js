/* admin-jadwal.js — Jadwal Pelaksanaan Asesmen (jadwal_asesmen) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$, $$ = U.$$;
  var STATUS = ['Sedang Berlangsung', 'Siap Dimulai', 'Terjadwal', 'Selesai'];
  App.register('admin/jadwal', {
    role: 'admin', layout: 'staf', title: 'Jadwal Asesmen',
    prefetch: function () { return [{ action: 'jadwal.list', data: {} }, { action: 'model.list', data: {} }, { action: 'kelas.list', data: {} }]; },
    init: function (el) {
      el._view = 'tabel'; el._f = { q: '', st: '', tgl: '' };
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Jadwal Pelaksanaan Asesmen', 'Atur tanggal, sesi, ruang lab CBT, paket soal, dan rombel peserta.', raw(U.str(C.btn('ghost', 'print', 'Cetak / Simpan PDF', 'id="j-print"')) + U.str(C.btn('primary', 'add_circle', 'Tambah Sesi Jadwal', 'id="j-add"'))))}
        <div id="j-stat" class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg"></div>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg">
          <div class="flex flex-wrap items-center gap-2 mb-space-md"><div class="inline-flex rounded-lg bg-surface-container-low p-1" id="j-views">${[['tabel', 'table_rows', 'Tabel'], ['kalender', 'calendar_view_week', 'Kalender'], ['lab', 'lan', 'Per Lab']].map(function (v) { return h`<button type="button" data-v="${v[0]}" class="px-3 py-1.5 rounded-md font-label-md inline-flex items-center gap-1.5">${U.ic(v[1], 'text-[18px]')}${v[2]}</button>`; })}</div>
            <input id="j-tgl" type="date" aria-label="Filter tanggal" class="${U.INP} !w-auto">${C.select('j-st', [['', 'Semua Status Sesi']].concat(STATUS.map(function (s) { return [s, s]; })))}${C.search('j-q', 'Cari mapel, paket, rombel…')}</div>
          <div id="j-body"></div></section>`);
      var f = el._f;
      $('#j-tgl', el).onchange = function () { f.tgl = this.value; draw(el); };
      $('#j-st', el).onchange = function () { f.st = this.value; draw(el); };
      $('#j-q', el).oninput = U.debounce(function () { f.q = this.value.toLowerCase(); draw(el); }, 150);
      $('#j-views', el).onclick = function (e) { var b = e.target.closest('[data-v]'); if (b) { el._view = b.dataset.v; draw(el); } };
      $('#j-add', el).onclick = function () { form(el); };
      $('#j-print', el).onclick = function () { var rs = vis(el); C.print('Jadwal Asesmen', '<h1>Jadwal Pelaksanaan Asesmen</h1><p>' + esc((App.config || {}).NAMA_SEKOLAH || '') + ' — dicetak ' + esc(U.wib ? U.wib() : '') + '</p><table><tr><th>Tanggal</th><th>Jam</th><th>Mata Pelajaran</th><th>Paket</th><th>Rombel</th><th>Ruang</th></tr>' + rs.map(function (j) { return '<tr><td>' + esc(U.hariTgl(j.Tanggal)) + '</td><td>' + j.JamMulai + '–' + j.JamSelesai + '</td><td>' + esc(j.Mapel) + '</td><td>' + esc(j.ID_Paket) + '</td><td>' + esc(j.Kelas.join(', ')) + '</td><td>' + esc(j.Lab || '') + '</td></tr>'; }).join('') + '</table>'); };
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return; var j = (el._rows || []).filter(function (x) { return x.ID_Jadwal === b.dataset.id; })[0], a = b.dataset.a;
        if (a === 'edit') form(el, j); else if (a === 'token') App.go('admin/token'); else if (a === 'rekap') App.go('admin/rekap?jadwal=' + encodeURIComponent(j.ID_Jadwal)); else if (a === 'monitor') monitor(j);
        else if (a === 'del') U.confirm({ title: 'Hapus jadwal?', message: j.Mapel + ' — ' + U.tgl(j.Tanggal) + ' ' + j.JamMulai + '. Jadwal yang sudah punya hasil pengerjaan tidak dapat dihapus.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'jadwal.delete', { ID_Jadwal: j.ID_Jadwal }, { inv: ['jadwal.', 'dash.'], done: function () { el._reload(); } }); });
      });
    },
    show: function (el) {
      var set = function (r) { el._rows = r.jadwal; draw(el); };
      el._reload = function () { Api.swr('jadwal.list', {}, set, { force: true, ttl: 0 }); };
      Api.swr('jadwal.list', {}, function (r) { if (r.success) set(r); else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } }, { ttl: 8000 });
      Api.swr('model.list', {}, function () { }); Api.swr('kelas.list', {}, function () { if (el._rows) draw(el); });
    },
    hide: function (el) { if (el._mon) { clearInterval(el._mon); el._mon = 0; } }
  });

  function vis(el) {
    var f = el._f; return (el._rows || []).filter(function (j) { return (!f.st || j.status === f.st) && (!f.tgl || j.Tanggal === f.tgl) && (!f.q || (j.Mapel + ' ' + j.ID_Paket + ' ' + j.Kelas.join(' ') + ' ' + (j.Lab || '')).toLowerCase().indexOf(f.q) >= 0); });
  }
  function tokenCell(j) {
    if (j.ModeToken === 'manual') return raw('<span class="inline-flex items-center gap-1 font-tabular-code">' + U.str(U.ic('edit', 'text-[16px]')) + 'Manual</span>');
    return raw(j.TokenAktif ? '<span class="inline-flex items-center gap-1 font-tabular-code font-bold text-primary">' + U.str(U.ic('bolt', 'text-[16px]')) + esc(j.token) + '</span>' : '<span class="inline-flex items-center gap-1 text-on-surface-variant">' + U.str(U.ic('lock', 'text-[16px]')) + '••••••</span>');
  }
  function aksi(j) {
    return U.str(C.iconBtn('', 'visibility', 'Monitor', '', 'data-a="monitor" data-id="' + esc(j.ID_Jadwal) + '"')) + U.str(C.iconBtn('', 'key', 'Token', '', 'data-a="token" data-id="' + esc(j.ID_Jadwal) + '"')) + U.str(C.iconBtn('', 'receipt_long', 'Rekap', '', 'data-a="rekap" data-id="' + esc(j.ID_Jadwal) + '"')) + U.str(C.iconBtn('', 'edit_calendar', 'Ubah', '', 'data-a="edit" data-id="' + esc(j.ID_Jadwal) + '"')) + U.str(C.iconBtn('', 'delete', 'Hapus', 'danger', 'data-a="del" data-id="' + esc(j.ID_Jadwal) + '"'));
  }
  function draw(el) {
    var rows = el._rows || [], vs = vis(el), today = U.todayIso();
    $$('#j-views [data-v]', el).forEach(function (b) { var on = b.dataset.v === el._view; b.className = 'px-3 py-1.5 rounded-md font-label-md inline-flex items-center gap-1.5 ' + (on ? 'bg-surface-card text-primary shadow-sm' : 'text-on-surface-variant'); });
    var tglSet = {}; rows.forEach(function (j) { tglSet[j.Tanggal] = 1; }); var tgls = Object.keys(tglSet).sort(), hariIni = rows.filter(function (j) { return j.Tanggal === today; });
    var ready = rows.filter(function (j) { return j.jumlahSoal > 0; }).length, kel = {}; rows.forEach(function (j) { (j.ID_Kelas || []).forEach(function (k) { kel[k] = 1; }); });
    U.mount($('#j-stat', el), h`${C.stat({ label: 'Total Sesi Terjadwal', value: rows.length, icon: 'calendar_month', foot: tgls.length ? U.tgl(tgls[0]) + ' – ' + U.tgl(tgls[tgls.length - 1]) : 'Belum ada', footKind: 'info' })}${C.stat({ label: 'Sesi Hari Ini', value: hariIni.length, icon: 'desktop_windows', foot: hariIni.filter(function (j) { return j.status === 'Sedang Berlangsung'; }).length + ' berlangsung', footKind: hariIni.length ? 'ok' : 'mute' })}${C.stat({ label: 'Rombel Tercover', value: Object.keys(kel).length, icon: 'groups', foot: 'Memiliki jadwal', footKind: 'ok' })}${C.stat({ label: 'Kesiapan Soal', value: ready + '/' + rows.length, icon: 'lock_clock', foot: rows.length - ready ? (rows.length - ready) + ' belum siap' : 'Semua siap rilis', footKind: rows.length - ready ? 'warn' : 'ok' })}`);
    var body = $('#j-body', el);
    if (!vs.length) { U.mount(body, h`<div class="py-14 text-center text-on-surface-variant">${U.ic('event_busy', 'text-[44px] text-outline')}<p class="mt-2">${rows.length ? 'Tidak ada jadwal yang cocok dengan filter.' : 'Belum ada jadwal. Klik “Tambah Sesi Jadwal”.'}</p></div>`); return; }
    if (el._view === 'tabel') {
      U.mount(body, h`<div class="overflow-x-auto"><table class="w-full text-left text-body-md min-w-[900px]"><thead><tr class="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wide"><th class="py-2.5 px-3">No</th><th class="py-2.5 px-3">Hari & Tanggal</th><th class="py-2.5 px-3">Sesi & Jam</th><th class="py-2.5 px-3">Mapel & Paket</th><th class="py-2.5 px-3">Rombel & Ruang</th><th class="py-2.5 px-3">Token</th><th class="py-2.5 px-3">Status</th><th class="py-2.5 px-3 text-right">Aksi</th></tr></thead><tbody>${vs.map(function (j, i) { return h`<tr class="border-b border-border-standard/50 hover:bg-surface-container-low/50"><td class="py-3 px-3 font-tabular-code">${('0' + (i + 1)).slice(-2)}</td><td class="py-3 px-3 whitespace-nowrap">${U.hariTgl(j.Tanggal)}</td><td class="py-3 px-3 whitespace-nowrap"><div class="font-tabular-code">${j.JamMulai}–${j.JamSelesai}</div>${j.JamKe ? h`<div class="font-body-sm text-on-surface-variant">Sesi ${j.JamKe}</div>` : ''}</td><td class="py-3 px-3"><div class="font-medium">${j.Mapel}</div><div class="font-body-sm text-on-surface-variant">${j.ID_Paket} · ${j.jumlahSoal} soal siap</div></td><td class="py-3 px-3"><div>${j.Kelas.join(', ')}</div><div class="font-body-sm text-on-surface-variant">${j.Lab || '—'}</div></td><td class="py-3 px-3">${tokenCell(j)}</td><td class="py-3 px-3">${U.statusJadwalBadge(j.status)}</td><td class="py-3 px-3 whitespace-nowrap text-right">${raw(aksi(j))}</td></tr>`; })}</tbody></table></div>`);
    } else {
      var key = el._view === 'lab' ? function (j) { return (j.Lab || 'Tanpa ruang').split(',')[0]; } : function (j) { return j.Tanggal; }, g = {}; vs.forEach(function (j) { (g[key(j)] = g[key(j)] || []).push(j); });
      U.mount(body, h`<div class="grid grid-cols-1 lg:grid-cols-2 gap-space-md">${Object.keys(g).sort().map(function (k) { return h`<div class="rounded-xl border border-border-standard/70 overflow-hidden"><div class="px-4 py-2.5 bg-surface-container-low font-label-md flex items-center gap-2">${U.ic(el._view === 'lab' ? 'computer' : 'event', 'text-primary text-[18px]')}${el._view === 'lab' ? k : U.hariTgl(k)}<span class="ml-auto text-on-surface-variant font-tabular-code">${g[k].length} sesi</span></div><ul class="divide-y divide-border-standard/50">${g[k].map(function (j) { return h`<li class="px-4 py-3 flex items-center gap-3"><div class="font-tabular-code text-body-sm w-24 shrink-0">${el._view === 'lab' ? U.tgl(j.Tanggal) + ' ' : ''}${j.JamMulai}–${j.JamSelesai}</div><div class="flex-1 min-w-0"><div class="font-medium truncate">${j.Mapel}</div><div class="font-body-sm text-on-surface-variant truncate">${j.Kelas.join(', ')}${el._view !== 'lab' && j.Lab ? ' · ' + j.Lab : ''}</div></div>${U.statusJadwalBadge(j.status)}<div class="shrink-0">${raw(U.str(C.iconBtn('', 'edit_calendar', 'Ubah', '', 'data-a="edit" data-id="' + esc(j.ID_Jadwal) + '"')) + U.str(C.iconBtn('', 'visibility', 'Monitor', '', 'data-a="monitor" data-id="' + esc(j.ID_Jadwal) + '"')))}</div></li>`; })}</ul></div>`; })}</div>`);
    }
  }

  function form(el, j) {
    j = j || {}; var edit = !!j.ID_Jadwal, paket = ((Api.peek('model.list', {}) || {}).paket || []), kelas = ((Api.peek('kelas.list', {}) || {}).kelas || []);
    var labs = {}; kelas.forEach(function (k) { if (k.Lab) labs[k.Lab] = 1; }); String(j.Lab || '').split(',').forEach(function (l) { if (l) labs[l] = 1; });
    var selL = String(j.Lab || '').split(',').filter(Boolean), selK = j.ID_Kelas || [];
    var m = U.modal({ title: edit ? 'Ubah Sesi Jadwal' : 'Tambah Sesi Jadwal', width: 'max-w-3xl',
      body: h`<form class="grid grid-cols-1 sm:grid-cols-2 gap-4" autocomplete="off">
        ${U.field({ name: 'Tanggal', label: 'Tanggal Ujian', type: 'date', required: true, value: j.Tanggal || U.todayIso() })}
        ${U.field({ name: 'JamKe', label: 'Sesi ke-', value: j.JamKe, placeholder: '1' })}
        ${U.field({ name: 'JamMulai', label: 'Jam Mulai', type: 'time', required: true, value: j.JamMulai || '07:30' })}
        ${U.field({ name: 'JamSelesai', label: 'Jam Selesai', type: 'time', required: true, value: j.JamSelesai || '09:30' })}
        ${U.field({ name: 'ID_Paket', label: 'Paket Soal', type: 'select', required: true, cls: 'sm:col-span-2', value: j.ID_Paket, options: [{ value: '', label: '— Pilih paket soal —' }].concat(paket.map(function (p) { return { value: p.ID_Paket, label: p.ID_Paket + ' — ' + p.Mapel + ' (' + p.stat.siap + ' butir siap)' }; })) })}
        <input type="hidden" name="Mapel" value="${j.Mapel || ''}">
        <div class="sm:col-span-2"><span class="block font-label-md mb-1">Rombel Peserta <span class="text-error">*</span></span><div class="flex flex-wrap gap-2">${kelas.map(function (k) { return h`<label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low font-label-md cursor-pointer"><input type="checkbox" data-k value="${k.ID_Kelas}" ${selK.indexOf(k.ID_Kelas) >= 0 ? raw('checked') : ''} class="rounded border-border-strong text-primary-container">${k.Nama}</label>`; })}</div></div>
        <div class="sm:col-span-2"><span class="block font-label-md mb-1">Ruang / Lab CBT</span><div class="flex flex-wrap gap-2" id="j-labs">${Object.keys(labs).map(function (l) { return h`<label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low font-label-md cursor-pointer"><input type="checkbox" data-l value="${l}" ${selL.indexOf(l) >= 0 ? raw('checked') : ''} class="rounded border-border-strong text-primary-container">${l}</label>`; })}</div><div class="flex gap-2 mt-2"><input id="j-lab-n" placeholder="Tambah ruang lain…" class="${U.INP} flex-1"><button type="button" id="j-lab-b" class="${U.BTN.ghost}">Tambah</button></div></div>
        ${U.field({ name: 'DurasiMenit', label: 'Durasi Pengerjaan (menit)', type: 'number', value: j.DurasiMenit || '', attrs: 'min="5" max="360"', hint: 'Kosong = ikuti durasi paket.' })}
        ${U.field({ name: 'ModeToken', label: 'Mode Token', type: 'select', value: j.ModeToken || 'otomatis', options: [{ value: 'otomatis', label: 'Otomatis (berganti berkala)' }, { value: 'manual', label: 'Manual (token tetap)' }] })}
        <div data-mt="otomatis">${U.field({ name: 'IntervalMenit', label: 'Ganti token tiap (menit)', type: 'number', value: j.IntervalMenit || 30, attrs: 'min="1" max="240"' })}</div>
        <div data-mt="manual" hidden>${U.field({ name: 'TokenManual', label: 'Token Manual', value: '', mono: true, attrs: 'maxlength="12" style="text-transform:uppercase"', hint: 'Minimal 4 huruf/angka.' })}</div></form>`,
      buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Simpan Jadwal', primary: true, onClick: function (x, b) {
        var d = U.formData(x.body), pk = paket.filter(function (p) { return p.ID_Paket === d.ID_Paket; })[0]; if (!pk) return U.toast('Pilih paket soal.', 'err');
        d.Mapel = pk.Mapel; d.ID_Kelas = $$('[data-k]:checked', x.body).map(function (c) { return c.value; }); d.Lab = $$('[data-l]:checked', x.body).map(function (c) { return c.value; });
        d.DurasiMenit = +d.DurasiMenit || undefined; d.IntervalMenit = +d.IntervalMenit || undefined; if (edit) d.ID_Jadwal = j.ID_Jadwal; delete d.on;
        C.act(b, 'jadwal.save', d, { inv: ['jadwal.', 'token.', 'dash.'], done: function (r) { x.close(); el._reload(); } }); } }] });
    var sel = $('[name=ModeToken]', m.body), tg = function () { $$('[data-mt]', m.body).forEach(function (n) { n.hidden = n.dataset.mt !== sel.value; }); }; sel.onchange = tg; tg();
    $('#j-lab-b', m.el).onclick = function () { var v = $('#j-lab-n', m.el).value.trim(); if (!v) return; $('#j-labs', m.el).insertAdjacentHTML('beforeend', '<label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low font-label-md cursor-pointer"><input type="checkbox" data-l checked value="' + esc(v) + '" class="rounded border-border-strong text-primary-container">' + esc(v) + '</label>'); $('#j-lab-n', m.el).value = ''; };
  }

  function monitor(j) {
    var tick, m = U.modal({ title: 'Monitor Live — ' + j.Mapel, subtitle: U.hariTgl(j.Tanggal) + ' · ' + j.JamMulai + '–' + j.JamSelesai, width: 'max-w-3xl', buttons: [{ label: 'Tutup', primary: true, onClick: function (x) { x.close(); } }], onClose: function () { clearInterval(tick); }, body: h`<div data-m class="text-on-surface-variant">Memuat…</div>` });
    function load() {
      Api.call('jadwal.monitor', { ID_Jadwal: j.ID_Jadwal }).then(function (r) {
        if (!document.body.contains(m.el)) { clearInterval(tick); return; }
        if (!r.success) { U.mount($('[data-m]', m.el), C.errorBox(r.message)); return; }
        var c = r.ringkas, tot = r.peserta.length, km = C.kelasMap();
        U.mount($('[data-m]', m.el), h`<div class="grid grid-cols-3 gap-2 mb-3">${[['Mengerjakan', c.Mengerjakan, 'info'], ['Selesai', c.Selesai, 'ok'], ['Belum masuk', c['Belum masuk'], 'mute']].map(function (x) { return h`<div class="p-3 rounded-lg bg-surface-container-low text-center"><div class="font-headline-md text-headline-md">${x[1]}<span class="font-body-sm text-on-surface-variant">/${tot}</span></div>${U.badge(x[0], x[2])}</div>`; })}</div>
          <div class="max-h-[50vh] overflow-y-auto rounded-lg border border-border-standard"><table class="w-full text-body-md"><thead class="sticky top-0 bg-surface-container-low font-label-sm uppercase text-on-surface-variant"><tr><th class="py-2 px-3 text-left">Meja</th><th class="py-2 px-3 text-left">Nama</th><th class="py-2 px-3 text-left">Kelas</th><th class="py-2 px-3 text-left">Status</th></tr></thead><tbody>${r.peserta.map(function (p) { return h`<tr class="border-t border-border-standard/50"><td class="py-1.5 px-3 font-tabular-code">${p.Meja || '—'}</td><td class="py-1.5 px-3">${p.Nama}</td><td class="py-1.5 px-3">${(km[p.ID_Kelas] || {}).Nama || p.ID_Kelas}</td><td class="py-1.5 px-3">${U.badge(p.status, p.status === 'Selesai' ? 'ok' : p.status === 'Mengerjakan' ? 'info' : 'mute', p.status === 'Mengerjakan' ? 'pulse' : true)}</td></tr>`; })}</tbody></table></div><p class="font-body-sm text-on-surface-variant mt-2">Diperbarui otomatis tiap 10 detik.</p>`);
      });
    }
    load(); tick = setInterval(load, 10000);
  }
})();
