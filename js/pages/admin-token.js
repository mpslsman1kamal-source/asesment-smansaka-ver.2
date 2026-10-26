/* admin-token.js — Kelola Token Akses Ujian (token_ujian) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$, $$ = U.$$;
  function mmss(s) { s = Math.max(0, Math.floor(s)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); }
  function stToken(t) {
    if (t.status === 'Selesai') return U.badge('Kedaluwarsa', 'mute');
    if (t.TokenKunci) return U.badge('Terkunci', 'err', true);
    if (t.bisaDipakai) return U.badge('Aktif / Terbuka', 'ok', 'pulse');
    return U.badge(t.TokenAktif ? 'Menunggu Jadwal' : 'Belum Dirilis', 'warn', true);
  }
  App.register('admin/token', {
    role: 'admin', layout: 'staf', title: 'Token Ujian',
    prefetch: function () { return [{ action: 'token.list', data: {} }]; },
    init: function (el) {
      el._pick = '';
      U.mount(el, h`<div data-err hidden></div>
        ${C.head('Kelola Token Akses Ujian', 'Kode token per sesi, kontrol masa aktif, dan proteksi anti-bocor.', raw(U.str(C.btn('primary', 'broadcast_on_home', 'Rilis Semua Token Hari Ini', 'id="t-all"'))))}
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-space-lg mb-space-lg"><div id="t-live" class="xl:col-span-2"></div><div id="t-set"></div></div>
        <section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg"><div class="flex flex-wrap items-center gap-2 mb-space-md"><h2 class="font-headline-sm mr-auto">Jadwal Sesi & Distribusi Token CBT</h2>${C.select('t-f', [['hari', 'Hari Ini'], ['semua', 'Semua Mendatang']])}</div><div id="t-tv"></div></section>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-md mt-space-lg">${[['policy', 'Aturan Distribusi Proktor', 'Proktor dilarang membagikan kode token sebelum bel tanda masuk ujian. Setiap perilisan dan pengacakan token tercatat pada audit log.'], ['devices', 'Proteksi Perangkat', 'Satu akun siswa hanya dapat dipakai di satu perangkat. Bila siswa berganti gawai, lepas kunci perangkat di menu Data Siswa.'], ['verified_user', 'Jejak Audit', 'Kocok token, perpanjangan masa aktif, dan penguncian darurat dicatat beserta waktu dan pelakunya.']].map(function (x) { return h`<div class="bg-surface-card rounded-xl shadow-sm p-space-md flex gap-3">${U.ic(x[0], 'text-primary text-[26px]')}<div><h3 class="font-label-md font-semibold">${x[1]}</h3><p class="font-body-sm text-on-surface-variant mt-0.5">${x[2]}</p></div></div>`; })}</div>`);
      var tv = new TableView({ el: $('#t-tv', el), rowId: 'ID_Jadwal', size: 8, searchKeys: ['Mapel'], emptyIcon: 'key_off', emptyText: 'Tidak ada sesi.',
        columns: [
          { key: 'Tanggal', label: 'Sesi & Waktu', td: 'whitespace-nowrap', render: function (t) { return raw('<div class="font-medium">' + (t.JamKe ? 'Sesi ' + esc(t.JamKe) + ' · ' : '') + esc(t.JamMulai) + '–' + esc(t.JamSelesai) + '</div><div class="font-body-sm text-on-surface-variant">' + esc(U.hariTgl(t.Tanggal)) + '</div>'); } },
          { key: 'Kelas', label: 'Rombel', sort: false, render: function (t) { return t.Kelas.join(', '); } },
          { key: 'Mapel', label: 'Mata Pelajaran' },
          { key: 'kode', label: 'Kode Token', sort: false, render: function (t) { return raw(t.status === 'Selesai' ? '<span class="text-on-surface-variant">—</span>' : '<span class="inline-flex items-center gap-1.5 font-tabular-code font-bold tracking-wider text-primary">' + esc(t.kode) + '<button type="button" data-act="copy" class="p-1 rounded text-on-surface-variant hover:text-primary" aria-label="Salin token"><span class="material-symbols-outlined text-[16px]">content_copy</span></button></span>'); } },
          { key: 'ModeToken', label: 'Mode', render: function (t) { return raw('<span class="inline-flex items-center gap-1 font-label-md">' + U.str(U.ic(t.ModeToken === 'manual' ? 'touch_app' : 'bolt', 'text-[16px]')) + (t.ModeToken === 'manual' ? 'Manual' : 'Otomatis · ' + (t.IntervalMenit ? t.IntervalMenit + ' mnt' : 'tetap')) + '</span>'); } },
          { key: 'status', label: 'Status Token', render: function (t) { return stToken(t); } },
          { key: 'terhubung', label: 'Siswa Terkoneksi', td: 'font-tabular-code', render: function (t) { return t.terhubung + ' / ' + t.peserta; } },
          { key: null, label: 'Aksi', sort: false, th: 'text-right', td: 'text-right whitespace-nowrap', render: function (t) { return raw((t.TokenAktif ? '' : U.str(C.iconBtn('rilis', 'key', 'Rilis token'))) + U.str(C.iconBtn('pilih', 'center_focus_strong', 'Tampilkan di panel utama')) + (t.ModeToken === 'manual' ? '' : U.str(C.iconBtn('kocok', 'refresh', 'Kocok token'))) + U.str(C.iconBtn('mode', 'tune', 'Atur mode token')) + U.str(C.iconBtn('kunci', t.TokenKunci ? 'lock_open' : 'lock', t.TokenKunci ? 'Buka kunci' : 'Kunci darurat'))); } }],
        onAction: function (a, t, btn) { run(el, a, t, btn); } });
      el._tv = tv;
      $('#t-f', el).onchange = function () { draw(el); };
      $('#t-all', el).onclick = function () { U.confirm({ title: 'Rilis semua token hari ini?', message: 'Token semua sesi hari ini akan dibuka. Siswa baru dapat memakai token pada jendela waktunya.', ok: 'Rilis Semua' }).then(function (y) { if (y) C.act($('#t-all', el), 'token.rilis', { semuaHariIni: true }, { inv: ['token.', 'jadwal.'], done: function () { el._reload(); } }); }); };
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-t]'); if (!b) return; var t = (el._rows || []).filter(function (x) { return x.ID_Jadwal === (el._pick || (el._live && el._live.ID_Jadwal)); })[0]; if (!t) return;
        if (b.dataset.t === 'copy') U.copy(t.kode, 'Token');
        else if (b.dataset.t === 'proyektor') proyektor(el, t);
        else run(el, b.dataset.t, t, b);
      });
    },
    show: function (el) {
      var set = function (r) { el._rows = r.token; el._cfg = r.pengaturan; el._at = Date.now(); draw(el); };
      el._reload = function () { Api.swr('token.list', {}, set, { force: true, ttl: 0 }); };
      Api.swr('token.list', {}, function (r) { if (r.success) set(r); else { var b = $('[data-err]', el); U.mount(b, C.errorBox(r.message)); b.hidden = false; } }, { ttl: 5000 });
      clearInterval(el._tk); el._tk = setInterval(function () {
        var l = el._live, sisa = $('[data-sisa]', el); if (l && sisa) { var s = l.sisaDetik - (Date.now() - el._at) / 1000; sisa.textContent = mmss(s); if (s <= 0 && !el._busy) { el._busy = 1; el._reload(); setTimeout(function () { el._busy = 0; }, 3000); } }
        if (Date.now() - el._at > 15000 && !el._busy) { el._at = Date.now(); Api.swr('token.list', {}, set, { force: true, ttl: 0 }); }
      }, 1000);
    },
    hide: function (el) { clearInterval(el._tk); }
  });

  function run(el, a, t, btn) {
    var inv = ['token.', 'jadwal.', 'dash.'], done = function () { el._reload(); };
    if (a === 'copy') U.copy(t.kode, 'Token');
    else if (a === 'pilih') { el._pick = t.ID_Jadwal; draw(el); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (a === 'rilis') C.act(btn, 'token.rilis', { ids: [t.ID_Jadwal] }, { inv: inv, done: done });
    else if (a === 'kocok') U.confirm({ title: 'Kocok token sekarang?', message: 'Token lama tetap berlaku sebentar (masa toleransi) lalu tidak dapat dipakai.', ok: 'Kocok Token' }).then(function (y) { if (y) C.act(btn, 'token.kocok', { ID_Jadwal: t.ID_Jadwal }, { inv: inv, done: done }); });
    else if (a === 'perpanjang') C.act(btn, 'token.perpanjang', { ID_Jadwal: t.ID_Jadwal, menit: 15 }, { inv: inv, done: done });
    else if (a === 'kunci') {
      var k = !t.TokenKunci;
      U.confirm({ title: k ? 'Kunci akses token?' : 'Buka kunci token?', message: k ? 'Siswa yang belum masuk tidak dapat memakai token. Siswa yang sudah mengerjakan tidak terganggu.' : 'Token dapat dipakai kembali pada jendela waktunya.', ok: k ? 'Kunci Sekarang' : 'Buka Kunci', danger: k }).then(function (y) { if (y) C.act(btn, 'token.kunci', { ID_Jadwal: t.ID_Jadwal, kunci: k }, { inv: inv, done: done }); });
    } else if (a === 'mode') modeForm(el, t);
  }
  function modeForm(el, t) {
    var m = U.modal({ title: 'Mode Token — ' + t.Mapel, width: 'max-w-md',
      body: h`<div class="flex flex-col gap-4">${U.field({ name: 'ModeToken', label: 'Mode', type: 'select', value: t.ModeToken, options: [{ value: 'otomatis', label: 'Otomatis (berganti berkala)' }, { value: 'manual', label: 'Manual (token tetap)' }] })}<div data-mt="otomatis">${U.field({ name: 'IntervalMenit', label: 'Ganti token tiap (menit)', type: 'number', value: t.IntervalMenit || (el._cfg && el._cfg.interval) || 30, attrs: 'min="1" max="240"' })}</div><div data-mt="manual" hidden>${U.field({ name: 'TokenManual', label: 'Token Manual', mono: true, attrs: 'maxlength="12" style="text-transform:uppercase"', hint: 'Minimal 4 huruf/angka.' })}</div></div>`,
      buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Simpan', primary: true, onClick: function (x, b) { var d = U.formData(x.body); d.ID_Jadwal = t.ID_Jadwal; d.IntervalMenit = +d.IntervalMenit || 30; C.act(b, 'token.set', d, { inv: ['token.', 'jadwal.'], done: function () { x.close(); el._reload(); } }); } }] });
    var sel = $('[name=ModeToken]', m.body), tg = function () { $$('[data-mt]', m.body).forEach(function (n) { n.hidden = n.dataset.mt !== sel.value; }); }; sel.onchange = tg; tg();
  }
  function proyektor(el, t) {
    var tick, m = U.modal({ title: 'Pindai / Baca Token Sesi', subtitle: t.Mapel + ' · ' + t.Kelas.join(', '), width: 'max-w-2xl', onClose: function () { clearInterval(tick); },
      body: h`<div class="text-center py-6"><div id="px-kode" class="font-tabular-code font-bold text-primary tracking-[0.3em] text-[64px] sm:text-[88px] leading-none">${t.kode}</div><p class="mt-4 font-body-md text-on-surface-variant">Tampilkan di proyektor kelas untuk mempercepat input siswa.</p></div>`,
      buttons: [{ label: 'Tutup', onClick: function (x) { x.close(); } }, { label: 'Cetak', primary: true, onClick: function () { C.print('Token Sesi', '<h1 style="text-align:center;font-size:20px">' + esc(t.Mapel) + '</h1><p style="text-align:center">' + esc(t.Kelas.join(', ')) + '</p><div style="text-align:center;font:700 96px monospace;letter-spacing:.2em;margin-top:60px">' + esc(t.kode) + '</div>'); } }] });
    tick = setInterval(function () { var r = (el._rows || []).filter(function (x) { return x.ID_Jadwal === t.ID_Jadwal; })[0]; var n = $('#px-kode', m.el); if (!n) { clearInterval(tick); return; } if (r) n.textContent = r.kode; }, 1000);
  }

  function draw(el) {
    var rows = el._rows || [], f = $('#t-f', el).value, today = U.todayIso();
    var live = rows.filter(function (t) { return t.ID_Jadwal === el._pick; })[0] || rows.filter(function (t) { return t.status === 'Sedang Berlangsung'; })[0] || rows.filter(function (t) { return t.status !== 'Selesai'; })[0];
    el._live = live; el._at = el._at || Date.now();
    var liveEl = $('#t-live', el);
    if (!live) U.mount(liveEl, h`<div class="bg-surface-card rounded-xl shadow-sm p-space-lg text-center text-on-surface-variant">${U.ic('key_off', 'text-[44px] text-outline')}<p class="mt-2">Belum ada sesi aktif atau mendatang.</p></div>`);
    else {
      var sisa = live.sisaDetik - (Date.now() - el._at) / 1000;
      U.mount(liveEl, h`<section class="rounded-xl p-space-md md:p-space-lg bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-md">
        <div class="flex flex-wrap items-center gap-2 font-label-md opacity-90">${U.ic('shield', 'text-[20px]')}TOKEN SESI ${live.status === 'Sedang Berlangsung' ? 'AKTIF SAAT INI' : 'TERDEKAT'}<span class="mx-1">•</span>${live.JamKe ? 'Sesi ' + live.JamKe + ' — ' : ''}${U.hariTgl(live.Tanggal)}</div>
        <div class="mt-3 flex flex-wrap items-center gap-4"><div class="font-tabular-code font-bold tracking-[0.18em] text-[44px] sm:text-[60px] leading-none">${live.status === 'Selesai' ? '—' : live.kode}</div>
          <button type="button" data-t="copy" class="p-2 rounded-lg bg-white/15 hover:bg-white/25" aria-label="Salin token">${U.ic('content_copy')}</button><button type="button" data-t="proyektor" class="p-2 rounded-lg bg-white/15 hover:bg-white/25" aria-label="Tampilkan di proyektor">${U.ic('qr_code_2')}</button>
          ${live.TokenKunci ? raw('<span class="px-2.5 py-1 rounded-full bg-white/20 font-label-sm">TERKUNCI</span>') : live.bisaDipakai ? raw('<span class="px-2.5 py-1 rounded-full bg-white/20 font-label-sm inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>LIVE</span>') : raw('<span class="px-2.5 py-1 rounded-full bg-white/20 font-label-sm">' + esc(live.alasan || 'Belum dibuka') + '</span>')}</div>
        <div class="mt-3 grid sm:grid-cols-2 gap-2 font-body-md opacity-95"><div>${live.ModeToken === 'manual' ? 'Token manual (tetap)' : 'Berganti dalam: '}${live.ModeToken === 'manual' ? '' : raw('<b class="font-tabular-code" data-sisa>' + mmss(sisa) + '</b>')}</div><div>Berlaku untuk: <b>${live.Kelas.join(', ')}</b> (${live.Mapel})</div></div>
        <div class="mt-4 flex flex-wrap gap-2"><button type="button" data-t="perpanjang" class="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 font-label-md inline-flex items-center gap-1.5">${U.ic('update', 'text-[18px]')}Perpanjang Masa Aktif (+15 Menit)</button>${live.ModeToken === 'manual' ? '' : raw('<button type="button" data-t="kocok" class="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 font-label-md inline-flex items-center gap-1.5">' + U.str(U.ic('shuffle', 'text-[18px]')) + 'Kocok / Regenerate Token Sekarang</button>')}${live.TokenAktif ? '' : raw('<button type="button" data-t="rilis" class="px-3 py-2 rounded-lg bg-white text-primary font-label-md inline-flex items-center gap-1.5">' + U.str(U.ic('key', 'text-[18px]')) + 'Rilis Token</button>')}<button type="button" data-t="kunci" class="px-3 py-2 rounded-lg ${live.TokenKunci ? 'bg-white text-primary' : 'bg-red-500/80 hover:bg-red-500'} font-label-md inline-flex items-center gap-1.5">${U.ic(live.TokenKunci ? 'lock_open' : 'lock', 'text-[18px]')}${live.TokenKunci ? 'Buka Kunci Token' : 'Tutup Akses Token (Emergency Lock)'}</button></div></section>`);
    }
    var c = el._cfg || { durasi: 120, interval: 30 };
    U.mount($('#t-set', el), h`<section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg h-full"><h2 class="font-headline-sm mb-1">Rilis Otomatis Script</h2><p class="font-body-sm text-on-surface-variant mb-space-sm">Pengaturan bawaan untuk semua sesi bermode otomatis.</p>
      <div class="flex flex-col gap-3">${U.field({ name: 'durasi', label: 'Durasi Berlaku Token (menit)', type: 'number', value: c.durasi, attrs: 'id="ts-d" min="15" max="600"' })}${U.field({ name: 'interval', label: 'Interval Kocok Token (menit)', type: 'number', value: c.interval, attrs: 'id="ts-i" min="0" max="240"', hint: '0 = token statis per sesi.' })}
      <label class="flex items-center gap-2 font-body-md"><input id="ts-a" type="checkbox" class="rounded border-border-strong text-primary-container">Terapkan ke semua sesi yang belum selesai</label>
      <button type="button" id="ts-s" class="${U.BTN.primary}">Simpan Pengaturan</button></div></section>`);
    $('#ts-s', el).onclick = function () { C.act(this, 'token.pengaturan', { durasi: +$('#ts-d', el).value, interval: +$('#ts-i', el).value, terapkanSemua: $('#ts-a', el).checked }, { inv: ['token.', 'jadwal.'], done: function () { el._reload(); } }); };
    el._tv.setRows(rows.filter(function (t) { return f === 'semua' ? t.status !== 'Selesai' || t.Tanggal >= today : t.Tanggal === today; }));
  }
})();
