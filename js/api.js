/* api.js — klien REST untuk Google Apps Script: sesi, SWR cache, batch, antrean simpan */
(function () {
  'use strict';
  var CFG = window.APP_CONFIG || {};
  var LS_SESSION = 'cbt.session', LS_DEV = 'cbt.device', LS_CACHE = 'cbt.cache.';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }

  // Hanya host lokal yang boleh menimpa URL lewat ?gas= (untuk pengujian). Di produksi diabaikan.
  function resolveBase() {
    var u = CFG.GAS_URL || '';
    try {
      var q = new URLSearchParams(location.search).get('gas');
      if (q && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) u = q;
    } catch (e) { }
    return u;
  }
  var base = resolveBase();
  function configured() { return !!base && !/GANTI|XXXX/i.test(base); }

  function deviceId() {
    var d = lsGet(LS_DEV);
    if (!d) { d = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); lsSet(LS_DEV, d); }
    return d;
  }

  // ---- Sesi ----
  // Sesi disimpan per TAB (sessionStorage): tab lain/portal lain tidak saling menimpa, dan komputer lab bersih saat tab ditutup.
  var session = null;
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  try { session = JSON.parse(ssGet(LS_SESSION) || 'null'); } catch (e) { session = null; }
  function saveSession(s) { session = s; try { if (s) sessionStorage.setItem(LS_SESSION, JSON.stringify(s)); else sessionStorage.removeItem(LS_SESSION); } catch (e) { } }

  // ---- Cache SWR (memori + localStorage per pengguna) ----
  var mem = {}, listeners = {};
  var PERSIST = /^(kelas\.list|jadwal\.list|siswa\.list|guru\.list|model\.list|dash\.|token\.list|template\.list|crm\.list|boot)/;
  function key(a, d) { return a + '|' + JSON.stringify(d || {}); }
  function scope() { return session && session.me ? session.me.role + ':' + session.me.id : 'anon'; }
  function persistKey(k) { return LS_CACHE + scope() + ':' + k; }
  function readCache(k) {
    var e = mem[k]; if (e) return e;
    if (PERSIST.test(k)) { var raw = lsGet(persistKey(k)); if (raw) { try { e = JSON.parse(raw); mem[k] = e; return e; } catch (x) { } } }
    return null;
  }
  function writeCache(k, v) {
    var e = { t: Date.now(), v: v }; mem[k] = e;
    if (PERSIST.test(k)) { var s = JSON.stringify(e); if (s.length < 900000) lsSet(persistKey(k), s); }
  }
  function invalidate(prefixes) {
    (Array.isArray(prefixes) ? prefixes : [prefixes]).forEach(function (p) {
      Object.keys(mem).forEach(function (k) { if (k.indexOf(p) === 0) delete mem[k]; });
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(LS_CACHE + scope() + ':' + p) === 0) localStorage.removeItem(k); }); } catch (e) { }
    });
  }
  function clearCaches() { mem = {}; try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(LS_CACHE) === 0) localStorage.removeItem(k); }); } catch (e) { } }

  // ---- Transport ----
  var inflight = {}, onAuthLost = null, onServerMs = null, lastOk = Date.now();
  function setHandlers(h) { onAuthLost = h.authLost; onServerMs = h.serverMs; }

  function post(action, data, opt) {
    opt = opt || {};
    if (!configured()) return Promise.resolve({ success: false, code: 'CONFIG', message: 'URL server belum diatur. Isi GAS_URL pada js/config.js.' });
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, opt.timeout || 35000);
    var t0 = Date.now();
    return fetch(base, {
      method: 'POST', redirect: 'follow', signal: ctrl ? ctrl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, data: data || {}, token: opt.noAuth ? undefined : (session && session.token) })
    }).then(function (r) { return r.text(); }).then(function (txt) {
      clearTimeout(to);
      var j; try { j = JSON.parse(txt); } catch (e) { return { success: false, code: 'BAD', message: 'Respons server tidak valid. Coba lagi.' }; }
      lastOk = Date.now(); j.rtt = Date.now() - t0;
      if (onServerMs) onServerMs(j.rtt, j.ms);
      if (j.success === false && j.code === 'AUTH' && !opt.noAuth && onAuthLost) onAuthLost(j.message);
      return j;
    }).catch(function (err) {
      clearTimeout(to);
      return { success: false, code: 'NET', message: err && err.name === 'AbortError' ? 'Server lambat merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.' };
    });
  }
  // call: dengan 1x ulang otomatis untuk kegagalan jaringan pada aksi BACA
  function call(action, data, opt) {
    return post(action, data, opt).then(function (r) {
      if (r.code === 'NET' && (opt && opt.retry)) return new Promise(function (res) { setTimeout(res, 800); }).then(function () { return post(action, data, opt); });
      return r;
    });
  }

  // swr: tampilkan cache seketika, segarkan di latar. cb(response, {cached}) dipanggil 1–2 kali.
  function swr(action, data, cb, opt) {
    opt = opt || {}; var k = key(action, data), e = readCache(k), ttl = opt.ttl === undefined ? 20000 : opt.ttl;
    if (e) cb(e.v, { cached: true, age: Date.now() - e.t });
    if (e && !opt.force && Date.now() - e.t < ttl) return Promise.resolve(e.v);
    if (inflight[k]) return inflight[k].then(function (r) { if (r && r.success) cb(r, { cached: false }); return r; });
    var p = call(action, data, { retry: true }).then(function (r) {
      delete inflight[k];
      if (r.success) { writeCache(k, r); cb(r, { cached: false }); }
      else if (!e) cb(r, { cached: false, error: true });
      return r;
    });
    inflight[k] = p; return p;
  }
  function peek(action, data) { var e = readCache(key(action, data)); return e ? e.v : null; }
  function seed(action, data, resp) { resp = resp || {}; resp.success = true; writeCache(key(action, data), resp); }

  // batch: beberapa BACA dalam satu permintaan; hasilnya disimpan ke cache
  function batch(calls, opt) {
    return call('batch', { calls: calls }, { retry: true, timeout: (opt && opt.timeout) || 40000 }).then(function (r) {
      if (!r.success) return r;
      (r.results || []).forEach(function (x, i) { if (x && x.success) writeCache(key(calls[i].action, calls[i].data), x); });
      return r;
    });
  }

  // prefetch diam-diam (tidak mengganggu): lewati bila baru saja diambil
  function prefetch(list) {
    var need = list.filter(function (c) { var e = readCache(key(c.action, c.data)); return !e || Date.now() - e.t > 30000; });
    if (!need.length) return Promise.resolve();
    if (need.length === 1) return swr(need[0].action, need[0].data, function () { }, { ttl: 30000 });
    return batch(need.slice(0, 10));
  }

  function warm(scopeName) { if (!configured()) return; try { fetch(base + (base.indexOf('?') < 0 ? '?' : '&') + 'w=' + (scopeName || 'login'), { mode: 'no-cors' }); } catch (e) { } }

  window.Api = {
    configured: configured, base: function () { return base; }, deviceId: deviceId,
    session: function () { return session; }, me: function () { return session && session.me; }, saveSession: saveSession,
    call: call, post: post, swr: swr, peek: peek, seed: seed, batch: batch, prefetch: prefetch, invalidate: invalidate, clearCaches: clearCaches,
    setHandlers: setHandlers, warm: warm, lastOk: function () { return lastOk; }
  };
})();
