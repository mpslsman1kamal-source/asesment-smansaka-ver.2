/* rekap.js — Rekap Nilai Siswa (rekap_nilai_siswa); dipakai Guru & Admin */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$, $$ = U.$$;
  var SK = { Tuntas: 'ok', Remedial: 'err', 'Menunggu Koreksi': 'warn', 'Belum Mengerjakan': 'mute' };
  function menit(d) { return d ? Math.round(d / 60) + ' mnt' : '—'; }

  function reg(path, role) {
    App.register(path, {
      role: role, layout: 'staf', title: 'Rekap Nilai Siswa',
      prefetch: function () { return [{ action: 'jadwal.list', data: role === 'guru' ? { hanyaMapel: true } : {} }]; },
      init: function (el) {
        el._f = { st: '', sort: 'nama' };
        U.mount(el, h`<div data-err hidden></div>
          ${C.head('Rekapitulasi Nilai Asesmen Sumatif', 'Nilai dihitung otomatis dari kunci jawaban dan bobot butir; esai dikoreksi manual.', raw(U.str(C.btn('ghost', 'sync', 'Refresh', 'id="r-ref"')) + U.str(C.btn('ghost', 'picture_as_pdf', 'Cetak Leger (PDF)', 'id="r-pdf"')) + U.str(C.btn('primary', 'table_view', 'Unduh Rekap Excel (.xlsx)', 'id="r-xls"'))))}
          <section class="bg-surface-card rounded-xl shadow-sm p-space-md mb-space-lg"><label class="block font-label-md mb-1" for="r-j">Sesi Asesmen</label><select id="r-j" class="${U.INP}"></select><div id="r-head" class="mt-2 font-body-sm text-on-surface-variant"></div></section>
          <div id="r-stat" class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg"></div>
          <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg mb-space-lg"><h2 class="font-headline-sm mb-space-sm">Sebaran Nilai</h2><div id="r-dist"></div></section>
          <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><div class="flex flex-wrap items-center gap-2 mb-space-md">${C.search('r-q', 'Cari nama atau NISN…')}${C.select('r-st', [['', 'Status: Semua'], ['Tuntas', 'Tuntas'], ['Remedial', 'Remedial'], ['Menunggu Koreksi', 'Menunggu Koreksi'], ['Belum Mengerjakan', 'Belum Mengerjakan']])}${C.select('r-so', [['nama', 'Urutan: Nama (A-Z)'], ['tinggi', 'Urutan: Nilai Tertinggi'], ['rendah', 'Urutan: Nilai Terendah'], ['nisn', 'Urutan: NISN']])}</div><div id="r-tv"></div></section>`);
        el._tv = new TableView({ el: $('#r-tv', el), rowId: 'NISN', size: 12, searchKeys: ['Nama', 'NISN'], emptyIcon: 'grading', emptyText: 'Belum ada data peserta.',
          columns: [
            { key: 'no', label: 'No', td: 'font-tabular-code text-on-surface-variant' },
            { key: 'NISN', label: 'NISN', td: 'font-tabular-code' },
            { key: 'Nama', label: 'Nama Lengkap Siswa', render: function (r) { return raw('<div class="font-medium">' + esc(r.Nama) + '</div><div class="font-body-sm text-on-surface-variant">' + esc(r.Kelas) + (r.durasiDetik ? ' · ' + menit(r.durasiDetik) : '') + '</div>'); } },
            { key: 'JK', label: 'L/P' },
            { key: 'benar', label: 'Benar / Soal', td: 'font-tabular-code whitespace-nowrap', render: function (r) { return r.total ? r.benar + ' / ' + r.total : '—'; } },
            { key: 'pg', label: 'Skor Objektif', td: 'font-tabular-code', render: function (r) { return r.pg === undefined ? '—' : r.pg; } },
            { key: 'esai', label: 'Skor Esai', td: 'font-tabular-code', render: function (r) { return r.esai === undefined ? '—' : r.esai; } },
            { key: 'nilai', label: 'Nilai Akhir', td: 'font-tabular-code font-bold text-primary', render: function (r) { return r.nilai === null ? '—' : r.nilai; } },
            { key: 'status', label: 'Status Ketuntasan', render: function (r) { return U.badge(r.status + (r.predikat && r.status === 'Tuntas' ? ' (' + r.predikat + ')' : ''), SK[r.status] || 'mute', true); } },
            { key: 'catatan', label: 'Catatan Guru', td: 'font-body-sm text-on-surface-variant max-w-[220px]', render: function (r) { return r.catatan || '—'; } },
            { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function (r) { return r.ID_Hasil ? raw(U.str(C.iconBtn('lembar', r.status === 'Menunggu Koreksi' ? 'edit_note' : 'visibility', r.status === 'Menunggu Koreksi' ? 'Koreksi esai & detail' : 'Lembar jawaban'))) : ''; } }],
          onAction: function (a, r) { if (a === 'lembar') lembar(el, r); } });
        $('#r-q', el).oninput = U.debounce(function () { el._tv.setQuery(this.value); }, 150);
        $('#r-st', el).onchange = function () { var v = this.value; el._tv.setFilter(v ? function (r) { return r.status === v; } : null); };
        $('#r-so', el).onchange = function () { el._sort = this.value; sortRows(el); };
        $('#r-j', el).onchange = function () { el._jid = this.value; load(el, true); };
        $('#r-ref', el).onclick = function () { load(el, true); };
        $('#r-xls', el).onclick = function () { unduh(el, 'rekap.xlsx', this); }; $('#r-pdf', el).onclick = function () { unduh(el, 'rekap.leger', this); };
      },
      show: function (el, ctx) {
        el._role = role; var want = (ctx.query && ctx.query.jadwal) || el._jid || '';
        Api.swr('jadwal.list', role === 'guru' ? { hanyaMapel: true } : {}, function (r) {
          if (!r.success) return; var list = r.jadwal.filter(function (j) { return j.status !== 'Terjadwal' || true; }).sort(function (a, b) { return b.mulaiMs - a.mulaiMs; });
          var sel = $('#r-j', el); sel.innerHTML = list.length ? list.map(function (j) { return '<option value="' + esc(j.ID_Jadwal) + '">' + esc(j.Mapel + ' — ' + j.Kelas.join(', ') + ' — ' + U.hariTgl(j.Tanggal) + ' ' + j.JamMulai + ' (' + j.status + ')') + '</option>'; }).join('') : '<option value="">Belum ada jadwal</option>';
          if (!list.some(function (j) { return j.ID_Jadwal === want; })) { var done = list.filter(function (j) { return j.status !== 'Terjadwal'; })[0] || list[0]; want = done ? done.ID_Jadwal : ''; }
          sel.value = want; if (want !== el._jid || (ctx.query && ctx.query.jadwal)) { el._jid = want; load(el); }
        });
      }
    });
  }
  function load(el, force) {
    var jid = el._jid; if (!jid) { el._tv.setRows([]); return; }
    Api.swr('rekap.get', { ID_Jadwal: jid }, function (r, meta) {
      if (jid !== el._jid) return;
      if (!r.success) { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; return; } $('[data-err]', el).hidden = true;
      el._rk = r; el._tv.setRows(r.rows); sortRows(el); var hd = r.header;
      $('#r-head', el).textContent = hd.Mapel + ' · ' + hd.Kelas + ' · ' + U.hariTgl(hd.Tanggal) + ' · ' + hd.JamMulai + '–' + hd.JamSelesai + ' · KKM ' + hd.KKM;
      var s = r.ringkas;
      U.mount($('#r-stat', el), h`${C.stat({ label: 'Rata-rata Nilai', value: s.rata, icon: 'analytics', foot: 'Tertinggi ' + s.tertinggi + ' · Terendah ' + s.terendah, footKind: 'info' })}${C.stat({ label: 'Ketuntasan KKM (≥ ' + hd.KKM + ')', value: s.dikumpulkan ? Math.round(s.tuntas / s.dikumpulkan * 1000) / 10 + '%' : '—', icon: 'verified', foot: s.tuntas + ' tuntas · ' + s.remedial + ' remedial', footKind: s.remedial ? 'warn' : 'ok' })}${C.stat({ label: 'Telah Mengumpulkan', value: s.dikumpulkan + '/' + s.peserta, icon: 'assignment_turned_in', foot: (s.peserta - s.dikumpulkan) + ' belum mengerjakan', footKind: s.peserta === s.dikumpulkan ? 'ok' : 'mute' })}${C.stat({ label: 'Menunggu Koreksi Esai', value: s.menunggu, icon: 'edit_note', foot: s.menunggu ? 'Perlu dikoreksi guru' : 'Semua terkoreksi', footKind: s.menunggu ? 'warn' : 'ok' })}`);
      var d = r.distribusi, mx = Math.max(1, Math.max.apply(null, Object.keys(d).map(function (k) { return d[k]; })));
      U.mount($('#r-dist', el), h`<div class="grid grid-cols-5 gap-3 items-end h-40">${Object.keys(d).map(function (k) { return h`<div class="flex flex-col items-center justify-end h-full gap-1"><span class="font-tabular-code font-bold">${d[k]}</span><div class="w-full max-w-[64px] rounded-t-lg ${k === '0-59' ? 'bg-status-error-text/70' : 'bg-primary-container'}" style="height:${Math.max(4, d[k] / mx * 100)}%"></div><span class="font-label-sm text-on-surface-variant">${k}</span></div>`; })}</div>`);
    }, { ttl: force ? 0 : 6000, force: !!force });
  }
  function sortRows(el) {
    var rows = (el._rk && el._rk.rows || []).slice(), s = el._sort || 'nama', nv = function (r) { return r.nilai === null ? -1 : r.nilai; };
    rows.sort(s === 'tinggi' ? function (a, b) { return nv(b) - nv(a); } : s === 'rendah' ? function (a, b) { return (a.nilai === null ? 999 : a.nilai) - (b.nilai === null ? 999 : b.nilai); } : s === 'nisn' ? function (a, b) { return String(a.NISN).localeCompare(String(b.NISN)); } : function (a, b) { return String(a.Nama).localeCompare(String(b.Nama)); });
    el._tv.setRows(rows);
  }
  function unduh(el, action, btn) { if (!el._jid) return U.toast('Pilih sesi asesmen.', 'err'); C.act(btn, action, { ID_Jadwal: el._jid }, { ok: false, timeout: 90000, done: function (r) { U.downloadB64(r.namaFile, r.mime, r.base64); U.toast('Berkas diunduh.', 'ok'); } }); }

  function lembar(el, row) {
    var m = U.modal({ title: row.Nama, subtitle: 'NISN ' + row.NISN + ' · ' + row.Kelas, width: 'max-w-3xl', buttons: [{ label: 'Tutup', onClick: function (x) { x.close(); } }, { label: 'Simpan Koreksi Esai', primary: true, id: 'lb-save', onClick: simpan }], body: h`<div data-lb class="text-on-surface-variant">Memuat lembar jawaban…</div>` });
    var data;
    $('#lb-save', m.el).hidden = true;
    Api.call('hasil.lembar', { ID_Hasil: row.ID_Hasil }).then(function (r) {
      if (!r.success) { U.mount($('[data-lb]', m.el), C.errorBox(r.message)); return; } data = r; var ur = r.butir.filter(function (b) { return b.jenis === 'URAIAN'; }).length; $('#lb-save', m.el).hidden = !ur;
      var hs = r.hasil;
      U.mount($('[data-lb]', m.el), h`<div class="grid grid-cols-3 gap-2 mb-3"><div class="p-3 rounded-lg bg-surface-container-low text-center"><div class="font-headline-md">${hs.nilai}</div><div class="font-label-sm text-on-surface-variant">Nilai Akhir</div></div><div class="p-3 rounded-lg bg-surface-container-low text-center"><div class="font-headline-md">${menit(hs.durasiDetik)}</div><div class="font-label-sm text-on-surface-variant">Durasi</div></div><div class="p-3 rounded-lg bg-surface-container-low text-center"><div class="font-headline-md text-[18px] leading-8">${hs.cara === 'waktu' ? 'Otomatis (waktu habis)' : 'Dikumpulkan siswa'}</div><div class="font-label-sm text-on-surface-variant">Cara</div></div></div>
        <div class="flex flex-col gap-3">${r.butir.map(function (b) {
          var jwb = b.jawaban, opsi = b.opsi || [];
          return h`<article class="rounded-lg border ${b.benar === true ? 'border-status-success-text/40' : b.benar === false ? 'border-status-error-text/40' : 'border-border-standard'} p-3"><div class="flex items-center gap-2 mb-1"><span class="w-7 h-7 rounded-md bg-surface-container text-primary inline-flex items-center justify-center font-tabular-code font-bold">${b.no}</span><span class="font-label-sm text-on-surface-variant">${b.jenis} · bobot ${b.bobot}</span><span class="ml-auto">${b.jenis === 'URAIAN' ? U.badge(b.skor === null ? 'Belum dikoreksi' : 'Skor ' + b.skor + '/' + b.bobot, b.skor === null ? 'warn' : 'ok') : b.benar ? U.badge('Benar', 'ok') : b.sebagian ? U.badge('Sebagian ' + b.skor + '/' + b.bobot, 'warn') : U.badge(jwb === null ? 'Kosong' : 'Salah', 'err')}</span></div>
            <div class="prose-soal text-body-md">${raw(b.stimulus || '')}</div>
            ${b.jenis === 'URAIAN' ? h`<div class="mt-2 p-2.5 rounded bg-surface-container-low whitespace-pre-wrap">${jwb === null ? '(tidak dijawab)' : jwb}</div><div class="mt-2 flex items-center gap-2"><label class="font-label-md" for="sk-${b.id}">Skor (0–${b.bobot})</label><input id="sk-${b.id}" data-skor="${b.id}" type="number" min="0" max="${b.bobot}" step="0.5" value="${b.skor === null ? '' : b.skor}" class="${U.INP} !w-24"></div>${b.kunci ? h`<details class="mt-2"><summary class="cursor-pointer font-label-md text-primary">Rubrik / kunci</summary><div class="prose-soal mt-1">${raw(b.kunci)}</div></details>` : ''}`
              : h`<div class="mt-2 flex flex-col gap-1">${opsi.map(function (o, i) { var L = String.fromCharCode(65 + i), kunci = String(b.kunci || '').split(','), pilih = b.jenis === 'BS' ? null : (Array.isArray(jwb) ? jwb : [jwb]).indexOf(L) >= 0, benar = b.jenis === 'BS' ? kunci[i] : kunci.indexOf(L) >= 0; var bs = b.jenis === 'BS' ? ((jwb || {})[i] || (Array.isArray(jwb) ? jwb[i] : '')) : ''; return h`<div class="flex items-start gap-2 px-2 py-1 rounded ${benar && b.jenis !== 'BS' ? 'bg-status-success-bg/70' : pilih ? 'bg-status-error-bg/60' : ''}"><span class="font-tabular-code font-bold w-5">${b.jenis === 'BS' ? i + 1 : L}</span><span class="flex-1 prose-soal">${raw(o)}</span>${b.jenis === 'BS' ? raw('<span class="font-label-sm whitespace-nowrap">Kunci ' + esc(benar === 'B' ? 'Benar' : 'Salah') + ' · Siswa ' + esc(bs === 'B' ? 'Benar' : bs === 'S' ? 'Salah' : '—') + '</span>') : pilih ? raw('<span class="font-label-sm">Dipilih</span>') : ''}</div>`; })}</div>`}
          </article>`; })}</div>`);
      U.math($('[data-lb]', m.el));
    });
    function simpan(x, btn) {
      var skor = {}; $$('[data-skor]', m.el).forEach(function (i) { if (i.value !== '') skor[i.dataset.skor] = +i.value; });
      C.act(btn, 'koreksi.simpan', { ID_Hasil: row.ID_Hasil, skor: skor }, { inv: ['rekap.', 'dash.'], msg: 'Koreksi disimpan.', done: function () { x.close(); load(el, true); } });
    }
  }
  reg('guru/rekap', 'guru'); reg('admin/rekap', 'admin');
})();
