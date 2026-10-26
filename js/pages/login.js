/* login.js — Login Siswa (login_siswa_portal_asesmen_cbt) & Login Guru/Admin (login_terpadu_guru_admin) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$;
  var PUB_KEY = 'cbt.pubcfg';
  function pubCfg() { try { return JSON.parse(localStorage.getItem(PUB_KEY) || '{}'); } catch (e) { return {}; } }
  function loadPub(cb) {
    cb(pubCfg());
    Api.call('pub.config', {}, { noAuth: true, retry: true }).then(function (r) { if (r.success) { try { localStorage.setItem(PUB_KEY, JSON.stringify(r.config)); } catch (e) { } App.config = r.config; cb(r.config); } });
  }
  function errMsg(r) {
    if (r.code === 'DEVICE_LOCK') return r.message;
    if (r.code === 'LOCKED') return r.message;
    return r.message || 'Gagal masuk.';
  }
  function headerBar(sub) {
    return '<header class="w-full py-space-md px-margin md:px-margin-desktop flex items-center justify-between"><div class="flex items-center gap-space-sm"><div class="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"><img alt="Logo sekolah" class="w-full h-full object-contain" src="img/logo.png"></div><div class="flex flex-col"><span class="font-headline-sm text-headline-sm text-on-surface leading-tight">CBT Mandiri</span><span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Sistem Asesmen Terpadu</span></div></div>' +
      '<div class="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-status-success-bg text-status-success-text"><span class="w-2 h-2 rounded-full bg-status-success-text animate-pulse"></span><span class="font-label-sm text-label-sm font-semibold">Server: Online</span></div></header>';
  }
  function footerBar() {
    return '<footer class="w-full py-space-md px-margin md:px-margin-desktop"><div class="max-w-md mx-auto flex flex-col items-center gap-space-xs text-center"><div class="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm"><span class="material-symbols-outlined text-[16px] text-primary">verified_user</span><span>Data tersimpan di Google Sheets milik sekolah</span></div><p class="font-body-sm text-[11px] text-outline">© <span data-year></span> <span data-school2>SMA Negeri 1 Kamal</span>. Sistem Asesmen Terkomputerisasi.</p></div></footer>';
  }
  function eye(inputId, btnId) { var i = $('#' + inputId), b = $('#' + btnId); b.onclick = function () { var t = i.type === 'password'; i.type = t ? 'text' : 'password'; b.querySelector('span').textContent = t ? 'visibility_off' : 'visibility'; }; }

  // ======================= SISWA =======================
  App.register('login', {
    public: true, layout: 'login', title: 'Login Peserta Asesmen',
    init: function (el) {
      el.className = 'bg-canvas-background font-body-md text-on-surface min-h-screen flex flex-col justify-between selection:bg-primary-fixed';
      el.innerHTML = headerBar() + '<main class="flex-1 flex items-center justify-center w-full px-margin py-space-xl"><div class="w-full max-w-md"><div class="w-full bg-surface-card rounded-xl shadow-[0_12px_36px_rgba(11,28,48,0.06),0_2px_8px_rgba(11,28,48,0.04)] overflow-hidden">' +
        '<div class="bg-surface-container-high px-space-md py-space-sm flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm"><div class="flex items-center gap-space-xs"><span class="w-2 h-2 rounded-full bg-status-success-text animate-ping"></span><span class="font-tabular-code text-tabular-code text-status-success-text">SESI TERKONEKSI</span></div><div class="flex items-center gap-1 text-primary"><span class="material-symbols-outlined text-[15px] fill">security</span><span>Device Lock: Aktif</span></div></div>' +
        '<div class="p-space-lg md:p-space-xl flex flex-col gap-space-lg"><div class="flex flex-col items-center text-center"><div class="relative mb-space-sm"><div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center shadow-sm"><img alt="" class="w-12 h-12 object-contain" src="img/logo.png"></div></div>' +
        '<div class="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm mb-1.5"><span class="material-symbols-outlined text-[14px]">domain</span><span data-school>SMA Negeri 1 Kamal</span></div>' +
        '<h1 class="font-headline-md text-headline-md text-on-surface tracking-tight">Login Peserta Asesmen</h1><p class="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xs">Masukkan NISN dan Passkey sesuai Kartu Peserta Ujian Anda untuk membuka ruang ujian.</p></div>' +
        '<form class="flex flex-col gap-space-md" id="sl-form" autocomplete="off" novalidate>' +
        '<div class="flex flex-col gap-1.5"><div class="flex items-center justify-between"><label class="font-label-md text-label-md text-on-surface" for="sl-nisn">Nomor Induk Siswa Nasional (NISN)</label><span class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-[10px]" id="sl-count">0/10 Digit</span></div>' +
        '<div class="relative flex items-center"><span class="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">assignment_ind</span><input id="sl-nisn" inputmode="numeric" maxlength="32" autocomplete="username" placeholder="Contoh: 0068492041" class="w-full h-11 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-border-standard text-on-surface font-tabular-code text-tabular-code placeholder:text-outline-variant placeholder:font-body-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"></div></div>' +
        '<div class="flex flex-col gap-1.5"><div class="flex items-center justify-between"><label class="font-label-md text-label-md text-on-surface" for="sl-pass">Passkey Sesi Ujian</label><span class="font-label-sm text-[11px] text-primary flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">vpn_key</span>Tertera di kartu</span></div>' +
        '<div class="relative flex items-center"><span class="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">lock</span><input id="sl-pass" type="password" autocomplete="current-password" placeholder="••••••••" maxlength="40" class="w-full h-11 pl-10 pr-11 rounded-lg bg-surface-container-lowest border border-border-standard text-on-surface font-tabular-code text-tabular-code tracking-widest placeholder:tracking-normal placeholder:text-outline-variant focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"><button type="button" id="sl-eye" aria-label="Tampilkan atau sembunyikan passkey" class="absolute right-2 w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[20px]">visibility</span></button></div></div>' +
        '<div class="bg-status-info-bg/70 p-space-sm rounded-lg flex gap-space-sm items-start"><div class="w-7 h-7 rounded-md bg-status-info-text text-white flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-[16px]">devices</span></div><div class="flex flex-col gap-1"><div class="flex items-center gap-1.5"><span class="font-label-sm text-label-sm text-status-info-text font-bold">Proteksi Perangkat Aktif</span><span class="w-1.5 h-1.5 rounded-full bg-status-info-text animate-pulse"></span></div><p class="font-body-sm text-[12px] text-status-info-text/90 leading-snug">Satu akun hanya dapat dipakai di satu perangkat. Login di perangkat lain akan ditolak selama sesi ujian berlangsung.</p></div></div>' +
        '<div id="sl-err" class="hidden items-start gap-2 p-space-sm rounded-lg bg-status-error-bg text-status-error-text font-body-sm" role="alert"><span class="material-symbols-outlined text-[18px] shrink-0">error</span><span data-m></span></div>' +
        '<button type="submit" id="sl-btn" class="w-full h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-60"><span>Masuk Ruang Asesmen</span><span class="material-symbols-outlined">arrow_forward</span></button></form>' +
        '<div class="flex flex-col items-center gap-space-sm pt-space-xs text-center"><div class="flex items-center gap-1 text-on-surface-variant font-body-sm"><span class="material-symbols-outlined text-[16px] text-status-warning-text">support_agent</span><span>Kendala login atau lupa passkey?</span><button type="button" id="sl-help" class="font-label-md text-primary hover:underline">Hubungi Proktor</button></div><div class="w-full h-px bg-surface-container my-1"></div><a class="inline-flex items-center gap-1 font-label-md text-on-surface-variant hover:text-primary transition-colors py-1" href="#/login/staf"><span class="material-symbols-outlined text-[18px]">manage_accounts</span>Masuk sebagai Guru / Administrator</a></div></div>' +
        '<div class="bg-surface-container-low px-space-md py-space-sm flex flex-wrap items-center justify-between gap-y-2 text-on-surface-variant font-label-sm text-[11px]"><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-status-success-text"></span><span class="font-tabular-code">Database Siap</span></div><div class="flex items-center gap-1 text-outline"><span class="font-tabular-code">GAS Engine <span data-ver>v1.0.0</span></span></div></div></div></div></main>' + footerBar();
      var nisn = $('#sl-nisn', el), pass = $('#sl-pass', el), btn = $('#sl-btn', el), err = $('#sl-err', el);
      eye('sl-pass', 'sl-eye'); el.querySelector('[data-year]').textContent = new Date().getFullYear();
      nisn.oninput = function () { var d = nisn.value.replace(/\D/g, ''); if (/^\d*$/.test(nisn.value)) $('#sl-count', el).textContent = d.length + '/10 Digit'; };
      $('#sl-help', el).onclick = function () {
        U.modal({ title: 'Pusat Bantuan Lab Ujian', width: 'max-w-sm', footer: false, body: h`<p class="font-body-sm text-on-surface-variant mb-3">Jika kartu peserta hilang atau akun terkunci pada perangkat lain:</p><div class="flex flex-col gap-2 font-body-sm">${['Angkat tangan tanpa meninggalkan bangku Anda di ruangan tes.', 'Sebutkan NISN kepada Proktor agar kunci perangkat pada akun Anda direset.', 'Mintalah cetak ulang kartu peserta bila passkey hilang.'].map(function (t, i) { return h`<div class="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2"><span class="font-tabular-code font-bold text-primary">0${i + 1}.</span><span>${t}</span></div>`; })}</div>` });
      };
      $('#sl-form', el).onsubmit = function (e) {
        e.preventDefault(); err.classList.add('hidden'); err.classList.remove('flex');
        var u = nisn.value.trim(), p = pass.value;
        if (!u || !p) { show('Isi NISN dan passkey terlebih dahulu.'); return; }
        U.busy(btn, true, 'Memverifikasi…');
        Api.call('auth.login', { role: 'siswa', username: u, password: p, deviceId: Api.deviceId() }, { noAuth: true }).then(function (r) {
          if (!r.success) { U.busy(btn, false); show(errMsg(r)); pass.select(); return; }
          App.afterLogin(r).then(function () { U.busy(btn, false); pass.value = ''; App.go('siswa/jadwal'); });
        });
      };
      function show(m) { err.classList.remove('hidden'); err.classList.add('flex'); $('[data-m]', err).textContent = m; }
    },
    show: function (el) {
      loadPub(function (c) { var s = c.NAMA_SEKOLAH || 'SMA Negeri 1 Kamal'; $('[data-school]', el).textContent = s; $('[data-school2]', el).textContent = s; });
      Api.warm('login'); setTimeout(function () { var n = $('#sl-nisn', el); if (n && !n.value) n.focus(); }, 50);
    }
  });

  // ======================= GURU / ADMIN =======================
  App.register('login/staf', {
    public: true, layout: 'login', title: 'Login Guru & Administrator',
    init: function (el) {
      el.className = 'bg-canvas-background font-body-md text-on-surface min-h-screen flex flex-col justify-between selection:bg-primary-fixed';
      el.innerHTML = headerBar() + '<main class="flex-1 flex items-center justify-center w-full px-margin py-space-xl"><div class="w-full max-w-lg relative"><div class="absolute -top-10 -left-10 w-44 h-44 bg-surface-variant/40 rounded-full blur-3xl pointer-events-none"></div><div class="absolute -bottom-10 -right-10 w-48 h-48 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>' +
        '<div class="relative bg-surface-card rounded-xl shadow-xl p-space-lg sm:p-space-xl flex flex-col gap-space-lg overflow-hidden">' +
        '<div class="flex flex-col items-center text-center gap-space-xs"><div class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-primary text-label-sm font-label-sm tracking-wide mb-space-xs"><span class="material-symbols-outlined text-[15px] fill">shield_person</span>Akses Terbatas Staf Sekolah</div><h1 class="font-headline-md text-headline-md text-on-surface tracking-tight">Portal Manajemen Asesmen</h1><p class="font-body-sm text-body-sm text-on-surface-variant max-w-sm">Masuk untuk kelola bank soal, jadwal ujian, cetak kartu, dan rekapitulasi nilai terpadu.</p></div>' +
        '<div class="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg"><div class="flex items-center gap-space-sm"><img src="img/logo.png" alt="" class="w-8 h-8 object-contain shrink-0"><div class="flex flex-col text-left"><span class="font-label-md text-label-md text-on-surface leading-tight" data-school>SMA Negeri 1 Kamal</span><span class="font-label-sm text-label-sm text-on-surface-variant" data-ta></span></div></div><div class="flex items-center gap-1 text-status-success-text bg-status-success-bg px-2 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-status-success-text animate-pulse"></span><span class="font-label-sm text-label-sm font-semibold">Aktif</span></div></div>' +
        '<div class="flex flex-col gap-space-xs"><div class="grid grid-cols-2 p-1 bg-surface-container-low rounded-lg gap-1" role="tablist"><button type="button" role="tab" data-role="guru" class="flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg transition-all font-label-md"><span class="material-symbols-outlined text-[18px]">co_present</span>Guru</button><button type="button" role="tab" data-role="admin" class="flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg transition-all font-label-md"><span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>Administrator</button></div>' +
        '<div class="flex items-center px-1"><span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1" id="st-desc"></span></div></div>' +
        '<form class="flex flex-col gap-space-md" id="st-form" novalidate><div class="flex flex-col gap-1.5 text-left"><label class="font-label-md text-label-md text-on-surface flex items-center justify-between" for="st-id"><span id="st-idl">NIP (Nomor Induk Pegawai)</span><span class="font-body-sm text-body-sm text-on-surface-variant/70 font-normal" id="st-idh">Format 18 Digit</span></label><div class="relative flex items-center"><span class="material-symbols-outlined absolute left-3 text-tertiary text-[20px] pointer-events-none" id="st-idi">badge</span><input id="st-id" autocomplete="username" class="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-lg border border-transparent text-on-surface font-tabular-code text-tabular-code placeholder:text-on-surface-variant/50 focus:bg-surface-card focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all"></div></div>' +
        '<div class="flex flex-col gap-1.5 text-left"><div class="flex items-center justify-between"><label class="font-label-md text-label-md text-on-surface" for="st-pass">Kata Sandi Akun</label><button type="button" id="st-forgot" class="font-label-sm text-label-sm text-primary hover:text-primary-container">Lupa sandi?</button></div><div class="relative flex items-center"><span class="material-symbols-outlined absolute left-3 text-tertiary text-[20px] pointer-events-none">lock</span><input id="st-pass" type="password" autocomplete="current-password" placeholder="••••••••••" class="w-full pl-10 pr-10 py-2.5 bg-surface-container-low rounded-lg border border-transparent text-on-surface focus:bg-surface-card focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all"><button type="button" id="st-eye" aria-label="Tampilkan atau sembunyikan sandi" class="absolute right-3 text-on-surface-variant hover:text-on-surface flex items-center p-1"><span class="material-symbols-outlined text-[18px]">visibility</span></button></div></div>' +
        '<div id="st-err" class="hidden items-start gap-2 p-space-sm rounded-lg bg-status-error-bg text-status-error-text font-body-sm" role="alert"><span class="material-symbols-outlined text-[18px] shrink-0">error</span><span data-m></span></div>' +
        '<button type="submit" id="st-btn" class="w-full h-11 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-space-xs hover:bg-primary-container transition-all shadow-md active:scale-[0.99] mt-1 disabled:opacity-60"><span>Masuk ke Dashboard</span><span class="material-symbols-outlined text-[18px]">login</span></button></form>' +
        '<div class="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-high/40 text-on-surface-variant text-left"><span class="material-symbols-outlined text-[20px] text-primary shrink-0 fill">enhanced_encryption</span><div class="flex flex-col"><span class="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">Sandi dienkripsi &amp; sesi dibatasi waktu</span><span class="font-body-sm text-[11px] leading-tight">Akun dikelola Administrator. Percobaan salah berulang akan dikunci sementara.</span></div></div>' +
        '<div class="pt-space-xs flex flex-col items-center"><a class="inline-flex items-center gap-1.5 font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors py-1" href="#/login"><span class="material-symbols-outlined text-[18px]">arrow_back</span>Kembali ke Login Siswa</a></div></div></div></main>' + footerBar();
      var role = 'guru', idI = $('#st-id', el), pass = $('#st-pass', el), btn = $('#st-btn', el), err = $('#st-err', el);
      function setRole(r) {
        role = r;
        el.querySelectorAll('[data-role]').forEach(function (b) { var on = b.dataset.role === r; b.className = 'flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg transition-all font-label-md ' + (on ? 'bg-surface-card text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'); b.setAttribute('aria-selected', on); });
        $('#st-idl', el).textContent = r === 'guru' ? 'NIP (Nomor Induk Pegawai)' : 'Nama Pengguna Administrator'; $('#st-idh', el).textContent = r === 'guru' ? 'Format 18 Digit' : 'Contoh: admin';
        $('#st-idi', el).textContent = r === 'guru' ? 'badge' : 'person'; idI.placeholder = r === 'guru' ? '19740510 199903 1 002' : 'admin'; idI.inputMode = r === 'guru' ? 'numeric' : 'text';
        $('#st-desc', el).innerHTML = '<span class="material-symbols-outlined text-[14px] text-primary">check_circle</span><span>' + (r === 'guru' ? 'Akses Bank Soal, Editor Butir, Rekap Nilai, dan Catatan Siswa.' : 'Akses penuh: data master, jadwal, token, kartu, template, dan pengaturan sistem.') + '</span>';
      }
      el.querySelectorAll('[data-role]').forEach(function (b) { b.onclick = function () { setRole(b.dataset.role); idI.focus(); }; }); setRole('guru'); eye('st-pass', 'st-eye');
      $('#st-forgot', el).onclick = function () { U.toast('Hubungi Administrator sekolah untuk mengatur ulang sandi Anda.', 'info', 5000); };
      $('#st-form', el).onsubmit = function (e) {
        e.preventDefault(); err.classList.add('hidden'); err.classList.remove('flex');
        var u = idI.value.trim(), p = pass.value; if (!u || !p) { m('Isi identitas dan kata sandi.'); return; }
        U.busy(btn, true, 'Memverifikasi…');
        Api.call('auth.login', { role: role, username: u, password: p }, { noAuth: true }).then(function (r) {
          if (!r.success) { U.busy(btn, false); m(errMsg(r)); pass.select(); return; }
          App.afterLogin(r).then(function () { U.busy(btn, false); pass.value = ''; App.go(App.home(r.me.role)); });
        });
      };
      function m(t) { err.classList.remove('hidden'); err.classList.add('flex'); $('[data-m]', err).textContent = t; }
    },
    show: function (el) {
      loadPub(function (c) { $('[data-school]', el).textContent = c.NAMA_SEKOLAH || 'SMA Negeri 1 Kamal'; $('[data-school2]', el).textContent = c.NAMA_SEKOLAH || 'SMA Negeri 1 Kamal'; $('[data-ta]', el).textContent = c.TAHUN_AJARAN ? 'TA ' + c.TAHUN_AJARAN + ' • Semester ' + (c.SEMESTER || '') : ''; });
      Api.warm('login'); setTimeout(function () { var n = $('#st-id', el); if (n && !n.value) n.focus(); }, 50);
    }
  });

  App.register('404', { public: true, layout: 'login', title: 'Halaman tidak ditemukan', init: function (el) { el.className = 'min-h-screen flex items-center justify-center bg-canvas-background p-6'; el.innerHTML = '<div class="text-center max-w-sm"><span class="material-symbols-outlined text-[56px] text-outline">travel_explore</span><h1 class="font-headline-md text-on-surface mt-2">Halaman tidak ditemukan</h1><p class="font-body-md text-on-surface-variant mt-1">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p><a href="#/" class="inline-flex mt-4 px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md">Kembali ke Beranda</a></div>'; } });
})();
