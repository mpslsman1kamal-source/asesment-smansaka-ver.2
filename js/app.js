/* app.js — router hash, cangkang (layout) per peran, boot, prefetch */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$;
  var pages = {}, cache = {}, cur = null, App = { config: {}, ver: '', latency: null };
  var LOGO = 'img/logo.png';

  // ---------- Menu per peran ----------
  var MENU = {
    admin: [
      { g: 'UTAMA', items: [['admin/dashboard', 'dashboard', 'Dashboard Admin'], ['admin/siswa', 'group', 'Data Siswa'], ['admin/kelas', 'domain', 'Data Kelas/Rombel'], ['admin/guru', 'badge', 'Data Guru']] },
      { g: 'ASESMEN', items: [['admin/soal', 'quiz', 'Model & Bank Soal'], ['admin/jadwal', 'calendar_month', 'Jadwal Asesmen'], ['admin/token', 'key', 'Token Ujian'], ['admin/kartu', 'badge', 'Cetak Kartu Asesmen']] },
      { g: 'SISTEM & DOKUMEN', items: [['admin/template', 'folder_zip', 'Template Berkas'], ['admin/rekap', 'table_chart', 'Portal Guru & Rekap'], ['admin/pengaturan', 'settings', 'Pengaturan Sistem'], ['portal-siswa', 'laptop_chromebook', 'Portal CBT Siswa']] }
    ],
    guru: [
      { g: 'MENU GURU', items: [['guru/dashboard', 'space_dashboard', 'Dashboard Guru'], ['guru/bank-soal', 'menu_book', 'Bank Soal Mandiri'], ['guru/editor', 'edit_note', 'Editor Butir Soal'], ['guru/rekap', 'table_chart', 'Rekap Nilai Siswa'], ['guru/catatan', 'rate_review', 'Catatan Perilaku'], ['guru/jadwal', 'calendar_month', 'Jadwal Asesmen'], ['guru/panduan', 'menu_book', 'Panduan Penilaian']] }
    ]
  };

  // ---------- Router ----------
  function register(path, def) { def.path = path; def.parts = path.split('/'); pages[path] = def; }
  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, ''), q = raw.split('?'), path = q[0].replace(/\/+$/, ''), query = {};
    (q[1] || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return { path: path, query: query };
  }
  function match(path) {
    var seg = path.split('/');
    for (var k in pages) {
      var d = pages[k]; if (d.parts.length !== seg.length) continue;
      var params = {}, ok = true;
      for (var i = 0; i < seg.length; i++) { if (d.parts[i][0] === ':') params[d.parts[i].slice(1)] = decodeURIComponent(seg[i]); else if (d.parts[i] !== seg[i]) { ok = false; break; } }
      if (ok) return { def: d, params: params };
    }
    return null;
  }
  function go(path, replace) { var t = '#/' + path.replace(/^#?\/?/, ''); if (location.hash === t) { route(); return; } if (replace) location.replace(t); else location.hash = t; }
  function home(role) { return role === 'admin' ? 'admin/dashboard' : role === 'guru' ? 'guru/dashboard' : role === 'siswa' ? 'siswa/jadwal' : 'login'; }

  var token = 0;
  function route() {
    var me = Api.me(), hs = parseHash(), path = hs.path || '';
    if (!path) { go(home(me && me.role), true); return; }
    var m = match(path);
    if (!m) { m = { def: pages['404'], params: {} }; }
    var def = m.def;
    if (def.role && (!me || def.role !== me.role)) {
      if (!me) { go(def.role === 'siswa' ? 'login' : 'login/staf', true); return; }
      go(home(me.role), true); return;
    }
    if (def.public && me && /^login/.test(def.path)) { go(home(me.role), true); return; }
    // tinggalkan halaman sebelumnya
    if (cur && cur.def.hide) { try { cur.def.hide(cur.el); } catch (e) { } }
    var my = ++token, layout = Shell.layout(def.layout || (me ? (me.role === 'siswa' ? 'siswa' : 'staf') : 'login'));
    Shell.activate(layout, def, me);
    var key = path.replace(/\/[^/]*$/, '') === path ? path : def.path; // satu wadah per definisi
    var el = cache[def.path];
    if (!el) { el = document.createElement('section'); el.dataset.page = def.path; el.className = 'page-view'; layout.view.appendChild(el); cache[def.path] = el; if (def.init) def.init(el, { params: m.params, query: hs.query }); }
    Array.prototype.forEach.call(layout.view.children, function (c) { c.hidden = c !== el; });
    el.classList.remove('page-in'); void el.offsetWidth; el.classList.add('page-in');
    cur = { def: def, el: el };
    document.title = (def.title ? def.title + ' · ' : '') + (App.config.NAMA_APLIKASI || 'Asesmen Online');
    if (!def.keepScroll) window.scrollTo(0, 0);
    if (def.show) def.show(el, { params: m.params, query: hs.query, token: my });
  }

  // ---------- Cangkang ----------
  var Shell = (function () {
    var layouts = {}, activeL = null;
    function mk(name) {
      var root = document.createElement('div'); root.id = 'L-' + name; root.hidden = true; $('#app').appendChild(root);
      var L = { name: name, root: root, view: root };
      if (name === 'staf') buildStaf(L);
      else if (name === 'siswa') buildSiswa(L);
      layouts[name] = L; return L;
    }
    function layout(name) { return layouts[name] || mk(name); }
    function activate(L, def, me) {
      if (activeL && activeL !== L) activeL.root.hidden = true;
      L.root.hidden = false; activeL = L;
      if (L.name === 'staf') stafMenu(L, me, def);
      if (L.name === 'siswa') siswaMenu(L, me, def);
    }

    // ---- staf (admin/guru) ----
    function buildStaf(L) {
      L.root.innerHTML = '<div id="staf-overlay" class="fixed inset-0 bg-black/40 z-40 hidden lg:hidden"></div>' +
        '<aside id="staf-aside" class="fixed left-0 top-0 h-full w-[220px] bg-inverse-surface z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.06)] -translate-x-full lg:translate-x-0 transition-transform duration-200">' +
        '<div class="h-16 flex items-center px-space-md gap-space-sm shrink-0"><div class="w-9 h-9 flex items-center justify-center shrink-0"><img src="' + LOGO + '" alt="Logo sekolah" class="w-full h-full object-contain drop-shadow"></div><div class="flex flex-col"><span class="font-headline-sm text-[14px] text-inverse-on-surface font-semibold tracking-tight leading-tight" data-app-name>GAS System</span><span class="font-label-sm text-[10px] text-tertiary-fixed-dim uppercase tracking-wider">CBT Enterprise</span></div></div>' +
        '<div class="flex-1 overflow-y-auto px-space-xs py-space-sm no-scrollbar"><nav class="flex flex-col gap-1" id="staf-nav" aria-label="Menu utama"></nav></div>' +
        '<div class="p-space-sm bg-inverse-surface/80 m-space-xs rounded-lg"><div class="flex items-center justify-between"><span class="font-label-sm text-label-sm text-tertiary-fixed-dim">Versi Sistem</span><span class="font-tabular-code text-[11px] font-medium text-inverse-on-surface" data-ver>v1.0.0</span></div></div></aside>' +
        '<div class="lg:pl-[220px]"><header class="fixed top-0 left-0 lg:left-[220px] right-0 h-16 bg-surface-card/95 backdrop-blur-md shadow-[0_1px_8px_rgba(11,31,58,0.04)] z-30 flex items-center justify-between px-space-md lg:px-space-gutter-desktop">' +
        '<div class="flex items-center gap-space-sm min-w-0"><button type="button" id="staf-burger" class="lg:hidden p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low" aria-label="Buka menu"><span class="material-symbols-outlined">menu</span></button>' +
        '<img src="' + LOGO + '" alt="" class="h-9 w-auto object-contain drop-shadow-sm hidden sm:block"><div class="flex flex-col min-w-0"><div class="flex items-center gap-space-xs"><span class="font-headline-sm text-[15px] font-bold text-on-surface leading-tight truncate" data-school>SMA Negeri 1 Kamal</span><span class="hidden sm:inline font-label-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-low text-secondary font-semibold" data-role-badge>Admin</span></div><span class="font-body-sm text-[11px] text-on-surface-variant hidden sm:block" data-sub></span></div></div>' +
        '<div class="flex items-center gap-space-sm md:gap-space-md shrink-0"><div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success-bg text-status-success-text" id="staf-status"><span class="w-2 h-2 rounded-full bg-status-success-text animate-pulse"></span><span class="font-label-sm text-[11px] font-semibold tracking-wide" data-st>Sistem Normal</span></div>' +
        '<div class="hidden lg:flex items-center gap-1.5 text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">calendar_today</span><span class="font-tabular-code text-[12px]" data-date></span></div>' +
        '<div class="relative"><button type="button" id="staf-user" class="flex items-center gap-space-sm pl-space-sm rounded-lg hover:bg-surface-container-low pr-1 py-1" aria-haspopup="menu"><div class="hidden sm:flex flex-col items-end"><span class="font-label-md text-[13px] font-semibold text-on-surface leading-none" data-uname></span><span class="flex items-center gap-1 text-primary font-label-sm text-[11px] font-medium">Akun <span class="material-symbols-outlined text-[14px]">expand_more</span></span></div><div class="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[12px] ring-2 ring-primary-fixed" data-av>A</div></button>' +
        '<div id="staf-menu" class="hidden absolute right-0 mt-2 w-56 bg-surface-card rounded-xl shadow-xl border border-border-standard py-1 z-50" role="menu"></div></div></div></header>' +
        '<main class="w-full pt-16 bg-canvas-background min-h-screen"><div class="px-space-md lg:px-space-gutter-desktop py-space-lg" id="staf-view"></div></main></div>';
      L.view = $('#staf-view', L.root);
      var aside = $('#staf-aside', L.root), ov = $('#staf-overlay', L.root);
      function drawer(open) { aside.classList.toggle('-translate-x-full', !open); ov.classList.toggle('hidden', !open); }
      $('#staf-burger', L.root).onclick = function () { drawer(true); };
      ov.onclick = function () { drawer(false); };
      L.closeDrawer = function () { drawer(false); };
      var um = $('#staf-menu', L.root);
      $('#staf-user', L.root).onclick = function (e) { e.stopPropagation(); um.classList.toggle('hidden'); };
      document.addEventListener('click', function () { um.classList.add('hidden'); });
      um.addEventListener('click', function (e) { var a = e.target.closest('[data-do]'); if (!a) return; um.classList.add('hidden'); if (a.dataset.do === 'logout') App.logout(); if (a.dataset.do === 'sandi') App.gantiSandi(); });
      L.root.addEventListener('mouseover', function (e) { var a = e.target.closest('a[data-route]'); if (a) prefetchRoute(a.dataset.route); });
      L.root.addEventListener('focusin', function (e) { var a = e.target.closest('a[data-route]'); if (a) prefetchRoute(a.dataset.route); });
      setInterval(function () { var d = $('[data-date]', L.root); if (d) d.textContent = U.hariTgl(U.todayIso()); }, 60000);
    }
    var stafRole = null;
    function stafMenu(L, me, def) {
      if (!me) return;
      var nav = $('#staf-nav', L.root);
      if (stafRole !== me.role) {
        stafRole = me.role;
        nav.innerHTML = MENU[me.role].map(function (g, gi) {
          return '<div class="px-space-sm ' + (gi ? 'pt-space-sm' : 'pt-space-xs') + ' pb-1"><span class="font-label-sm text-tertiary-fixed-dim text-[10px] uppercase font-bold tracking-wider">' + esc(g.g) + '</span></div>' +
            g.items.map(function (it) {
              var ext = it[0] === 'portal-siswa';
              return '<a href="' + (ext ? '#/login' : '#/' + it[0]) + '"' + (ext ? ' target="_blank" rel="noopener"' : ' data-route="' + it[0] + '"') + ' data-key="' + it[0] + '" class="menu-i flex items-center gap-2.5 px-space-sm py-2 rounded-lg text-inverse-on-surface/80 hover:bg-white/10 hover:text-inverse-on-surface transition-colors font-label-md text-[13px]"><span class="material-symbols-outlined text-[20px]">' + it[1] + '</span><span class="truncate">' + esc(it[2]) + '</span>' + (ext ? '<span class="material-symbols-outlined text-[14px] ml-auto opacity-60">open_in_new</span>' : '') + '</a>';
            }).join('');
        }).join('');
        $('[data-role-badge]', L.root).textContent = me.role === 'admin' ? 'Administrator' : 'Guru';
        $('[data-uname]', L.root).textContent = me.nama || '';
        $('[data-av]', L.root).textContent = U.initials(me.nama);
        $('#staf-menu', L.root).innerHTML = (me.role === 'admin' ? '<button type="button" data-do="sandi" role="menuitem" class="w-full flex items-center gap-2 px-4 py-2.5 text-left font-label-md text-on-surface hover:bg-surface-container-low"><span class="material-symbols-outlined text-[18px]">password</span>Ganti Sandi</button>' : '') + '<button type="button" data-do="logout" role="menuitem" class="w-full flex items-center gap-2 px-4 py-2.5 text-left font-label-md text-status-error-text hover:bg-status-error-bg"><span class="material-symbols-outlined text-[18px]">logout</span>Keluar</button>';
      }
      var act = def && def.menu || (def && def.path);
      Array.prototype.forEach.call(nav.querySelectorAll('.menu-i'), function (a) {
        var on = a.dataset.key === act;
        a.className = 'menu-i flex items-center gap-2.5 px-space-sm py-2 rounded-lg transition-colors font-label-md text-[13px] ' + (on ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'text-inverse-on-surface/80 hover:bg-white/10 hover:text-inverse-on-surface');
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      $('[data-school]', L.root).textContent = App.config.NAMA_SEKOLAH || 'SMA Negeri 1 Kamal';
      $('[data-app-name]', L.root).textContent = 'GAS System';
      $('[data-sub]', L.root).textContent = App.config.TAHUN_AJARAN ? 'T.A. ' + App.config.TAHUN_AJARAN + ' · ' + (App.config.SEMESTER || '') : '';
      $('[data-date]', L.root).textContent = U.hariTgl(U.todayIso());
      if (L.closeDrawer) L.closeDrawer();
    }

    // ---- siswa (w_16) ----
    function buildSiswa(L) {
      L.root.innerHTML = '<div id="sis-overlay" class="fixed inset-0 bg-black/50 z-40 hidden"></div>' +
        '<aside id="sis-aside" class="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-[#091b49] via-[#0d2a6b] to-[#0a1e4d] text-white shadow-2xl z-50 flex flex-col justify-between border-r border-blue-900/60 -translate-x-full lg:translate-x-0 transition-transform duration-200">' +
        '<div class="flex flex-col"><div class="h-20 px-6 flex items-center gap-3.5 border-b border-blue-800/40 bg-black/10"><div class="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1 shadow-lg shadow-blue-500/30 ring-2 ring-white/20 overflow-hidden flex-shrink-0"><img src="' + LOGO + '" alt="Logo sekolah" class="w-full h-full object-contain"></div>' +
        '<div class="flex flex-col"><span class="font-extrabold text-[17px] tracking-tight text-white leading-tight" data-app-name>GAS CBT SISWA</span><span class="text-xs text-blue-200 font-medium" data-school>SMA NEGERI 1 KAMAL</span></div></div>' +
        '<div class="px-6 pt-6 pb-2"><span class="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">Menu Utama Siswa</span></div><nav class="flex flex-col gap-1.5 px-3.5" id="sis-nav" aria-label="Menu siswa"></nav></div>' +
        '<div class="p-4 m-3.5 rounded-2xl bg-black/25 border border-white/10 flex flex-col gap-2.5"><div class="flex items-center gap-2.5"><span class="flex h-2.5 w-2.5 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span></span><div class="flex flex-col"><span class="text-[11px] font-bold text-white leading-none">GAS Core Engine <span data-ver>v1.0.0</span></span><span class="text-[10px] text-emerald-300 font-medium" data-sync>Tersambung ke server</span></div></div>' +
        '<div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200"><span class="flex items-center gap-1 font-mono text-cyan-300"><span class="material-symbols-outlined text-[15px] text-cyan-300">lock</span> <span data-meja>—</span></span><span class="text-amber-300 font-medium" data-lab></span></div></div></aside>' +
        '<div class="lg:pl-72 flex flex-col min-h-screen bg-[#f0f4fc]"><header class="sticky top-0 z-30 bg-gradient-to-r from-[#0f2c73] via-[#1d4ed8] to-[#0284c7] text-white shadow-xl shadow-blue-900/15 border-b border-blue-400/20"><div class="px-4 lg:px-8 h-20 flex items-center justify-between gap-3">' +
        '<div class="flex items-center gap-3 min-w-0"><button type="button" id="sis-burger" class="lg:hidden p-2 rounded-xl bg-white/10" aria-label="Buka menu"><span class="material-symbols-outlined">menu</span></button>' +
        '<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold" id="sis-status"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span data-st>Server CBT: Stabil &amp; Terhubung</span></div>' +
        '<div class="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 text-xs font-semibold"><span class="material-symbols-outlined text-[17px] text-cyan-300">screen_lock_portrait</span><span>Single Device Lock Aktif</span></div></div>' +
        '<div class="flex items-center gap-3"><div class="hidden md:flex flex-col text-right"><span class="font-mono text-base font-bold text-white tracking-wider flex items-center justify-end gap-1.5"><span class="material-symbols-outlined text-[18px] text-cyan-300">schedule</span><span data-clock></span> WIB</span><span class="text-xs text-blue-100/90 font-medium" data-date></span></div><div class="h-8 w-px bg-white/20 hidden md:block"></div>' +
        '<button type="button" id="sis-help" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"><span class="material-symbols-outlined text-[18px]">contact_support</span><span class="hidden sm:inline">Bantuan Proktor</span></button>' +
        '<button type="button" id="sis-out" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-300/40 text-rose-100 font-semibold text-xs active:scale-95"><span class="material-symbols-outlined text-[18px]">logout</span><span class="hidden sm:inline">Keluar</span></button>' +
        '<div class="w-10 h-10 rounded-xl bg-white text-blue-700 font-black flex items-center justify-center shadow-lg ring-2 ring-white/30 text-sm" data-av>S</div></div></div></header>' +
        '<main class="flex-1 px-4 lg:px-8 py-6 lg:py-7 max-w-7xl mx-auto w-full" id="sis-view"></main></div>';
      L.view = $('#sis-view', L.root);
      var aside = $('#sis-aside', L.root), ov = $('#sis-overlay', L.root);
      function drawer(o) { aside.classList.toggle('-translate-x-full', !o); ov.classList.toggle('hidden', !o); }
      $('#sis-burger', L.root).onclick = function () { drawer(true); }; ov.onclick = function () { drawer(false); }; L.closeDrawer = function () { drawer(false); };
      $('#sis-out', L.root).onclick = function () { App.logout(); };
      $('#sis-help', L.root).onclick = function () { App.bantuanProktor(); };
      setInterval(function () { var c = $('[data-clock]', L.root); if (c) c.textContent = U.wib(App.now()); }, 1000);
    }
    var sisBuilt = false;
    function siswaMenu(L, me, def) {
      if (!me) return;
      var nav = $('#sis-nav', L.root), act = def && (def.menu || def.path);
      var items = [['siswa/jadwal', 'calendar_month', 'Jadwal Ujian Saya'], ['siswa/riwayat', 'history_edu', 'Riwayat Pengumpulan']];
      nav.innerHTML = items.map(function (it) { var on = it[0] === act; return '<a href="#/' + it[0] + '" data-route="' + it[0] + '" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all ' + (on ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30 border border-blue-400/30' : 'text-blue-100 hover:bg-white/10') + '"' + (on ? ' aria-current="page"' : '') + '><span class="material-symbols-outlined">' + it[1] + '</span><span class="text-sm">' + esc(it[2]) + '</span></a>'; }).join('');
      $('[data-av]', L.root).textContent = U.initials(me.nama);
      $('[data-school]', L.root).textContent = String(App.config.NAMA_SEKOLAH || 'SMA Negeri 1 Kamal').toUpperCase();
      $('[data-date]', L.root).textContent = U.hariTgl(U.todayIso());
      var pr = App.profil; if (pr) { $('[data-meja]', L.root).textContent = pr.meja ? 'MEJA ' + pr.meja : 'Meja: —'; $('[data-lab]', L.root).textContent = pr.lab || ''; }
      if (L.closeDrawer) L.closeDrawer();
    }
    return { layout: layout, activate: activate };
  })();

  // ---------- Server clock / status ----------
  var skew = 0;
  App.now = function () { return Date.now() + skew; };
  App.syncClock = function (serverTime) { if (serverTime) skew = serverTime - Date.now(); };
  Api.setHandlers({
    authLost: function (msg) { if (!Api.me()) return; Api.saveSession(null); Api.clearCaches(); U.toast(msg || 'Sesi berakhir. Silakan masuk kembali.', 'warn'); go(App.lastRole === 'siswa' ? 'login' : 'login/staf', true); },
    serverMs: function (rtt, ms) {
      App.latency = rtt;
      var st = document.querySelectorAll('#staf-status [data-st],#sis-status [data-st]'), slow = rtt > 4000;
      Array.prototype.forEach.call(st, function (e) { e.textContent = slow ? 'Server lambat (' + (rtt / 1000).toFixed(1) + ' dtk)' : (e.closest('#sis-status') ? 'Server CBT: Stabil & Terhubung' : 'Sistem Normal · ' + rtt + ' ms'); });
    }
  });

  // ---------- Prefetch ----------
  function prefetchRoute(path) { var d = pages[path]; if (d && d.prefetch) { try { Api.prefetch(d.prefetch()); } catch (e) { } } }
  function prefetchAll(role) {
    var run = function () {
      var list = [], seen = {};
      Object.keys(pages).forEach(function (k) { var d = pages[k]; if (d.role === role && d.prefetch) d.prefetch().forEach(function (c) { var kk = c.action + JSON.stringify(c.data || {}); if (!seen[kk]) { seen[kk] = 1; list.push(c); } }); });
      Api.prefetch(list.slice(0, 10));
    };
    (window.requestIdleCallback || function (f) { return setTimeout(f, 1200); })(run, { timeout: 4000 });
  }

  // ---------- Sesi: boot / login / logout ----------
  App.boot = function () {
    return Api.call('boot', {}, { retry: true }).then(function (r) {
      if (!r.success) return r;
      var me = Api.me(); App.config = r.config || {}; App.syncClock(r.serverTime); App.ver = r.av || '';
      document.querySelectorAll('[data-ver]').forEach(function (e) { e.textContent = 'v' + (r.av || '1.0.0'); });
      if (r.kelas) Api.seed('kelas.list', {}, { kelas: r.kelas });
      if (r.jadwal) Api.seed('jadwal.list', me.role === 'admin' ? {} : {}, { jadwal: r.jadwal, serverTime: r.serverTime });
      if (r.paket) Api.seed('model.list', {}, { paket: r.paket });
      if (r.dash) Api.seed(me.role === 'admin' ? 'dash.admin' : 'dash.guru', {}, { dash: r.dash });
      if (r.siswa) App.profil = r.siswa;
      return r;
    });
  };
  App.afterLogin = function (resp) {
    Api.saveSession({ token: resp.token, me: resp.me }); App.lastRole = resp.me.role;
    return App.boot().then(function (r) { prefetchAll(resp.me.role); return r; });
  };
  App.logout = function () {
    var done = function () { Api.saveSession(null); Api.clearCaches(); cacheReset(); go(App.lastRole === 'siswa' ? 'login' : 'login/staf', true); };
    Api.call('auth.logout', {}).then(done, done); done();
  };
  function cacheReset() { Object.keys(cache).forEach(function (k) { if (!/^login|^404/.test(k)) { cache[k].remove(); delete cache[k]; } }); cur = null; }
  App.gantiSandi = function () {
    var m = U.modal({ title: 'Ganti Sandi Administrator', width: 'max-w-md', body: h`<div class="flex flex-col gap-3">${U.field({ name: 'lama', label: 'Sandi saat ini', type: 'password', required: true })}${U.field({ name: 'baru', label: 'Sandi baru', type: 'password', required: true, hint: 'Minimal 8 karakter, memuat huruf dan angka.' })}${U.field({ name: 'ulang', label: 'Ulangi sandi baru', type: 'password', required: true })}</div>`,
      buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Simpan Sandi', primary: true, onClick: function (x, btn) {
        var d = U.formData(x.body); if (d.baru !== d.ulang) return U.toast('Pengulangan sandi tidak sama.', 'err');
        U.busy(btn, true); Api.call('auth.gantiSandi', { lama: d.lama, baru: d.baru }).then(function (r) { U.busy(btn, false); if (!r.success) return U.toast(r.message, 'err'); x.close(); U.toast(r.message, 'ok'); setTimeout(function () { Api.saveSession(null); go('login/staf', true); }, 800); });
      } }] });
  };
  App.bantuanProktor = function () {
    var j = App.activeJadwal || (Api.peek('jadwal.list', {}) || { jadwal: [] }).jadwal.filter(function (x) { return x.status === 'Sedang Berlangsung'; })[0];
    U.modal({ title: 'Panggil Pengawas / Proktor', width: 'max-w-md', body: h`<p class="text-sm text-slate-600 leading-relaxed">Pengawas akan menghampiri meja Anda. Tetap duduk dan jangan menutup halaman ujian.</p>${U.field({ name: 'pesan', label: 'Kendala (opsional)', type: 'textarea', rows: 2, placeholder: 'Contoh: layar membeku, tidak bisa memilih jawaban' })}`,
      buttons: [{ label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Panggil Pengawas', primary: true, onClick: function (x, b) { U.busy(b, true); Api.call('ujian.bantuan', { ID_Jadwal: j ? j.ID_Jadwal : '', pesan: U.formData(x.body).pesan }).then(function (r) { U.busy(b, false); if (r.success) { x.close(); U.toast(r.message, 'ok'); } else U.toast(r.message, 'err'); }); } }] });
  };

  App.Shell = Shell; App.register = register; App.go = go; App.home = home; App.route = route; App.prefetchRoute = prefetchRoute;
  window.App = App;

  // ---------- Mulai ----------
  App.start = function () {
    window.addEventListener('hashchange', route);
    var me = Api.me();
    if (me) {
      App.lastRole = me.role;
      // tampilkan segera dari sesi tersimpan; boot memvalidasi di latar
      route();
      App.boot().then(function (r) { if (r && r.success) { prefetchAll(me.role); if (cur && cur.def.show) { var hs = parseHash(); cur.def.show(cur.el, { params: (match(hs.path) || {}).params || {}, query: hs.query }); } } });
    } else { Api.warm('login'); route(); }
  };
})();
