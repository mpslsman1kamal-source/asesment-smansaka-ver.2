/* bank.js — Bank Soal Mandiri (bank_soal_mandiri) + Editor Butir Soal (editor_butir_soal); dipakai Guru & Admin */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$, $$ = U.$$;
  var JN = { PG: ['radio_button_checked', 'Pilihan Ganda'], PGK: ['checklist', 'PG Kompleks'], BS: ['rule', 'Benar / Salah'], URAIAN: ['description', 'Uraian / Esai'] };
  var STB = { 'Siap Diujikan': 'ok', 'Draft Penelaahan': 'warn', Diarsipkan: 'mute' };
  function htmlToText(s) { var d = document.createElement('div'); d.innerHTML = String(s || ''); return d.textContent || ''; }
  function kunciTampil(b) {
    if (b.Jenis === 'URAIAN') return '<span class="inline-flex items-center gap-1 text-on-surface-variant">' + U.str(U.ic('grading', 'text-[16px]')) + 'Koreksi manual</span>';
    if (!b.kunci) return '<span class="text-status-error-text">Belum ada kunci</span>';
    return '<span class="inline-flex items-center gap-1 font-tabular-code font-semibold text-status-success-text">' + U.str(U.ic('check_small', 'text-[16px]')) + esc(String(b.kunci).replace(/,/g, ', ')) + '</span>';
  }
  function pre(role) { return role === 'admin' ? 'admin' : 'guru'; }

  // ================= DAFTAR BUTIR =================
  function registerList(path, role) {
    App.register(path, {
      role: role, layout: 'staf', title: 'Bank Soal Mandiri',
      prefetch: function () { return [{ action: 'model.list', data: {} }]; },
      init: function (el) {
        U.mount(el, h`<div data-err hidden></div>
          ${C.head('Kelola Bank Soal', 'Daftar butir soal per paket: format, kunci jawaban, dan bobot nilai.', raw(U.str(C.btn('ghost', 'table_view', 'Impor Soal Excel (.xlsx)', 'id="b-imp"')) + U.str(C.btn('primary', 'add_circle', 'Buat Butir Soal Baru', 'id="b-new"'))))}
          <div id="b-stat" class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg"></div>
          <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg">
            <div class="flex flex-wrap items-center gap-2 mb-space-md"><span data-fp></span>${C.select('b-jn', [['', 'Tipe: Semua'], ['PG', 'Pilihan Ganda Tunggal'], ['PGK', 'Pilihan Ganda Kompleks'], ['BS', 'Benar / Salah'], ['URAIAN', 'Uraian / Esai']])}${C.select('b-st', [['', 'Status: Semua'], ['Siap Diujikan', 'Siap Diujikan'], ['Draft Penelaahan', 'Draft Penelaahan'], ['Diarsipkan', 'Diarsipkan']])}${C.search('b-q', 'Cari isi atau ID butir…')}<button id="b-rs" type="button" class="${U.BTN.ghost}">${U.ic('filter_alt_off', 'text-[18px]')}Reset</button></div>
            <div id="b-bar" hidden class="flex items-center gap-2 mb-space-md p-2.5 rounded-lg bg-primary-fixed/40"><span class="font-label-md px-2"><b id="b-n" class="font-tabular-code">0</b> dipilih</span><button id="b-del" class="${U.BTN.soft} !text-status-error-text">${U.ic('delete', 'text-[18px]')}Hapus</button></div>
            <div id="b-tv"></div></section>`);
        var tv, jf = '', sf = '';
        el._ap = function () { tv.setFilter(function (r) { return (!jf || r.Jenis === jf) && (!sf || r.Status === sf); }); };
        tv = new TableView({ el: $('#b-tv', el), rowId: 'ID_Soal', selectable: true, size: 10, searchKeys: ['ID_Soal', 'ringkas', 'Kategori'], emptyIcon: 'quiz', emptyText: 'Belum ada butir soal pada paket ini.',
          columns: [
            { key: 'Nomor', label: 'No', td: 'font-tabular-code', render: function (r) { return ('0' + r.Nomor).slice(-2); } },
            { key: 'ID_Soal', label: 'ID Butir Soal', td: 'font-tabular-code text-[12px] whitespace-nowrap' },
            { key: 'Jenis', label: 'Tipe Soal', td: 'whitespace-nowrap', render: function (r) { return raw('<span class="inline-flex items-center gap-1.5 font-label-md">' + U.str(U.ic(JN[r.Jenis][0], 'text-primary text-[18px]')) + esc(JN[r.Jenis][1]) + '</span>'); } },
            { key: 'ringkas', label: 'Penggalan Soal & Stimulus', td: 'max-w-md', render: function (r) { return raw('<div class="line-clamp-2 font-body-md">' + esc(r.ringkas || '—') + '</div><div class="mt-1 flex gap-1.5">' + (r.Kategori ? '<span class="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-on-surface-variant">' + esc(r.Kategori) + '</span>' : '') + '<span class="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-on-surface-variant">' + esc(r.Tingkat || '') + '</span></div>'); } },
            { key: 'kunci', label: 'Kunci / Jawaban Benar', render: function (r) { return raw(kunciTampil(r)); } },
            { key: 'Bobot', label: 'Bobot', td: 'font-tabular-code whitespace-nowrap', render: function (r) { return r.Bobot + ' Poin'; } },
            { key: 'Status', label: 'Status', render: function (r) { return U.badge(r.Status, STB[r.Status] || 'mute'); } },
            { key: 'Diubah', label: 'Terakhir Diedit', td: 'font-body-sm text-on-surface-variant whitespace-nowrap', render: function (r) { return String(r.Diubah || '').replace(' ', ' · '); } },
            { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function () { return raw(U.str(C.iconBtn('edit', 'edit_note', 'Ubah')) + U.str(C.iconBtn('del', 'delete', 'Hapus', 'danger'))); } }],
          onSelect: function (ids) { $('#b-bar', el).hidden = !ids.length; $('#b-n', el).textContent = ids.length; },
          onAction: function (a, r) {
            if (a === 'edit') App.go(pre(role) + '/editor?paket=' + encodeURIComponent(el._pid) + '&id=' + encodeURIComponent(r.ID_Soal));
            else if (a === 'del') hapus([r.ID_Soal]);
          } });
        function hapus(ids) { U.confirm({ title: 'Hapus ' + ids.length + ' butir?', message: 'Butir soal dihapus permanen dari paket.', ok: 'Hapus', danger: true }).then(function (y) { if (y) C.act(null, 'soal.delete', { ids: ids }, { inv: ['soal.', 'model.', 'dash.'], done: function () { tv.clearSel(); el._reload(); } }); }); }
        $('#b-del', el).onclick = function () { hapus(tv.selected()); };
        $('#b-jn', el).onchange = function () { jf = this.value; el._ap(); };
        $('#b-st', el).onchange = function () { sf = this.value; el._ap(); };
        $('#b-q', el).oninput = U.debounce(function () { tv.setQuery(this.value); }, 150);
        $('#b-rs', el).onclick = function () { jf = sf = ''; $('#b-jn', el).value = $('#b-st', el).value = $('#b-q', el).value = ''; tv.setQuery(''); el._ap(); };
        $('#b-new', el).onclick = function () { if (!el._pid) return U.toast('Pilih paket soal terlebih dahulu.', 'err'); App.go(pre(role) + '/editor?paket=' + encodeURIComponent(el._pid)); };
        $('#b-imp', el).onclick = function () {
          if (!el._pid) return U.toast('Pilih paket soal terlebih dahulu.', 'err');
          C.importFlow({ judul: 'Impor Soal Excel — ' + el._pid, kunci: 'Nomor (per paket)', action: 'soal.import', chunk: 100, extra: { ID_Paket: el._pid }, inv: ['soal.', 'model.', 'dash.'], namaTemplate: 'template-soal.xlsx',
            header: ['Nomor', 'Jenis', 'Soal', 'A', 'B', 'C', 'D', 'E', 'Kunci', 'Bobot', 'Kategori', 'Tingkat', 'CP', 'Pembahasan', 'Status'],
            contoh: [[1, 'PG', 'Ibu kota Indonesia adalah…', 'Bandung', 'Jakarta', 'Surabaya', 'Medan', 'Makassar', 'B', 2, 'Geografi', 'Mudah', '', '', 'Siap Diujikan'], [2, 'PGK', 'Pilih bilangan prima:', '2', '4', '5', '9', '', 'A,C', 3, '', 'Sedang', '', '', 'Draft Penelaahan'], [3, 'BS', 'Tentukan Benar (B) atau Salah (S) tiap pernyataan.', 'Bumi bulat', 'Matahari mengelilingi Bumi', '', '', '', 'B,S', 4, '', 'Sedang', '', '', 'Draft Penelaahan'], [4, 'URAIAN', 'Jelaskan proses fotosintesis.', '', '', '', '', '', 'Rubrik: klorofil, cahaya, CO2, glukosa', 10, '', 'Sukar', '', '', 'Siap Diujikan']],
            map: function (r) { return { Nomor: C.pick(r, ['Nomor', 'No']), Jenis: C.pick(r, ['Jenis', 'Tipe']), Soal: C.pick(r, ['Soal', 'Pertanyaan']), A: C.pick(r, ['A']), B: C.pick(r, ['B']), C: C.pick(r, ['C']), D: C.pick(r, ['D']), E: C.pick(r, ['E']), F: C.pick(r, ['F']), G: C.pick(r, ['G']), H: C.pick(r, ['H']), Kunci: C.pick(r, ['Kunci', 'Kunci Jawaban']), Bobot: C.pick(r, ['Bobot']), Kategori: C.pick(r, ['Kategori']), Tingkat: C.pick(r, ['Tingkat']), CP: C.pick(r, ['CP']), Pembahasan: C.pick(r, ['Pembahasan']), Status: C.pick(r, ['Status']) }; }, done: function () { el._reload(); } });
        };
        el._tv = tv;
      },
      show: function (el, ctx) {
        var want = (ctx.query && ctx.query.paket) || el._pid || '';
        var paketUI = function (r) {
          var list = r.paket || [], ok = list.some(function (p) { return p.ID_Paket === want; }); if (!ok) want = list.length ? list[0].ID_Paket : '';
          $('[data-fp]', el).innerHTML = U.str(C.select('b-pk', list.map(function (p) { return [p.ID_Paket, 'Paket: ' + p.ID_Paket + ' — ' + p.Nama]; }).concat(list.length ? [] : [['', 'Belum ada paket soal']]), 'max-w-xs'));
          var sel = $('#b-pk', el); sel.value = want; sel.onchange = function () { want = this.value; setPaket(); };
          if (want !== el._pid) setPaket();
        };
        function setPaket() { el._pid = want; if (!want) { el._tv.setRows([]); return; } el._reload(); }
        el._reload = function () { if (!el._pid) return; var pid = el._pid; Api.swr('soal.list', { paketId: pid }, function (r) { if (pid !== el._pid) return; if (r.success) { el._tv.setRows(r.soal); stat(r); } else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } }, { force: true, ttl: 0 }); };
        function stat(r) {
          var s = r.soal.filter(function (x) { return x.Status !== 'Diarsipkan'; }), jn = {}, bob = 0, lengkap = 0; s.forEach(function (x) { jn[x.Jenis] = (jn[x.Jenis] || 0) + 1; bob += +x.Bobot || 0; if (x.Jenis === 'URAIAN' || x.kunci) lengkap++; });
          var pct = s.length ? Math.round(lengkap / s.length * 100) : 0, tot = s.length;
          U.mount($('#b-stat', el), h`${C.stat({ label: 'Total Butir Soal', value: tot, icon: 'quiz', foot: r.paket.Nama, footKind: 'info' })}${C.stat({ label: 'Proporsi Tipe Soal', value: Object.keys(jn).length || 0, icon: 'pie_chart', foot: Object.keys(JN).filter(function (k) { return jn[k]; }).map(function (k) { return jn[k] + ' ' + k; }).join(' · ') || '—', footKind: 'mute' })}${C.stat({ label: 'Total Bobot Penilaian', value: Math.round(bob * 100) / 100, icon: 'lock_reset', foot: Math.abs(bob - 100) < 0.01 ? 'Pas 100 poin' : 'Skor dinormalkan ke 100', footKind: Math.abs(bob - 100) < 0.01 ? 'ok' : 'warn' })}${C.stat({ label: 'Kesiapan Kunci Jawaban', value: pct + '%', icon: 'task_alt', foot: pct === 100 ? 'Siap rilis' : (tot - lengkap) + ' butir belum berkunci', footKind: pct === 100 ? 'ok' : 'warn' })}`);
        }
        Api.swr('model.list', {}, function (r) { if (r.success) paketUI(r); });
      }
    });
  }

  // ================= EDITOR =================
  var DRAFT_KEY = 'cbt.editor.draft.';
  function registerEditor(path, role) {
    App.register(path, {
      role: role, layout: 'staf', title: 'Editor Butir Soal',
      init: function (el) { el.innerHTML = '<div data-root></div>'; },
      show: function (el, ctx) {
        var pid = ctx.query.paket || '', id = ctx.query.id || '';
        el._sig = pid + '|' + id; var root = $('[data-root]', el);
        if (!pid) { App.go(pre(role) + '/' + (role === 'admin' ? 'butir' : 'bank-soal'), true); return; }
        U.mount(root, h`<div class="h-64 rounded-xl bg-surface-container-low animate-pulse"></div>`);
        var sig = el._sig;
        var pP = Api.call('soal.list', { paketId: pid }), pB = id ? Api.call('soal.get', { ID_Soal: id }) : Promise.resolve({ success: true, butir: null });
        Promise.all([pP, pB]).then(function (rs) {
          if (sig !== el._sig) return;
          if (!rs[0].success) { U.mount(root, C.errorBox(rs[0].message)); return; }
          if (!rs[1].success) { U.mount(root, C.errorBox(rs[1].message)); return; }
          build(el, root, role, pid, rs[0], rs[1].butir);
        });
      }
    });
  }

  function build(el, root, role, pid, list, b) {
    var P = pre(role), edit = !!b, paket = list.paket, soal = list.soal;
    var nextNo = soal.reduce(function (m, s) { return Math.max(m, s.Nomor); }, 0) + 1;
    var st = b ? { Jenis: b.Jenis, stim: b.isi.stimulus || '', opsi: (b.isi.opsi || []).map(htmlToText), gambar: b.isi.gambar || '', Kunci: b.Kunci, Bobot: b.Bobot, Tingkat: b.Tingkat || 'Sedang', Kategori: b.Kategori || '', CP: b.CP || '', Tag: b.Tag || '', Pemb: b.Pembahasan || '', Status: b.Status || 'Draft Penelaahan', Nomor: b.Nomor }
      : { Jenis: 'PG', stim: '', opsi: ['', '', '', ''], gambar: '', Kunci: '', Bobot: paket.BobotDefault || 2, Tingkat: 'Sedang', Kategori: '', CP: '', Tag: '', Pemb: '', Status: 'Draft Penelaahan', Nomor: nextNo };
    var dk = DRAFT_KEY + pid + '.' + (b ? b.ID_Soal : 'baru');
    try { var dr = JSON.parse(localStorage.getItem(dk) || 'null'); if (dr && dr.t > Date.now() - 86400000 * 3) { st = Object.assign(st, dr.s); el._draftNote = dr.t; } } catch (e) { }
    var dirty = false;

    function kunciSet() { return String(st.Kunci || '').split(',').filter(Boolean); }
    function huruf(i) { return String.fromCharCode(65 + i); }
    function simpanLokal() { try { localStorage.setItem(dk, JSON.stringify({ t: Date.now(), s: st })); } catch (e) { } }
    function validasi() {
      var o = [], j = st.Jenis, teks = htmlToText(st.stim).trim();
      o.push([!!teks || /<img/i.test(st.stim), 'Redaksi soal terisi dan terbaca jelas']);
      if (st.gambar) o.push([/^https:\/\//.test(st.gambar), 'Stimulus gambar tersimpan di Drive']);
      if (j !== 'URAIAN') {
        var n = st.opsi.filter(function (x) { return x.trim(); }).length;
        o.push([j === 'BS' ? n >= 1 : n >= 2, j === 'BS' ? 'Pernyataan terisi (' + n + ')' : 'Opsi pilihan jawaban lengkap (' + n + ' opsi)']);
        var k = kunciSet(), ok = j === 'PG' ? k.length === 1 : j === 'PGK' ? k.length >= 1 : (k.length === st.opsi.length && k.every(function (x) { return x === 'B' || x === 'S'; }));
        o.push([ok, j === 'BS' ? 'Benar/Salah tiap pernyataan ditentukan' : 'Kunci jawaban telah ditentukan' + (k.length ? ' (' + k.join(', ') + ')' : '')]);
      } else o.push([htmlToText(st.Kunci).trim().length > 0, 'Rubrik / kunci jawaban uraian terisi']);
      o.push([+st.Bobot > 0 && +st.Bobot <= 100, 'Bobot angka tervalidasi (' + (+st.Bobot || 0) + ' poin)']);
      return o;
    }

    function draw() {
      var j = st.Jenis, val = validasi(), semua = val.every(function (x) { return x[0]; });
      U.mount(root, h`
      <div class="flex flex-col gap-space-lg max-w-6xl">
        ${C.head('Editor Butir Soal & Kunci Jawaban', paket.Mapel + ' — Paket ' + pid + (edit ? ' · ' + b.ID_Soal : ' · Butir baru'), raw(
          U.str(C.btn('ghost', 'visibility', 'Pratinjau Tampilan Siswa', 'data-e="prev"')) + U.str(C.btn('primary', 'cloud_sync', 'Simpan Butir Soal', 'data-e="save"'))))}
        ${el._draftNote ? h`<div class="p-3 rounded-lg bg-status-info-bg text-status-info-text font-body-sm flex items-center gap-2">${U.ic('history', 'text-[18px]')}Draf lokal yang belum disimpan dipulihkan (${U.tgl(new Date(el._draftNote).toISOString().slice(0, 10))}). <button type="button" data-e="buang" class="underline font-semibold ml-auto">Buang draf</button></div>` : ''}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-space-lg items-start">
          <div class="lg:col-span-2 flex flex-col gap-space-lg">
            <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm mb-space-sm flex items-center gap-2"><span class="w-7 h-7 rounded-full bg-primary-container text-on-primary inline-flex items-center justify-center font-label-md">1</span>Tipe Soal & Naskah Pertanyaan</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-space-md" role="radiogroup" aria-label="Tipe penilaian soal">${Object.keys(JN).map(function (k) { return h`<button type="button" role="radio" aria-checked="${j === k}" data-jenis="${k}" class="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border font-label-md transition-colors ${j === k ? 'border-primary-container bg-primary-fixed/50 text-primary' : 'border-border-standard text-on-surface-variant hover:bg-surface-container-low'}">${U.ic(JN[k][0], 'text-[18px]')}${JN[k][1]}</button>`; })}</div>
              <label class="block font-label-md mb-1">Teks Stimulus & Redaksi Soal <span class="text-error">*</span></label>
              <div class="flex flex-wrap gap-1 p-1.5 rounded-t-lg bg-surface-container-low border border-b-0 border-border-standard">${[['bold', 'format_bold'], ['italic', 'format_italic'], ['underline', 'format_underlined'], ['strikeThrough', 'strikethrough_s'], ['superscript', 'superscript'], ['subscript', 'subscript'], ['insertUnorderedList', 'format_list_bulleted'], ['insertOrderedList', 'format_list_numbered']].map(function (t) { return h`<button type="button" data-cmd="${t[0]}" aria-label="${t[0]}" class="p-1.5 rounded hover:bg-surface-container">${U.ic(t[1], 'text-[18px]')}</button>`; })}<button type="button" data-cmd="rumus" class="px-2 py-1 rounded hover:bg-surface-container font-label-md inline-flex items-center gap-1">${U.ic('function', 'text-[18px]')}Formula fx</button><span class="ml-auto self-center font-label-sm text-on-surface-variant pr-1">Rumus: \\( x^2 + 1 \\)</span></div>
              <div id="e-stim" contenteditable="true" role="textbox" aria-multiline="true" class="min-h-[140px] rounded-b-lg border border-border-standard bg-surface-card px-3 py-2.5 text-body-md outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 prose-soal"></div>
              <div class="mt-space-md"><div class="font-label-md mb-1">Stimulus Gambar / Diagram <span class="text-on-surface-variant font-normal">(opsional)</span></div>
                ${st.gambar ? h`<div class="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low"><img src="${st.gambar}" alt="Stimulus" class="w-40 max-h-32 object-contain rounded bg-white border border-border-standard"><div class="flex-1 font-body-sm text-on-surface-variant">${U.badge('Tersinkronisasi', 'ok', true)}<p class="mt-1">Tersimpan di Google Drive.</p><div class="mt-2 flex gap-2"><button type="button" data-e="gambar" class="${U.BTN.ghost}">Ganti Gambar</button><button type="button" data-e="hapusgambar" class="${U.BTN.ghost} !text-status-error-text">Hapus</button></div></div></div>`
                  : h`<button type="button" data-e="gambar" class="w-full flex flex-col items-center gap-1 py-6 rounded-lg border-2 border-dashed border-border-standard text-on-surface-variant hover:bg-surface-container-low">${U.ic('add_photo_alternate', 'text-[28px] text-primary')}<span class="font-label-md">Unggah gambar (PNG/JPG/WebP, maks. 2 MB)</span></button>`}</div></section>

            <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm mb-space-sm flex items-center gap-2"><span class="w-7 h-7 rounded-full bg-primary-container text-on-primary inline-flex items-center justify-center font-label-md">2</span>${j === 'URAIAN' ? 'Rubrik & Kunci Jawaban' : j === 'BS' ? 'Pernyataan & Kunci Benar/Salah' : 'Opsi Pilihan Jawaban & Kunci'}</h2>
              ${j === 'URAIAN' ? h`<p class="font-body-sm text-on-surface-variant mb-2">Uraian dikoreksi manual oleh guru. Tulis rubrik/jawaban acuan sebagai panduan penilaian.</p><div id="e-kunci" contenteditable="true" class="min-h-[100px] rounded-lg border border-border-standard px-3 py-2.5 text-body-md outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"></div>`
                : h`<p class="font-body-sm text-on-surface-variant mb-2">${j === 'PG' ? 'Pilih satu opsi sebagai kunci. Poin penuh bila siswa memilih opsi tersebut.' : j === 'PGK' ? 'Centang semua opsi yang benar. Poin penuh hanya bila pilihan siswa persis sama dengan kunci.' : 'Tentukan Benar atau Salah untuk setiap pernyataan. Nilai dihitung proporsional per pernyataan.'}</p>
                <div class="flex flex-col gap-2" id="e-opsi">${st.opsi.map(function (t, i) { var k = kunciSet(), on = j === 'BS' ? k[i] : k.indexOf(huruf(i)) >= 0; return h`<div class="flex items-center gap-2 p-2 rounded-lg ${on && j !== 'BS' ? 'bg-status-success-bg/60 ring-1 ring-status-success-text/30' : 'bg-surface-container-low'}"><span class="w-7 h-7 shrink-0 rounded-md bg-surface-card inline-flex items-center justify-center font-tabular-code font-bold text-primary">${j === 'BS' ? i + 1 : huruf(i)}</span><input data-o="${i}" value="${t}" placeholder="${j === 'BS' ? 'Pernyataan' : 'Teks opsi'} ${j === 'BS' ? i + 1 : huruf(i)}" class="${U.INP} flex-1">
                  ${j === 'BS' ? h`<div class="inline-flex rounded-lg overflow-hidden border border-border-standard shrink-0"><button type="button" data-bs="${i}:B" class="px-3 py-1.5 font-label-md ${k[i] === 'B' ? 'bg-status-success-text text-white' : 'bg-surface-card text-on-surface-variant'}">Benar</button><button type="button" data-bs="${i}:S" class="px-3 py-1.5 font-label-md ${k[i] === 'S' ? 'bg-status-error-text text-white' : 'bg-surface-card text-on-surface-variant'}">Salah</button></div>`
                    : h`<button type="button" data-key="${i}" aria-label="Jadikan kunci" aria-pressed="${on}" class="shrink-0 p-1.5 rounded-lg ${on ? 'text-status-success-text' : 'text-outline hover:text-primary'}">${U.ic(on ? (j === 'PG' ? 'check_circle' : 'check_box') : (j === 'PG' ? 'radio_button_unchecked' : 'check_box_outline_blank'), 'text-[24px] fill')}</button>`}
                  <button type="button" data-rm="${i}" aria-label="Hapus" class="shrink-0 p-1.5 rounded-lg text-outline hover:text-status-error-text">${U.ic('delete', 'text-[20px]')}</button></div>`; })}</div>
                <button type="button" data-e="addopsi" class="mt-2 ${U.BTN.soft}" ${st.opsi.length >= 8 ? 'disabled' : ''}>${U.ic('add_circle', 'text-[18px]')}Tambah ${j === 'BS' ? 'Pernyataan' : 'Pilihan Jawaban'}</button>`}</section>

            <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><h2 class="font-headline-sm mb-1 flex items-center gap-2"><span class="w-7 h-7 rounded-full bg-primary-container text-on-primary inline-flex items-center justify-center font-label-md">3</span>Pembahasan / Penjelasan Jawaban</h2><p class="font-body-sm text-on-surface-variant mb-2">Hanya untuk guru dan remedial; tidak ditampilkan kepada siswa saat ujian.</p>
              <div id="e-pemb" contenteditable="true" class="min-h-[90px] rounded-lg border border-border-standard px-3 py-2.5 text-body-md outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"></div></section>
          </div>

          <aside class="flex flex-col gap-space-md lg:sticky lg:top-24">
            <section class="bg-surface-card rounded-xl shadow-sm p-space-md"><h3 class="font-headline-sm mb-space-sm">Parameter Soal & Bobot</h3>
              <div class="grid grid-cols-2 gap-3">${U.field({ name: 'Nomor', label: 'Nomor Urut', type: 'number', value: st.Nomor, attrs: 'min="1" data-p="Nomor"' })}${U.field({ name: 'Bobot', label: 'Bobot (Poin)', type: 'number', value: st.Bobot, attrs: 'min="0.5" max="100" step="0.5" data-p="Bobot"' })}</div>
              <p class="font-body-sm text-on-surface-variant mt-1">Skor akhir dinormalkan ke skala 100 dari total bobot paket.</p>
              <div class="mt-3"><span class="block font-label-md mb-1">Tingkat Kesulitan</span><div class="grid grid-cols-3 gap-1.5">${['Mudah', 'Sedang', 'Sukar'].map(function (t) { return h`<button type="button" data-tk="${t}" class="py-1.5 rounded-lg font-label-md ${st.Tingkat === t ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}">${t}</button>`; })}</div></div>
              <div class="mt-3 grid gap-3">${U.field({ name: 'Kategori', label: 'Kategori / Topik', value: st.Kategori, attrs: 'data-p="Kategori"' })}${U.field({ name: 'CP', label: 'Capaian Pembelajaran (CP / KD)', type: 'textarea', rows: 2, value: st.CP, attrs: 'data-p="CP"' })}${U.field({ name: 'Tag', label: 'Tag & Indikator', value: st.Tag, placeholder: '#Pythagoras, #Trapesium', attrs: 'data-p="Tag"' })}
                ${U.field({ name: 'Status', label: 'Status Butir', type: 'select', value: st.Status, options: ['Siap Diujikan', 'Draft Penelaahan', 'Diarsipkan'], attrs: 'data-p="Status"' })}</div></section>
            <section class="bg-surface-card rounded-xl shadow-sm p-space-md"><h3 class="font-headline-sm mb-space-sm">Status Validasi Kesiapan</h3><ul class="flex flex-col gap-1.5 font-body-sm">${val.map(function (v) { return h`<li class="flex items-start gap-2 ${v[0] ? 'text-on-surface' : 'text-status-error-text'}">${U.ic(v[0] ? 'check' : 'close', 'text-[18px] ' + (v[0] ? 'text-status-success-text' : ''))}<span>${v[1]}</span></li>`; })}</ul>
              <div class="mt-3 p-2.5 rounded-lg ${semua ? 'bg-status-success-bg text-status-success-text' : 'bg-status-warning-bg text-status-warning-text'} font-label-md flex items-center gap-2">${U.ic(semua ? 'task_alt' : 'warning', 'text-[20px]')}${semua ? 'SIAP DISIMPAN' : 'Lengkapi prasyarat di atas'}</div></section>
            <div class="flex flex-col gap-2"><button type="button" data-e="lanjut" class="${U.BTN.primary} w-full">Simpan & Lanjut ke Soal Berikutnya ${U.ic('arrow_forward', 'text-[18px]')}</button><div class="grid grid-cols-2 gap-2"><button type="button" data-e="draf" class="${U.BTN.ghost}">Simpan Draf</button><button type="button" data-e="batal" class="${U.BTN.ghost}">Batal / Kembali</button></div></div>
          </aside>
        </div>
      </div>`);
      $('#e-stim', root).innerHTML = st.stim || '';
      var k = $('#e-kunci', root); if (k) k.innerHTML = st.Kunci || '';
      $('#e-pemb', root).innerHTML = st.Pemb || '';
    }

    function readRich() { var s = $('#e-stim', root), k = $('#e-kunci', root), p = $('#e-pemb', root); if (s) st.stim = s.innerHTML; if (k) st.Kunci = k.innerHTML; if (p) st.Pemb = p.innerHTML; }
    function readOpsi() { $$('[data-o]', root).forEach(function (i) { st.opsi[+i.dataset.o] = i.value; }); }
    function refreshVal() { readRich(); readOpsi(); dirty = true; simpanLokal(); var keep = document.activeElement, id = keep && keep.id, o = keep && keep.dataset && keep.dataset.o, pos = keep && keep.selectionStart; draw(); if (id) { var n = $('#' + id, root); n && n.focus(); } else if (o !== undefined) { var m = $('[data-o="' + o + '"]', root); if (m) { m.focus(); try { m.setSelectionRange(pos, pos); } catch (e) { } } } }
    draw();

    var tm; root.addEventListener('input', function (e) {
      if (e.target.matches('[data-p]')) { st[e.target.dataset.p] = e.target.value; dirty = true; simpanLokal(); if (e.target.dataset.p === 'Bobot') { clearTimeout(tm); tm = setTimeout(refreshVal, 400); } return; }
      if (e.target.matches('[data-o],#e-stim,#e-kunci,#e-pemb')) { readRich(); readOpsi(); dirty = true; simpanLokal(); clearTimeout(tm); tm = setTimeout(function () { var val = validasi(); /* perbarui daftar saja */ var ul = $('aside ul', root); if (ul) ul.innerHTML = val.map(function (v) { return '<li class="flex items-start gap-2 ' + (v[0] ? 'text-on-surface' : 'text-status-error-text') + '">' + U.str(U.ic(v[0] ? 'check' : 'close', 'text-[18px] ' + (v[0] ? 'text-status-success-text' : ''))) + '<span>' + esc(v[1]) + '</span></li>'; }).join(''); }, 250); }
    });
    root.addEventListener('change', function (e) { if (e.target.matches('[data-p="Status"],[data-p="Nomor"],[data-p="CP"],[data-p="Kategori"],[data-p="Tag"]')) { st[e.target.dataset.p] = e.target.value; dirty = true; simpanLokal(); } });
    root.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.jenis) { readRich(); readOpsi(); if (t.dataset.jenis !== st.Jenis) { st.Jenis = t.dataset.jenis; st.Kunci = ''; if (st.Jenis === 'BS' && st.opsi.length < 2) st.opsi = ['', '']; if (st.Jenis !== 'BS' && st.opsi.length < 4 && st.Jenis !== 'URAIAN') while (st.opsi.length < 4) st.opsi.push(''); } dirty = true; simpanLokal(); draw(); return; }
      if (t.dataset.cmd) { var c = t.dataset.cmd; $('#e-stim', root).focus(); if (c === 'rumus') document.execCommand('insertText', false, '\\(x^2\\)'); else document.execCommand(c); readRich(); return; }
      if (t.dataset.key !== undefined) { readRich(); readOpsi(); var L = huruf(+t.dataset.key), k = kunciSet(); if (st.Jenis === 'PG') k = [L]; else { var ix = k.indexOf(L); if (ix >= 0) k.splice(ix, 1); else k.push(L); k.sort(); } st.Kunci = k.join(','); refreshVal(); return; }
      if (t.dataset.bs) { readRich(); readOpsi(); var p = t.dataset.bs.split(':'), arr = kunciSet(); while (arr.length < st.opsi.length) arr.push(''); arr[+p[0]] = p[1]; st.Kunci = arr.slice(0, st.opsi.length).join(','); refreshVal(); return; }
      if (t.dataset.rm !== undefined) { readRich(); readOpsi(); var i = +t.dataset.rm; if (st.opsi.length <= (st.Jenis === 'BS' ? 1 : 2)) return U.toast('Jumlah minimum tercapai.', 'err'); if (st.Jenis === 'BS') { var a = kunciSet(); a.splice(i, 1); st.Kunci = a.join(','); } else { var kk = kunciSet().filter(function (x) { return x !== huruf(i); }).map(function (x) { return x.charCodeAt(0) - 65 > i ? String.fromCharCode(x.charCodeAt(0) - 1) : x; }); st.Kunci = kk.join(','); } st.opsi.splice(i, 1); refreshVal(); return; }
      if (t.dataset.tk) { st.Tingkat = t.dataset.tk; readRich(); readOpsi(); dirty = true; simpanLokal(); draw(); return; }
      var a = t.dataset.e; if (!a) return;
      if (a === 'addopsi') { readRich(); readOpsi(); if (st.opsi.length < 8) { st.opsi.push(''); if (st.Jenis === 'BS') st.Kunci = kunciSet().concat(['']).join(','); } refreshVal(); }
      else if (a === 'gambar') pilihGambar();
      else if (a === 'hapusgambar') { st.gambar = ''; readRich(); readOpsi(); dirty = true; draw(); }
      else if (a === 'buang') { try { localStorage.removeItem(dk); } catch (e2) { } el._draftNote = 0; App.go(P + '/editor?paket=' + encodeURIComponent(pid) + (b ? '&id=' + encodeURIComponent(b.ID_Soal) : '') + '&r=' + Date.now()); }
      else if (a === 'batal') { if (dirty) U.confirm({ title: 'Tinggalkan editor?', message: 'Perubahan yang belum disimpan tetap tersimpan sebagai draf lokal di perangkat ini.', ok: 'Kembali' }).then(function (y) { if (y) App.go(P + '/' + (role === 'admin' ? 'butir' : 'bank-soal') + '?paket=' + encodeURIComponent(pid)); }); else App.go(P + '/' + (role === 'admin' ? 'butir' : 'bank-soal') + '?paket=' + encodeURIComponent(pid)); }
      else if (a === 'prev') preview();
      else if (a === 'save') simpan(t, false, false);
      else if (a === 'draf') simpan(t, true, false);
      else if (a === 'lanjut') simpan(t, false, true);
    });

    function pilihGambar() {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif';
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return; if (f.size > 8 * 1024 * 1024) return U.toast('Berkas terlalu besar.', 'err');
        U.toast('Mengunggah gambar…', 'info', 1500);
        kecil(f).then(function (x) { return Api.call('soal.upload', { mime: x.mime, base64: x.b64 }); }).then(function (r) { if (!r.success) return U.toast(r.message, 'err'); readRich(); readOpsi(); st.gambar = r.url; dirty = true; simpanLokal(); draw(); U.toast('Gambar tersimpan di Drive.', 'ok'); }).catch(function () { U.toast('Gambar tidak dapat diproses.', 'err'); });
      }; inp.click();
    }
    function kecil(f) {
      return new Promise(function (res, rej) {
        var im = new Image(), u = URL.createObjectURL(f);
        im.onload = function () { var m = 1200, w = im.width, hh = im.height, sc = Math.min(1, m / Math.max(w, hh)), c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(hh * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); var mime = f.type === 'image/png' ? 'image/png' : 'image/jpeg'; var d = c.toDataURL(mime, 0.85); res({ mime: mime, b64: d.split(',')[1] }); };
        im.onerror = rej; im.src = u;
      });
    }
    function preview() {
      readRich(); readOpsi(); var j = st.Jenis;
      var m = U.modal({ title: 'Pratinjau Tampilan Ujian Siswa', subtitle: 'Soal No. ' + st.Nomor + ' · Bobot: ' + st.Bobot + ' poin', width: 'max-w-3xl', buttons: [{ label: 'Tutup Pratinjau', primary: true, onClick: function (x) { x.close(); } }],
        body: h`<div class="prose-soal font-body-lg leading-relaxed">${raw(st.stim)}</div>${st.gambar ? h`<img src="${st.gambar}" alt="" class="my-3 max-h-64 rounded border border-border-standard">` : ''}
          ${j === 'URAIAN' ? raw('<div class="mt-3 h-32 rounded-lg border border-border-standard bg-surface-container-low p-3 text-on-surface-variant">Ketik jawaban Anda di sini…</div>') : h`<div class="mt-3 flex flex-col gap-2">${st.opsi.filter(function (x) { return x.trim(); }).map(function (t, i) { return h`<div class="flex items-center gap-3 p-3 rounded-lg border border-border-standard"><span class="w-8 h-8 rounded-full bg-surface-container inline-flex items-center justify-center font-tabular-code font-bold">${j === 'BS' ? '' : huruf(i)}</span><span class="flex-1">${t}</span>${j === 'BS' ? raw('<span class="text-on-surface-variant font-label-md">Benar / Salah</span>') : ''}</div>`; })}</div>`}` });
      U.math(m.body);
    }
    function simpan(btn, draf, lanjut) {
      readRich(); readOpsi();
      var gagal = validasi().filter(function (v) { return !v[0]; });
      if (!draf && gagal.length) { U.toast(gagal[0][1] + ' — belum terpenuhi.', 'err'); return; }
      if (draf && !htmlToText(st.stim).trim() && !/<img/i.test(st.stim)) { U.toast('Isi redaksi soal terlebih dahulu.', 'err'); return; }
      var status = draf ? 'Draft Penelaahan' : (st.Status === 'Draft Penelaahan' && lanjut ? 'Siap Diujikan' : st.Status);
      var opsi = st.Jenis === 'URAIAN' ? [] : st.opsi.map(function (t) { return '<p>' + esc(t.trim()) + '</p>'; });
      var kunci = st.Kunci;
      if (st.Jenis !== 'URAIAN') { var keepIdx = []; st.opsi.forEach(function (t, i) { if (t.trim()) keepIdx.push(i); }); opsi = keepIdx.map(function (i) { return '<p>' + esc(st.opsi[i].trim()) + '</p>'; }); if (st.Jenis === 'BS') kunci = keepIdx.map(function (i) { return kunciSet()[i] || ''; }).join(','); else kunci = kunciSet().map(function (L) { var oi = L.charCodeAt(0) - 65, n = keepIdx.indexOf(oi); return n >= 0 ? huruf(n) : ''; }).filter(Boolean).join(','); }
      var d = { ID_Paket: pid, Jenis: st.Jenis, isi: { stimulus: st.stim, opsi: opsi, gambar: st.gambar }, Kunci: kunci, Bobot: +st.Bobot, Kategori: st.Kategori, Tingkat: st.Tingkat, CP: st.CP, Tag: st.Tag, Pembahasan: st.Pemb, Status: status, Nomor: +st.Nomor || undefined };
      if (b) d.ID_Soal = b.ID_Soal;
      C.act(btn, 'soal.save', d, { inv: ['soal.', 'model.', 'dash.'], msg: draf ? 'Draf butir disimpan.' : 'Butir soal disimpan.', done: function (r) {
        dirty = false; try { localStorage.removeItem(dk); } catch (e) { } el._draftNote = 0;
        if (lanjut) App.go(P + '/editor?paket=' + encodeURIComponent(pid) + '&r=' + Date.now());
        else App.go(P + '/editor?paket=' + encodeURIComponent(pid) + '&id=' + encodeURIComponent(r.ID_Soal) + '&r=' + Date.now());
      } });
    }
  }

  registerList('guru/bank-soal', 'guru'); registerList('admin/butir', 'admin');
  registerEditor('guru/editor', 'guru'); registerEditor('admin/editor', 'admin');
})();
