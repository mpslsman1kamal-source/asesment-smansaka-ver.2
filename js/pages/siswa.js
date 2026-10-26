/* siswa.js — Jadwal & Input Token (w_16), Ruang Asesmen (w_17), Validasi (w_18), Konfirmasi (w_19), Tanda Terima (w_20), Riwayat Pengumpulan */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$, $$ = U.$$;
  var WARNA = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'];
  function warna(s) { var n = 0; String(s || '').split('').forEach(function (c) { n += c.charCodeAt(0); }); return WARNA[n % WARNA.length]; }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) { } }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function huruf(i) { return String.fromCharCode(65 + i); }
  function html(x) { return raw(U.clean(x || '')); }
  var JENIS = { PG: 'Pilihan Ganda Tunggal', PGK: 'Pilihan Ganda Kompleks', BS: 'Benar / Salah', URAIAN: 'Uraian' };

  // =====================================================================
  // 1. Jadwal Ujian Saya (w_16)
  // =====================================================================
  var sel = null, listCache = [];
  App.register('siswa/jadwal', {
    role: 'siswa', layout: 'siswa', title: 'Jadwal Ujian Saya',
    prefetch: function () { return [{ action: 'jadwal.list', data: {} }]; },
    init: function (el) {
      el.innerHTML = '<div data-root></div>';
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var a = b.dataset.act;
        if (a === 'pilih') { sel = b.dataset.id; draw(el); var t = $('#exam-token-input', el); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.focus(); } }
        else if (a === 'clear') { var t2 = $('#exam-token-input', el); t2.value = ''; t2.focus(); }
        else if (a === 'mulai') mulai(el, b);
        else if (a === 'lanjut') App.go('siswa/ujian/' + b.dataset.id);
        else if (a === 'resi') App.go('siswa/resi/' + b.dataset.id);
      });
      el.addEventListener('input', function (e) { if (e.target.id === 'exam-token-input') e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
      el.addEventListener('keydown', function (e) { if (e.target.id === 'exam-token-input' && e.key === 'Enter') { var b = $('[data-act=mulai]', el); if (b) b.click(); } });
    },
    show: function (el) {
      App.activeJadwal = null;
      if (!$('[data-root]', el).firstChild) U.mount($('[data-root]', el), h`<div class="h-64 rounded-2xl bg-white/60 animate-pulse"></div>`);
      Api.swr('jadwal.list', {}, function (r) {
        if (!r.success) return U.mount($('[data-root]', el), C.errorBox(r.message));
        if (r.serverTime) App.syncClock(r.serverTime);
        listCache = r.jadwal || []; draw(el);
      });
      clearInterval(el._t); el._t = setInterval(function () { if (!el.hidden) Api.swr('jadwal.list', {}, function (r) { if (r.success && !el.hidden) { listCache = r.jadwal || []; var t = $('#exam-token-input', el), v = t && t.value, f = document.activeElement === t; draw(el); if (v) { t = $('#exam-token-input', el); if (t) { t.value = v; if (f) t.focus(); } } } }, { force: true }); }, 30000);
    },
    hide: function (el) { clearInterval(el._t); }
  });

  function aktif() {
    var l = listCache.filter(function (j) { return !j.sudahKumpul; });
    var pick = l.filter(function (j) { return j.id === sel || j.ID_Jadwal === sel; })[0]; if (pick) return pick;
    return l.filter(function (j) { return j.sedangMengerjakan; })[0] || l.filter(function (j) { return j.bisaToken; })[0] || l.filter(function (j) { return j.status !== 'Selesai'; })[0] || null;
  }
  function draw(el) {
    var me = Api.me() || {}, pr = App.profil || {}, j = aktif(), root = $('[data-root]', el);
    if (j) sel = j.ID_Jadwal; App.activeJadwal = j;
    var kelas = j && j.Kelas ? j.Kelas.join(', ') : (pr.kelas || '');
    var hero = h`<section class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f2c73] via-[#1d4ed8] to-[#0284c7] text-white p-6 md:p-8 shadow-lg">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5"><div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Selamat Datang, ${me.nama || ''}!</h1>
        <p class="mt-1 text-blue-100 text-sm md:text-base">Periksa jadwal asesmen Anda dan masukkan token dari proktor saat sesi dibuka.</p>
        <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span class="px-3 py-1.5 rounded-full bg-white/15 border border-white/25">NISN: ${me.id || ''}</span>
          <span class="px-3 py-1.5 rounded-full bg-white/15 border border-white/25">Kelas: ${pr.kelas || kelas || '—'}</span>
          ${pr.meja ? h`<span class="px-3 py-1.5 rounded-full bg-amber-400 text-slate-900 border border-amber-300">MEJA ${pr.meja}${pr.lab ? ' · ' + pr.lab : ''}</span>` : ''}</div></div>
        <div class="grid grid-cols-2 gap-3 lg:w-[380px] shrink-0">
          <div class="rounded-xl bg-white/12 border border-white/25 p-3.5"><div class="flex items-center gap-2 text-cyan-200 text-xs font-bold">${U.ic('cloud_sync', 'text-[18px]')}Sinkronisasi</div><p class="mt-1 text-sm font-semibold">Jawaban tersimpan otomatis ke server</p></div>
          <div class="rounded-xl bg-white/12 border border-white/25 p-3.5"><div class="flex items-center gap-2 text-cyan-200 text-xs font-bold">${U.ic('screen_lock_portrait', 'text-[18px]')}Keamanan Perangkat</div><p class="mt-1 text-sm font-semibold">Satu akun hanya untuk satu perangkat</p></div></div></div></section>`;
    var utama = j ? utamaCard(j, kelas) : h`<section class="rounded-2xl bg-white shadow-sm border border-slate-200 p-8 text-center"><div class="mx-auto w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">${U.ic('event_available', 'text-[30px]')}</div><h2 class="text-lg font-bold text-slate-800">Belum ada asesmen yang perlu dikerjakan</h2><p class="text-sm text-slate-500 mt-1">Semua jadwal untuk kelas Anda sudah selesai atau belum dibuat.</p></section>`;
    var tabel = h`<section class="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden"><div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">${U.ic('calendar_month', 'text-blue-600')}<h2 class="font-bold text-slate-800">Jadwal Asesmen Lengkap</h2></div>
      <div class="overflow-x-auto"><table class="w-full text-left text-sm min-w-[760px]"><thead><tr class="bg-slate-50 text-xs uppercase text-slate-500 tracking-wide"><th class="py-3 px-5">Tanggal &amp; Waktu</th><th class="py-3 px-4">Mata Pelajaran</th><th class="py-3 px-4">Sesi &amp; Lab</th><th class="py-3 px-4">Komposisi</th><th class="py-3 px-4">Status</th><th class="py-3 px-5 text-right">Aksi</th></tr></thead>
      <tbody class="divide-y divide-slate-100">${listCache.length ? listCache.map(row) : h`<tr><td colspan="6" class="py-10 text-center text-slate-500">Belum ada jadwal asesmen untuk kelas Anda.</td></tr>`}</tbody></table></div></section>`;
    var aturan = h`<section class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      ${aturanCard('shield', 'Integritas Akademik', 'Kerjakan sendiri. Berpindah tab atau meminimalkan jendela dicatat pada log proktor.', 'bg-rose-50 border-rose-200 text-rose-700')}
      ${aturanCard('cloud_done', 'Auto-Save', 'Jawaban tersimpan otomatis berkala. Jika koneksi terputus, jawaban tetap aman di perangkat.', 'bg-emerald-50 border-emerald-200 text-emerald-700')}
      ${aturanCard('flag', 'Ragu-Ragu', 'Tandai soal yang belum yakin. Semua soal wajib terjawab sebelum asesmen dikumpulkan.', 'bg-amber-50 border-amber-200 text-amber-700')}
      ${aturanCard('support_agent', 'Bantuan Proktor', 'Ada kendala teknis? Tekan tombol Bantuan Proktor di bagian atas halaman.', 'bg-blue-50 border-blue-200 text-blue-700')}</section>`;
    U.mount(root, h`<div class="flex flex-col gap-6">${hero}${utama}${tabel}${aturan}</div>`);
  }
  function aturanCard(ic, jd, tx, cls) { return h`<div class="rounded-2xl border p-4 ${cls}"><div class="flex items-center gap-2 font-bold">${U.ic(ic, 'text-[22px]')}${jd}</div><p class="mt-1.5 text-sm leading-relaxed opacity-90">${tx}</p></div>`; }
  function stat(ic, lb, v) { return h`<div class="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3"><div class="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">${U.ic(ic, 'text-[24px]')}</div><div><div class="text-[11px] uppercase font-bold tracking-wide text-slate-500">${lb}</div><div class="text-lg font-extrabold text-slate-800">${v}</div></div></div>`; }
  function utamaCard(j, kelas) {
    var jalan = j.sedangMengerjakan, bisa = j.bisaToken, lat = App.latency, cek = [
      ['Koneksi server', lat ? lat < 4000 : true, lat ? 'Terhubung (' + lat + ' ms)' : 'Terhubung'],
      ['Jam perangkat tersinkron dengan server', true, 'Waktu mengikuti jam server'],
      ['Paket soal siap', j.jumlahSoal > 0, j.jumlahSoal > 0 ? j.jumlahSoal + ' butir siap diujikan' : 'Belum ada butir siap']];
    var label = jalan ? 'ASESMEN SEDANG ANDA KERJAKAN' : bisa ? 'ASESMEN HARI INI (SEDANG BERLANGSUNG)' : 'ASESMEN BERIKUTNYA';
    var kom = j.komposisi || {};
    return h`<section class="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden"><div class="p-5 md:p-7 flex flex-col gap-5">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${bisa || jalan ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-[11px] font-extrabold tracking-wide"><span class="w-2 h-2 rounded-full bg-current ${bisa || jalan ? 'animate-pulse' : ''}"></span>${label}</span>
        <h2 class="mt-2 text-xl md:text-2xl font-extrabold text-slate-900">${j.Paket || j.Mapel}</h2><p class="text-sm text-slate-500 mt-0.5">${j.Mapel} · Guru pengampu: ${j.guru || '—'} · ${U.hariTgl(j.Tanggal)}, ${j.JamMulai}–${j.JamSelesai} WIB · ${kelas}</p></div></div>
      <div class="grid sm:grid-cols-3 gap-3">${stat('quiz', 'Jumlah Soal', (j.jumlahSoal || 0) + ' Butir')}${stat('timer', 'Alokasi Waktu', (j.DurasiMenit || 0) + ' Menit')}${stat('military_tech', 'Kriteria KKM', j.KKM || '—')}</div>
      <div class="grid lg:grid-cols-2 gap-5"><div class="rounded-xl border border-slate-200 p-4"><div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Kesiapan Perangkat</div><ul class="flex flex-col gap-2">${cek.map(function (c) { return h`<li class="flex items-start gap-2 text-sm">${U.ic(c[1] ? 'check_circle' : 'error', c[1] ? 'text-emerald-600 text-[20px]' : 'text-rose-600 text-[20px]')}<div><div class="font-semibold text-slate-700">${c[0]}</div><div class="text-xs text-slate-500">${c[2]}</div></div></li>`; })}</ul>
        <p class="mt-3 text-xs text-slate-500">Komposisi: ${kom.PG || 0} butir pilihan/objektif · ${kom.URAIAN || 0} butir uraian.</p></div>
        <div class="rounded-xl border-2 ${bisa || jalan ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} p-4 flex flex-col gap-3">
          ${jalan ? h`<div class="flex items-start gap-2 text-sm text-blue-800">${U.ic('play_circle', 'text-[22px]')}<div><div class="font-bold">Sesi Anda masih berjalan.</div><div class="text-xs mt-0.5">Lanjutkan pengerjaan; waktu tetap berjalan sesuai jam server dan jawaban sebelumnya sudah tersimpan.</div></div></div>
            <button type="button" data-act="lanjut" data-id="${j.ID_Jadwal}" class="h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-md hover:brightness-110 active:scale-[.99] inline-flex items-center justify-center gap-2">${U.ic('play_arrow')}Lanjutkan Mengerjakan</button>`
        : bisa ? h`<label for="exam-token-input" class="text-xs font-bold text-slate-600 uppercase tracking-wide">Token Ujian dari Proktor</label>
            <div class="relative"><input id="exam-token-input" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="••••••" class="w-full h-16 rounded-xl border-2 border-blue-300 bg-white text-center font-mono text-2xl font-bold uppercase tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500"><button type="button" data-act="clear" aria-label="Hapus token" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:bg-slate-100">${U.ic('close', 'text-[20px]')}</button></div>
            <p class="text-xs text-slate-500 flex items-center gap-1.5">${U.ic('verified_user', 'text-[16px] text-blue-600')}Token berlaku untuk kelas ${kelas}.</p>
            <button type="button" data-act="mulai" data-id="${j.ID_Jadwal}" class="h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-md hover:brightness-110 active:scale-[.99] inline-flex items-center justify-center gap-2">${U.ic('rocket_launch')}Mulai Kerjakan Asesmen</button>`
        : h`<div class="flex items-start gap-2 text-sm text-slate-600">${U.ic('lock_clock', 'text-[22px] text-amber-600')}<div><div class="font-bold text-slate-800">Token belum dapat dimasukkan</div><div class="text-xs mt-0.5">${j.alasan || 'Tunggu hingga sesi dibuka oleh proktor.'}</div></div></div>`}</div></div></div></section>`;
  }
  function row(j) {
    var aksi = j.sudahKumpul ? h`<button type="button" data-act="resi" data-id="${j.ID_Jadwal}" class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 inline-flex items-center gap-1">${U.ic('receipt_long', 'text-[16px]')}Lihat Tanda Terima</button>`
      : j.sedangMengerjakan ? h`<button type="button" data-act="lanjut" data-id="${j.ID_Jadwal}" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 inline-flex items-center gap-1">${U.ic('play_arrow', 'text-[16px]')}Lanjutkan</button>`
        : j.bisaToken ? h`<button type="button" data-act="pilih" data-id="${j.ID_Jadwal}" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 inline-flex items-center gap-1">${U.ic('key', 'text-[16px]')}Input Token</button>`
          : h`<span title="${j.alasan || ''}" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 font-semibold text-xs inline-flex items-center gap-1">${U.ic('lock', 'text-[16px]')}Token Terkunci</span>`;
    var st = j.sudahKumpul ? U.badge('Sudah Dikumpulkan', 'ok', true) : U.statusJadwalBadge(j.status), kom = j.komposisi || {};
    return h`<tr class="hover:bg-slate-50/70"><td class="py-3.5 px-5"><div class="font-semibold text-slate-800">${U.hariTgl(j.Tanggal)}</div><div class="text-xs text-slate-500 font-mono">${j.JamMulai} – ${j.JamSelesai} WIB</div></td>
      <td class="py-3.5 px-4"><div class="flex items-center gap-2.5"><span class="w-9 h-9 rounded-lg ${warna(j.Mapel)} font-extrabold flex items-center justify-center text-xs">${U.initials(j.Mapel)}</span><div><div class="font-semibold text-slate-800">${j.Mapel}</div><div class="text-xs text-slate-500">${j.Paket || ''}</div></div></div></td>
      <td class="py-3.5 px-4 text-slate-600">${j.JamKe ? 'Jam ke-' + j.JamKe : '—'}${j.Lab ? ' · ' + j.Lab : ''}</td>
      <td class="py-3.5 px-4 text-slate-600">${j.jumlahSoal || 0} butir<div class="text-xs text-slate-400">${kom.PG || 0} objektif · ${kom.URAIAN || 0} uraian</div></td><td class="py-3.5 px-4">${st}</td><td class="py-3.5 px-5 text-right">${aksi}</td></tr>`;
  }
  function mulai(el, btn) {
    var jid = btn.dataset.id, inp = $('#exam-token-input', el), tk = (inp.value || '').trim();
    if (tk.length < 4) { U.toast('Masukkan token ujian dari proktor.', 'warn'); inp.focus(); return; }
    U.busy(btn, true, 'Memeriksa token…');
    Api.call('ujian.token', { ID_Jadwal: jid, token: tk }).then(function (r) {
      U.busy(btn, false);
      if (!r.success) { U.toast(r.message, 'err'); if (r.code === 'DONE') { Api.invalidate('jadwal.list'); } inp.select(); return; }
      ssSet('cbt.tiket.' + jid, r.tiket); Api.invalidate('jadwal.list');
      App.go('siswa/ujian/' + jid);
    });
  }

  // =====================================================================
  // 2. Ruang Asesmen (w_17) + validasi (w_18) + konfirmasi (w_19)
  // =====================================================================
  var X = null; // state ujian berjalan
  App.register('siswa/ujian/:jid', {
    role: 'siswa', layout: 'ujian', title: 'Ruang Asesmen', menu: 'siswa/jadwal',
    init: function (el) {
      el.className = 'page-view';
      el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onInput);
      document.addEventListener('visibilitychange', function () { if (X && X.run && document.hidden) blur_(); });
      window.addEventListener('blur', function () { if (X && X.run && !document.hidden) blur_(); });
      window.addEventListener('beforeunload', function (e) { if (X && X.run) { simpanLokal(); e.preventDefault(); e.returnValue = ''; } });
      window.addEventListener('online', function () { if (X && X.run) simpan(); });
    },
    show: function (el, ctx) {
      var jid = ctx.params.jid;
      if (X && X.run && X.jid === jid) { render(); return; }
      X = null; U.mount(el, h`<div class="min-h-screen flex items-center justify-center bg-slate-100"><div class="text-center text-slate-600"><span class="material-symbols-outlined text-[44px] animate-spin text-blue-600">progress_activity</span><p class="mt-3 font-semibold">Menyiapkan lembar asesmen…</p></div></div>`);
      Api.call('ujian.mulai', { ID_Jadwal: jid, tiket: ssGet('cbt.tiket.' + jid) || '' }).then(function (r) {
        if (!r.success) {
          if (r.code === 'DONE') { U.toast(r.message, 'info'); return App.go('siswa/resi/' + jid, true); }
          U.toast(r.message || 'Tidak dapat memulai asesmen.', 'err'); return App.go('siswa/jadwal', true);
        }
        App.syncClock(r.serverTime); ssDel('cbt.tiket.' + jid);
        mulaiSesi(jid, r, el);
      });
    }
  });
  function kunciLokal() { return 'cbt.ans.' + X.jid + '.' + (Api.me() || {}).id; }
  function mulaiSesi(jid, r, el) {
    var s = r.sesi, me = Api.me() || {};
    X = { jid: jid, el: el, run: true, items: r.butir, jad: r.jadwal, ans: s.jawaban || {}, ragu: {}, cur: s.cur || 0, v: s.v || 0, deadline: s.deadline, dirty: {}, raguDirty: false, curDirty: false, blurN: 0, saving: false, tick: null, auto: null, ok: true, last: null, fs: Number(lsGet('cbt.fs')) || 1, kirim: false };
    (s.ragu || []).forEach(function (id) { X.ragu[id] = 1; });
    try { var lk = JSON.parse(lsGet(kunciLokal()) || 'null'); if (lk && lk.a) { Object.keys(lk.a).forEach(function (id) { var sv = X.ans[id], lv = lk.a[id], kosongS = sv === undefined || sv === '' || (Array.isArray(sv) && !sv.length); if (kosongS && lv !== '' && !(Array.isArray(lv) && !lv.length)) { X.ans[id] = lv; X.dirty[id] = 1; } }); } } catch (e) { }
    if (X.cur >= X.items.length) X.cur = 0;
    App.activeJadwal = { ID_Jadwal: jid };
    var det = Math.max(5, Number(r.autosaveDetik) || 15);
    X.tick = setInterval(tick, 1000); X.auto = setInterval(function () { simpan(); }, det * 1000);
    render();
    if (Object.keys(X.dirty).length) simpan();
  }
  function jawab(it) { var v = X.ans[it.id]; if (it.jenis === 'URAIAN') return String(v || '').trim().length > 0; if (it.jenis === 'PG') return !!v; if (it.jenis === 'PGK') return Array.isArray(v) && v.length > 0; return Array.isArray(v) && v.length === it.opsi.length && v.every(function (x) { return x === 'B' || x === 'S'; }); }
  function hitung() { var t = 0, g = 0, k = []; X.items.forEach(function (it, i) { if (jawab(it)) t++; else k.push(i + 1); if (X.ragu[it.id]) g++; }); return { terjawab: t, ragu: g, kosong: k }; }
  function render() {
    var el = X.el, it = X.items[X.cur], c = hitung(), me = Api.me() || {}, pr = App.profil || {};
    var fsz = ['text-[14px]', 'text-[16px]', 'text-[18px]', 'text-[20px]'][X.fs] || 'text-[16px]'; if (X.fs < 0 || X.fs > 3) X.fs = 1;
    var nav = X.items.map(function (b, i) { var a = jawab(b), g = X.ragu[b.id], on = i === X.cur;
      var cls = on ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300' : g ? 'bg-amber-100 text-amber-800 border-amber-400' : a ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50';
      return '<button type="button" data-nav="' + i + '" aria-label="Butir ' + (i + 1) + (g ? ', ragu-ragu' : a ? ', terjawab' : ', kosong') + '" class="relative h-10 rounded-lg border font-bold text-sm ' + cls + '">' + (i + 1) + (g ? '<span class="material-symbols-outlined absolute -top-1.5 -right-1 text-[14px] text-amber-600" style="font-variation-settings:\'FILL\' 1">flag</span>' : '') + '</button>'; }).join('');
    U.mount(el, h`<div class="min-h-screen bg-[#f0f4fc] flex flex-col">
      <header class="sticky top-0 z-30 bg-gradient-to-r from-[#0f2c73] via-[#1d4ed8] to-[#0284c7] text-white shadow-lg"><div class="px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0"><div class="text-[11px] font-bold tracking-wider text-blue-200 uppercase">${String(App.config.NAMA_SEKOLAH || '')}</div><div class="font-extrabold text-base md:text-lg leading-tight truncate">${X.jad.Mapel} · Butir ${X.cur + 1} / ${X.items.length}</div><div class="text-xs text-blue-100 font-mono">Kode: ${X.jad.kode}</div></div>
        <div class="flex items-center gap-3 md:gap-5 flex-wrap"><div class="text-center"><div class="flex items-center gap-1.5 font-mono text-2xl font-extrabold tracking-wider" id="x-timer" aria-live="off">${U.ic('hourglass_top', 'text-[24px] text-amber-300')}<span data-t>--:--:--</span></div><div class="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">Sisa Waktu (jam server)</div></div>
          <div id="x-sync" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs font-semibold"></div>
          <div class="inline-flex items-center rounded-xl bg-white/15 border border-white/25 overflow-hidden" role="group" aria-label="Ukuran huruf"><button type="button" data-fs="-1" class="px-2.5 py-1.5 text-xs font-bold hover:bg-white/20" aria-label="Perkecil huruf">A-</button><button type="button" data-fs="0" class="px-2.5 py-1.5 text-sm font-bold hover:bg-white/20 border-x border-white/20" aria-label="Ukuran normal">A</button><button type="button" data-fs="1" class="px-2.5 py-1.5 text-base font-bold hover:bg-white/20" aria-label="Perbesar huruf">A+</button></div>
          <div class="hidden md:block text-right leading-tight"><div class="font-bold text-sm">${me.nama || ''}</div><div class="text-[11px] text-blue-100">NISN: ${me.id || ''}${pr.kelas ? ' · ' + pr.kelas : ''}${pr.meja ? ' · Meja ' + pr.meja : ''}</div></div></div></div></header>
      <main class="flex-1 px-4 lg:px-8 py-5 max-w-[1500px] mx-auto w-full grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <section class="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden"><div class="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 bg-slate-50/70">
          <span class="inline-flex items-center gap-1.5 font-extrabold text-slate-800">${U.ic('edit_note', 'text-blue-600')}Butir Soal #${X.cur + 1}</span>
          <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">${JENIS[it.jenis] || it.jenis}</span>
          <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold inline-flex items-center gap-1">${U.ic('stars', 'text-[14px]')}Bobot: ${it.bobot} Poin</span>
          ${it.kategori ? h`<span class="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold inline-flex items-center gap-1">${U.ic('psychology', 'text-[14px]')}Kategori: ${it.kategori}</span>` : ''}</div>
          <div class="p-5 md:p-7 ${fsz} leading-relaxed text-slate-800" data-soal><div class="prose-soal">${html(it.stimulus)}</div>
            ${it.gambar ? h`<figure class="mt-4"><img src="${it.gambar}" alt="Gambar pendukung butir ${X.cur + 1}" class="max-w-full max-h-[420px] rounded-xl border border-slate-200 mx-auto"></figure>` : ''}
            <div class="mt-5 flex flex-col gap-2.5">${opsi(it)}</div></div>
          <div class="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
            <button type="button" data-go="-1" ${X.cur === 0 ? 'disabled' : ''} class="px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 inline-flex items-center gap-1.5">${U.ic('arrow_back', 'text-[18px]')}Soal Sebelumnya${X.cur > 0 ? ' (No. ' + X.cur + ')' : ''}</button>
            <button type="button" data-ragu class="px-4 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 border ${X.ragu[it.id] ? 'bg-amber-400 border-amber-500 text-slate-900' : 'bg-white border-amber-400 text-amber-700 hover:bg-amber-50'}">${U.ic('flag', 'text-[18px]')}Ragu-ragu ${X.ragu[it.id] ? '[✓]' : ''}</button>
            ${X.cur < X.items.length - 1 ? h`<button type="button" data-go="1" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md hover:brightness-110 inline-flex items-center gap-1.5">Simpan &amp; Soal Selanjutnya${U.ic('arrow_forward', 'text-[18px]')}</button>` : h`<button type="button" data-submit class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md hover:brightness-110 inline-flex items-center gap-1.5">${U.ic('task_alt', 'text-[18px]')}Selesaikan Ujian</button>`}</div></section>
        <aside class="flex flex-col gap-4 lg:sticky lg:top-[92px]">
          <section class="rounded-2xl bg-white shadow-sm border border-slate-200 p-4"><div class="flex items-center justify-between mb-3"><div class="font-extrabold text-slate-800 inline-flex items-center gap-1.5">${U.ic('grid_view', 'text-blue-600')}Nomor Soal</div><span class="text-xs font-bold text-slate-500">${X.items.length} Butir</span></div>
            <div class="grid grid-cols-3 gap-2 text-center mb-3"><div class="rounded-lg bg-emerald-50 py-1.5"><div class="text-lg font-extrabold text-emerald-700" data-c-t>${c.terjawab}</div><div class="text-[10px] font-bold uppercase text-emerald-700">Terjawab</div></div><div class="rounded-lg bg-amber-50 py-1.5"><div class="text-lg font-extrabold text-amber-700" data-c-r>${c.ragu}</div><div class="text-[10px] font-bold uppercase text-amber-700">Ragu</div></div><div class="rounded-lg bg-slate-100 py-1.5"><div class="text-lg font-extrabold text-slate-700" data-c-k>${c.kosong.length}</div><div class="text-[10px] font-bold uppercase text-slate-600">Kosong</div></div></div>
            <div class="grid grid-cols-5 gap-1.5" data-navgrid>${raw(nav)}</div>
            <button type="button" data-submit class="mt-4 w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold shadow-md hover:brightness-110 inline-flex items-center justify-center gap-2">${U.ic('task_alt')}Selesaikan Ujian (Submit)</button></section>
          <section class="rounded-2xl bg-slate-800 text-slate-100 p-4 text-xs leading-relaxed"><div class="font-bold inline-flex items-center gap-1.5 text-cyan-300">${U.ic('lock', 'text-[18px]')}Secure Lock Engine Aktif</div><p class="mt-1 text-slate-300">Pindah tab atau meminimalkan jendela browser akan tercatat pada log proktor.</p></section>
          <section class="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-3"><div><div class="font-bold text-slate-800 text-sm inline-flex items-center gap-1.5">${U.ic('support_agent', 'text-amber-600')}Kendala Teknis Lab?</div><div class="text-xs text-slate-500">Panggil pengawas / proktor lab</div></div><button type="button" data-help class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs">Bantuan</button></section></aside></main></div>`);
    U.math($('[data-soal]', el)); tick(); status();
    if (X.cur !== X.lastCur) { window.scrollTo(0, 0); X.lastCur = X.cur; }
  }
  function opsi(it) {
    var v = X.ans[it.id], out = [];
    if (it.jenis === 'URAIAN') return h`<textarea data-uraian rows="9" maxlength="5000" placeholder="Tulis jawaban Anda di sini…" class="w-full rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 p-4 text-[1em] leading-relaxed">${v || ''}</textarea>`;
    if (it.jenis === 'BS') {
      var a = Array.isArray(v) ? v : [];
      return h`<p class="text-sm text-slate-500 -mb-1">Tentukan setiap pernyataan Benar atau Salah.</p>${it.opsi.map(function (o, i) { return h`<div class="rounded-xl border-2 border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3"><div class="flex-1 min-w-[220px]"><span class="font-bold text-slate-500 mr-2">${i + 1}.</span>${html(o)}</div><div class="inline-flex rounded-lg overflow-hidden border border-slate-300" role="group">
        <button type="button" data-bs="${i}" data-val="B" aria-pressed="${a[i] === 'B'}" class="px-4 py-2 font-bold ${a[i] === 'B' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}">Benar</button>
        <button type="button" data-bs="${i}" data-val="S" aria-pressed="${a[i] === 'S'}" class="px-4 py-2 font-bold border-l border-slate-300 ${a[i] === 'S' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}">Salah</button></div></div>`; })}`;
    }
    var multi = it.jenis === 'PGK', cur = multi ? (Array.isArray(v) ? v : []) : [v];
    return h`${multi ? h`<p class="text-sm text-slate-500 -mb-1">Pilih satu atau lebih jawaban yang benar.</p>` : ''}${it.opsi.map(function (o, i) { var L = huruf(i), on = cur.indexOf(L) >= 0;
      return h`<button type="button" data-opt="${L}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${on}" class="text-left w-full rounded-xl border-2 p-3.5 flex items-start gap-3 transition-colors ${on ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}">
        <span class="shrink-0 w-9 h-9 ${multi ? 'rounded-lg' : 'rounded-full'} flex items-center justify-center font-extrabold ${on ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}">${on && multi ? raw('<span class="material-symbols-outlined text-[20px]">check</span>') : L}</span>
        <span class="flex-1 pt-1">${html(o)}</span>${on ? h`<span class="shrink-0 text-xs font-bold text-blue-700 inline-flex items-center gap-1 pt-1.5">${U.ic('check', 'text-[16px]')}Terpilih</span>` : ''}</button>`; })}`;
  }
  function onClick(e) {
    if (!X || !X.run) return; var t = e.target, b;
    if ((b = t.closest('[data-opt]'))) { var it = X.items[X.cur], L = b.dataset.opt;
      if (it.jenis === 'PG') X.ans[it.id] = X.ans[it.id] === L ? '' : L;
      else { var a = (X.ans[it.id] || []).slice(), k = a.indexOf(L); if (k >= 0) a.splice(k, 1); else a.push(L); X.ans[it.id] = a.sort(); }
      ubah(it.id); return; }
    if ((b = t.closest('[data-bs]'))) { var it2 = X.items[X.cur], a2 = Array.isArray(X.ans[it2.id]) ? X.ans[it2.id].slice() : []; while (a2.length < it2.opsi.length) a2.push(''); a2[+b.dataset.bs] = b.dataset.val; X.ans[it2.id] = a2; ubah(it2.id); return; }
    if ((b = t.closest('[data-go]'))) { pindah(X.cur + (+b.dataset.go)); return; }
    if ((b = t.closest('[data-nav]'))) { pindah(+b.dataset.nav); return; }
    if (t.closest('[data-ragu]')) { var id = X.items[X.cur].id; if (X.ragu[id]) delete X.ragu[id]; else X.ragu[id] = 1; X.raguDirty = true; simpanLokal(); render(); return; }
    if ((b = t.closest('[data-fs]'))) { var d = +b.dataset.fs; X.fs = d === 0 ? 1 : Math.max(0, Math.min(3, X.fs + d)); lsSet('cbt.fs', X.fs); render(); return; }
    if (t.closest('[data-help]')) { App.bantuanProktor(); return; }
    if (t.closest('[data-submit]')) { selesai(false); return; }
  }
  var uTimer = null;
  function onInput(e) {
    if (!X || !X.run || !e.target.matches('[data-uraian]')) return;
    var it = X.items[X.cur]; X.ans[it.id] = e.target.value; X.dirty[it.id] = 1; simpanLokal();
    clearTimeout(uTimer); uTimer = setTimeout(function () { segarkanNav(); }, 400);
  }
  function ubah(id) { X.dirty[id] = 1; simpanLokal(); render(); }
  function pindah(i) { if (i < 0 || i >= X.items.length) return; X.cur = i; X.curDirty = true; simpanLokal(); render(); if (Object.keys(X.dirty).length > 3) simpan(); }
  function segarkanNav() { if (!X) return; var c = hitung(), el = X.el; var a = $('[data-c-t]', el); if (!a) return; a.textContent = c.terjawab; $('[data-c-r]', el).textContent = c.ragu; $('[data-c-k]', el).textContent = c.kosong.length;
    $$('[data-nav]', el).forEach(function (b, i) { var it = X.items[i], on = i === X.cur; b.className = 'relative h-10 rounded-lg border font-bold text-sm ' + (on ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300' : X.ragu[it.id] ? 'bg-amber-100 text-amber-800 border-amber-400' : jawab(it) ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'); }); }
  function simpanLokal() { if (!X) return; lsSet(kunciLokal(), JSON.stringify({ a: X.ans, r: Object.keys(X.ragu), cur: X.cur, t: Date.now() })); }
  function status() {
    var s = $('#x-sync', X.el); if (!s) return;
    var n = Object.keys(X.dirty).length;
    if (X.saving) s.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/25 border border-sky-300/50 text-sky-100 text-xs font-semibold', s.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span>Menyimpan…';
    else if (!X.ok) s.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/30 border border-rose-300/60 text-rose-50 text-xs font-semibold', s.innerHTML = '<span class="material-symbols-outlined text-[16px]">cloud_off</span>Offline — tersimpan di perangkat';
    else if (n) s.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/25 border border-amber-300/50 text-amber-100 text-xs font-semibold', s.innerHTML = '<span class="material-symbols-outlined text-[16px]">cloud_upload</span>Menunggu sinkron (' + n + ')';
    else s.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs font-semibold', s.innerHTML = '<span class="material-symbols-outlined text-[16px]">cloud_done</span>Otomatis Tersimpan';
  }
  function tick() {
    if (!X || !X.run) return; var sisa = Math.floor((X.deadline - App.now()) / 1000), t = $('#x-timer', X.el);
    if (t) { var d = $('[data-t]', t); d.textContent = U.dur(sisa); t.classList.toggle('text-rose-300', sisa <= 300); t.classList.toggle('animate-pulse', sisa <= 60); }
    if (sisa === 300) U.toast('Waktu tersisa 5 menit.', 'warn'); if (sisa === 60) U.toast('Waktu tersisa 1 menit!', 'warn');
    if (sisa <= 0 && !X.kirim) { X.kirim = true; U.toast('Waktu habis. Jawaban dikumpulkan otomatis.', 'warn'); selesai(true); }
  }
  function blur_() { X.blurN++; X.blurKirim = (X.blurKirim || 0) + 1; if (X.blurN === 1) U.toast('Anda meninggalkan halaman ujian. Kejadian ini dicatat pada log proktor.', 'warn'); }
  function simpan(penuh) {
    if (!X || !X.run || X.saving) return Promise.resolve();
    var ids = Object.keys(X.dirty), perluRagu = X.raguDirty, perluCur = X.curDirty;
    if (!penuh && !ids.length && !perluRagu && !perluCur && !X.blurKirim) { return Promise.resolve(); }
    var jw = {}; if (penuh) { jw = JSON.parse(JSON.stringify(X.ans)); } else ids.forEach(function (id) { jw[id] = X.ans[id]; });
    var blur = Math.min(5, X.blurKirim || 0), payload = { ID_Jadwal: X.jid, jawaban: jw, base: X.v, penuh: !!penuh, ragu: Object.keys(X.ragu), cur: X.cur, blur: blur };
    X.saving = true; X.dirty = {}; X.raguDirty = false; X.curDirty = false; X.blurKirim = 0; status();
    return Api.call('ujian.simpan', payload, { timeout: 20000 }).then(function (r) {
      X.saving = false; if (!X.run) return;
      if (!r.success) {
        ids.forEach(function (id) { X.dirty[id] = 1; }); X.raguDirty = true; X.curDirty = true; X.blurKirim = (X.blurKirim || 0) + blur;
        if (r.code === 'NET') { X.ok = false; status(); return; }
        if (r.code === 'WAKTU_HABIS') { X.deadline = 0; tick(); return; }
        if (r.code === 'NOSESI') { X.run = false; cleanup(); U.toast(r.message, 'err'); App.go('siswa/jadwal', true); return; }
        if (r.code === 'DONE') { X.run = false; cleanup(); App.go('siswa/resi/' + X.jid, true); return; }
        status(); return;
      }
      X.ok = true;
      if (r.butuhPenuh) { X.v = r.v; return simpan(true); }
      X.v = r.v; if (typeof r.sisaDetik === 'number') X.deadline = App.now() + r.sisaDetik * 1000;
      status();
    });
  }
  function cleanup() { if (!X) return; clearInterval(X.tick); clearInterval(X.auto); X.run = false; }

  // ---- Validasi (w_18) & Konfirmasi (w_19) ----
  function selesai(paksa) {
    if (!X || !X.run) return; var c = hitung();
    if (paksa) return kirim(true);
    if (c.kosong.length) return validasi(c);
    konfirmasi(c);
  }
  function validasi(c) {
    var pct = Math.round(c.terjawab / X.items.length * 100), rg = X.items.map(function (b, i) { return X.ragu[b.id] ? i + 1 : 0; }).filter(Boolean);
    var chip = function (n, cls) { return '<button type="button" data-lompat="' + (n - 1) + '" class="w-10 h-10 rounded-lg border font-bold text-sm ' + cls + '">' + n + '</button>'; };
    var m = U.modal({ title: 'Peringatan: Asesmen Belum Lengkap!', width: 'max-w-2xl', sticky: true, noFocus: true,
      body: h`<div class="flex flex-col gap-4"><p class="text-sm text-slate-600 leading-relaxed">Masih terdapat butir soal yang belum Anda jawab${rg.length ? ' atau yang masih ditandai ragu-ragu' : ''}. Seluruh butir soal wajib dijawab sebelum asesmen dapat diakhiri.</p>
        <div class="grid grid-cols-3 gap-3 text-center"><div class="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><div class="text-2xl font-extrabold text-emerald-700">${c.terjawab}<span class="text-sm font-bold"> / ${X.items.length}</span></div><div class="text-[11px] uppercase font-bold text-emerald-700">Terjawab</div></div><div class="rounded-xl bg-amber-50 border border-amber-200 p-3"><div class="text-2xl font-extrabold text-amber-700">${c.ragu}</div><div class="text-[11px] uppercase font-bold text-amber-700">Ragu-ragu</div></div><div class="rounded-xl bg-rose-50 border border-rose-200 p-3"><div class="text-2xl font-extrabold text-rose-700">${c.kosong.length}</div><div class="text-[11px] uppercase font-bold text-rose-700">Kosong</div></div></div>
        <div><div class="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Progress Pengerjaan</span><span>${pct}%</span></div><div class="h-2.5 rounded-full bg-slate-200 overflow-hidden"><div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style="width:${pct}%"></div></div></div>
        <div><div class="text-xs font-bold text-rose-700 uppercase mb-1.5">Kosong / terlewat — wajib diisi</div><div class="flex flex-wrap gap-1.5" data-chips>${raw(c.kosong.map(function (n) { return chip(n, 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'); }).join(''))}</div></div>
        ${rg.length ? h`<div><div class="text-xs font-bold text-amber-700 uppercase mb-1.5">Ragu-ragu — mohon pastikan</div><div class="flex flex-wrap gap-1.5" data-chips>${raw(rg.map(function (n) { return chip(n, 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'); }).join(''))}</div></div>` : ''}
        <p class="text-xs text-slate-500 flex items-center gap-1.5">${U.ic('timer', 'text-[16px]')}Waktu tersisa Anda masih <b class="font-mono" data-sisa>${U.dur((X.deadline - App.now()) / 1000)}</b>.</p></div>`,
      buttons: [{ label: 'Periksa Kembali Jawaban', primary: true, onClick: function (x) { x.close(); } }] });
    m.body.addEventListener('click', function (e) { var b = e.target.closest('[data-lompat]'); if (b) { m.close(); pindah(+b.dataset.lompat); } });
  }
  function konfirmasi(c) {
    var m = U.modal({ title: 'Konfirmasi Pengumpulan Jawaban', width: 'max-w-lg', sticky: true, noFocus: true,
      body: h`<div class="flex flex-col gap-4"><div class="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-800">${U.ic('check_circle', 'text-[26px]')}<div class="text-sm"><b>${c.terjawab} / ${X.items.length} butir terjawab.</b> Seluruh soal sudah Anda jawab.</div></div>
        ${c.ragu ? h`<div class="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-amber-800">${U.ic('flag', 'text-[22px]')}<div class="text-sm">Masih ada <b>${c.ragu} butir</b> bertanda ragu-ragu. Anda masih dapat memeriksanya sebelum mengumpulkan.</div></div>` : ''}
        <p class="text-sm text-slate-600 leading-relaxed">Setelah dikumpulkan, jawaban <b>tidak dapat diubah</b> dan sesi asesmen ditutup.</p>
        <label class="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer"><input type="checkbox" data-jujur class="mt-0.5 w-5 h-5 rounded border-slate-400 text-blue-600"><span>Saya menyatakan bahwa jawaban ini saya kerjakan sendiri dengan jujur dan saya siap mengumpulkannya.</span></label></div>`,
      buttons: [{ label: 'Kembali Periksa', onClick: function (x) { x.close(); } }, { label: 'Ya, Kumpulkan Jawaban', primary: true, id: 'btn-kumpul', onClick: function (x, btn) { if (!$('[data-jujur]', x.body).checked) return U.toast('Centang pernyataan kejujuran terlebih dahulu.', 'warn'); kirim(false, x, btn); } }] });
  }
  function kirim(paksa, modal, btn) {
    if (X.sending) return; X.sending = true; if (btn) U.busy(btn, true, 'Mengumpulkan…');
    var overlay = null;
    if (paksa) { overlay = document.createElement('div'); overlay.className = 'fixed inset-0 z-[90] bg-slate-900/70 flex items-center justify-center text-white'; overlay.innerHTML = '<div class="text-center"><span class="material-symbols-outlined text-[48px] animate-spin">progress_activity</span><p class="mt-3 font-bold">Mengumpulkan jawaban…</p></div>'; document.body.appendChild(overlay); }
    var coba = function (n) {
      Api.call('ujian.submit', { ID_Jadwal: X.jid, jawaban: X.ans, ragu: Object.keys(X.ragu) }, { timeout: 40000 }).then(function (r) {
        if (!r.success && r.code === 'NET' && n < 5) return setTimeout(function () { coba(n + 1); }, 2000 * (n + 1));
        X.sending = false; if (btn) U.busy(btn, false); if (overlay) overlay.remove();
        if (!r.success) {
          if (r.code === 'BELUM_LENGKAP') { X.kirim = false; if (modal) modal.close(); return validasi(hitung()); }
          if (r.code === 'NET') { X.kirim = false; return U.toast('Koneksi terputus. Jawaban aman di perangkat; coba kumpulkan lagi saat koneksi pulih.', 'err'); }
          X.kirim = false; return U.toast(r.message, 'err');
        }
        var jid = X.jid, me = Api.me() || {}; cleanup(); lsDel(kunciLokal()); X = null; App.activeJadwal = null;
        if (modal) modal.close(); Api.invalidate('jadwal.list'); Api.seed('ujian.resi', { ID_Jadwal: jid }, { resi: r.resi });
        App.go('siswa/resi/' + jid, true);
      });
    };
    coba(0);
  }

  // =====================================================================
  // 3. Tanda Terima (w_20)
  // =====================================================================
  App.register('siswa/resi/:jid', {
    role: 'siswa', layout: 'siswa', title: 'Tanda Terima Pengerjaan', menu: 'siswa/jadwal',
    init: function (el) {
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'pdf') cetak(el._resi); else if (b.dataset.act === 'jadwal') App.go('siswa/jadwal'); else if (b.dataset.act === 'out') App.logout();
      });
    },
    show: function (el, ctx) {
      var jid = ctx.params.jid; U.mount(el, h`<div class="h-64 rounded-2xl bg-white/60 animate-pulse"></div>`);
      Api.swr('ujian.resi', { ID_Jadwal: jid }, function (r) {
        if (!r.success) return U.mount(el, h`${C.errorBox(r.message)}<div class="mt-4"><button type="button" data-act="jadwal" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Kembali ke Jadwal</button></div>`);
        el._resi = r.resi; drawResi(el, r.resi);
      });
    }
  });
  function menit(s) { return Math.max(1, Math.round((s || 0) / 60)); }
  function drawResi(el, r) {
    var lengkap = r.total ? Math.round(r.terjawab / r.total * 100) : 0, tunggu = r.status === 'Menunggu Koreksi';
    var qr = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=' + encodeURIComponent('CBT|' + r.idHasil + '|' + r.kode);
    var kv = function (k, v) { return h`<div class="flex justify-between gap-4 py-2 border-b border-slate-100 text-sm"><span class="text-slate-500">${k}</span><span class="font-semibold text-slate-800 text-right">${v}</span></div>`; };
    U.mount(el, h`<div class="max-w-5xl mx-auto flex flex-col gap-6">
      <section class="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8 text-center"><div class="mx-auto w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">${U.ic('check_circle', 'text-[52px]')}</div>
        <span class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold tracking-wide">${U.ic('bolt', 'text-[14px]')}SUBMISI TERSIMPAN AMAN</span>
        <h1 class="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900">Asesmen Berhasil Diserahkan &amp; Diverifikasi!</h1>
        <p class="mt-2 text-slate-600 max-w-2xl mx-auto">Jawaban ujian mata pelajaran <b>${r.mapel}</b> telah dicatat permanen dengan tingkat kelengkapan <b>${lengkap}% (${r.terjawab}/${r.total} butir soal)</b>. Sesi asesmen resmi ditutup dan terkunci aman.${r.cara === 'waktu' ? ' Pengumpulan dilakukan otomatis karena waktu habis.' : ''}</p>
        <div class="mt-5 flex flex-wrap items-center justify-center gap-3"><button type="button" data-act="pdf" class="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md inline-flex items-center gap-2">${U.ic('download')}Unduh Bukti Tanda Terima (PDF)</button><button type="button" data-act="jadwal" class="px-5 py-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2">${U.ic('calendar_month')}Kembali ke Jadwal Ujian</button><button type="button" data-act="out" class="px-5 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold hover:bg-rose-100 inline-flex items-center gap-2">${U.ic('logout')}Keluar dari Akun (Logout Aman)</button></div></section>
      <section class="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden"><div class="px-6 py-5 border-b border-slate-200 bg-slate-50 text-center"><div class="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Tanda Terima Bukti Pengerjaan Asesmen</div><div class="text-xl font-extrabold text-slate-900">${r.sekolah || ''}</div><div class="text-xs text-slate-500 mt-0.5">Tahun Ajaran ${r.tahunAjaran || '—'} · Kode Verifikasi: <span class="font-mono font-bold">${r.kode}</span></div></div>
        <div class="p-6 grid md:grid-cols-2 gap-x-8 gap-y-5"><div><div class="font-bold text-slate-800 mb-1 inline-flex items-center gap-1.5">${U.ic('person', 'text-blue-600')}Identitas Siswa &amp; Lokasi Ujian</div>${kv('Nama Lengkap', r.nama)}${kv('NISN', r.nisn)}${kv('Kelas / Rombel', r.kelas)}${kv('Meja Lab Komputer', (r.meja ? 'Meja ' + r.meja : '—') + (r.lab ? ' (' + r.lab + ')' : ''))}${kv('Guru Pengampu', r.guru || '—')}${kv('Mata Pelajaran', r.mapel)}</div>
          <div><div class="font-bold text-slate-800 mb-1 inline-flex items-center gap-1.5">${U.ic('analytics', 'text-blue-600')}Statistik &amp; Validasi Submission</div>${kv('Jadwal', U.hariTgl(r.tanggal) + ', ' + r.jam)}${kv('Butir Soal Terjawab', r.terjawab + ' / ' + r.total + ' (' + lengkap + '%)')}${kv('Ditandai Ragu-ragu', r.ragu)}${kv('Durasi Pengerjaan', menit(r.durasiDetik) + ' Menit')}${kv('Dikumpulkan', r.dikumpulkan)}${kv('Status Penilaian', tunggu ? 'Menunggu koreksi guru (uraian)' : 'Tercatat — nilai diumumkan oleh guru')}</div></div>
        <div class="px-6 pb-6 flex flex-wrap items-center gap-5"><img src="${qr}" alt="QR verifikasi" width="110" height="110" class="rounded-lg border border-slate-200" loading="lazy" onerror="this.style.display='none'"><p class="text-xs text-slate-500 max-w-md leading-relaxed">Pindai QR atau tunjukkan kode verifikasi <span class="font-mono font-bold text-slate-700">${r.kode}</span> kepada guru/proktor untuk memastikan keabsahan data submisi Anda. Nilai tidak ditampilkan kepada siswa pada halaman ini.</p></div></section></div>`);
  }
  function cetak(r) {
    if (!r) return; var e = esc, lengkap = r.total ? Math.round(r.terjawab / r.total * 100) : 0;
    var rows = [['Nama', r.nama], ['NISN', r.nisn], ['Kelas', r.kelas], ['Meja / Lab', (r.meja || '—') + (r.lab ? ' / ' + r.lab : '')], ['Mata Pelajaran', r.mapel], ['Guru Pengampu', r.guru || '—'], ['Jadwal', r.hari + ', ' + r.tanggal + ' ' + r.jam], ['Butir Terjawab', r.terjawab + ' / ' + r.total + ' (' + lengkap + '%)'], ['Ragu-ragu', r.ragu], ['Durasi', menit(r.durasiDetik) + ' menit'], ['Dikumpulkan', r.dikumpulkan], ['Kode Verifikasi', r.kode]];
    C.print('Tanda Terima ' + r.nama, '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px"><div style="text-align:center;border-bottom:3px double #333;padding-bottom:10px"><div style="font-size:12px;letter-spacing:1px">TANDA TERIMA BUKTI PENGERJAAN ASESMEN</div><div style="font-size:20px;font-weight:bold">' + e(r.sekolah || '') + '</div><div style="font-size:12px">Tahun Ajaran ' + e(r.tahunAjaran || '') + '</div></div><table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">' + rows.map(function (x) { return '<tr><td style="padding:6px 8px;border-bottom:1px solid #ddd;width:38%;color:#555">' + e(x[0]) + '</td><td style="padding:6px 8px;border-bottom:1px solid #ddd;font-weight:bold">' + e(x[1]) + '</td></tr>'; }).join('') + '</table><p style="font-size:12px;color:#555;margin-top:18px">Dokumen ini dibuat otomatis oleh sistem sebagai bukti bahwa jawaban telah dikumpulkan. Nilai diumumkan oleh guru mata pelajaran.</p></div>');
  }

  // =====================================================================
  // 4. Riwayat Pengumpulan
  // =====================================================================
  App.register('siswa/riwayat', {
    role: 'siswa', layout: 'siswa', title: 'Riwayat Pengumpulan',
    prefetch: function () { return [{ action: 'jadwal.list', data: {} }]; },
    init: function (el) { el.addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) App.go('siswa/resi/' + b.dataset.id); }); },
    show: function (el) {
      Api.swr('jadwal.list', {}, function (r) {
        if (!r.success) return U.mount(el, C.errorBox(r.message));
        var l = (r.jadwal || []).filter(function (j) { return j.sudahKumpul; });
        U.mount(el, h`<div class="max-w-5xl mx-auto flex flex-col gap-5"><div><h1 class="text-2xl font-extrabold text-slate-900">Riwayat Pengumpulan</h1><p class="text-sm text-slate-500">Asesmen yang sudah Anda kumpulkan. Nilai diumumkan oleh guru mata pelajaran.</p></div>
          <section class="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">${l.length ? h`<ul class="divide-y divide-slate-100">${l.map(function (j) { return h`<li class="p-4 flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3"><span class="w-10 h-10 rounded-lg ${warna(j.Mapel)} font-extrabold flex items-center justify-center text-sm">${U.initials(j.Mapel)}</span><div><div class="font-bold text-slate-800">${j.Mapel}</div><div class="text-xs text-slate-500">${U.hariTgl(j.Tanggal)} · ${j.JamMulai}–${j.JamSelesai} WIB</div></div></div><div class="flex items-center gap-3">${U.badge('Sudah Dikumpulkan', 'ok', true)}<button type="button" data-id="${j.ID_Jadwal}" class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 inline-flex items-center gap-1">${U.ic('receipt_long', 'text-[16px]')}Tanda Terima</button></div></li>`; })}</ul>` : h`<div class="p-10 text-center text-slate-500">${U.ic('history_edu', 'text-[40px] text-slate-300')}<p class="mt-2">Belum ada asesmen yang dikumpulkan.</p></div>`}</section></div>`);
      });
    }
  });
})();
