/* ui.js — pembantu tampilan: template aman (auto-escape), ikon, toast, modal, tabel, format */
(function () {
  'use strict';
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function raw(s) { return { __raw: String(s) }; }
  // h`...${nilai}...` : semua nilai di-escape kecuali raw()/hasil h
  function h(strs) {
    var out = strs[0];
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i], s;
      if (Array.isArray(v)) s = v.map(function (x) { return x && x.__raw !== undefined ? x.__raw : esc(x); }).join('');
      else s = v && v.__raw !== undefined ? v.__raw : esc(v);
      out += s + strs[i];
    }
    return raw(out);
  }
  function str(x) { return x && x.__raw !== undefined ? x.__raw : esc(x); }
  function mount(el, x) { el.innerHTML = str(x); return el; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function ic(n, cls) { return raw('<span class="material-symbols-outlined ' + esc(cls || '') + '" aria-hidden="true">' + esc(n) + '</span>'); }

  // ---- pembersih HTML soal dari server (defense in depth; server juga menyaring) ----
  var OK_TAG = { P: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, SUB: 1, SUP: 1, UL: 1, OL: 1, LI: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TD: 1, TH: 1, SPAN: 1, DIV: 1, IMG: 1, H3: 1, H4: 1, CODE: 1, PRE: 1, BLOCKQUOTE: 1 };
  function clean(html) {
    var t = document.createElement('template'); t.innerHTML = String(html || '');
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 8) { c.remove(); return; }
        if (c.nodeType !== 1) return;
        if (!OK_TAG[c.tagName]) { c.replaceWith(document.createTextNode(c.textContent)); return; }
        Array.prototype.slice.call(c.attributes).forEach(function (a) {
          var nm = a.name.toLowerCase(), ok = nm === 'class' || (c.tagName === 'IMG' && (nm === 'alt' || (nm === 'src' && /^https:\/\//i.test(a.value))));
          if (!ok) c.removeAttribute(a.name);
        });
        if (c.tagName === 'IMG') { c.setAttribute('loading', 'lazy'); c.setAttribute('referrerpolicy', 'no-referrer'); c.className = 'max-w-full h-auto rounded-lg'; }
        walk(c);
      });
    })(t.content);
    var d = document.createElement('div'); d.appendChild(t.content); return d.innerHTML;
  }

  // ---- format ----
  var BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BLN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  function tgl(iso, short) { var p = String(iso || '').split('-'); if (p.length < 3) return iso || '—'; return +p[2] + ' ' + (short ? BLN_S : BLN)[+p[1] - 1] + ' ' + p[0]; }
  function hariTgl(iso) { var p = String(iso || '').split('-'); if (p.length < 3) return ''; return HARI[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay()] + ', ' + tgl(iso); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dur(sec) { sec = Math.max(0, Math.floor(sec)); return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec % 3600 / 60)) + ':' + pad(sec % 60); }
  function wib(ms) { var d = new Date((ms || Date.now()) + 7 * 3600e3); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()); }
  function todayIso(ms) { var d = new Date((ms || Date.now()) + 7 * 3600e3); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function num(n, d) { return Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 2 : d }); }
  function initials(n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase(); }
  function debounce(f, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { f.apply(s, a); }, ms || 200); }; }

  // ---- toast ----
  function toast(msg, type, ms) {
    var root = $('#toast-root'); if (!root) return;
    var st = { ok: ['bg-status-success-bg text-status-success-text', 'check_circle'], err: ['bg-status-error-bg text-status-error-text', 'error'], warn: ['bg-status-warning-bg text-status-warning-text', 'warning'], info: ['bg-status-info-bg text-status-info-text', 'info'] }[type || 'ok'] || ['', ''];
    var el = document.createElement('div');
    el.className = 'pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg border border-border-standard text-[13px] font-semibold max-w-sm toast-in ' + st[0];
    el.setAttribute('role', type === 'err' ? 'alert' : 'status');
    el.innerHTML = '<span class="material-symbols-outlined text-[20px] shrink-0">' + st[1] + '</span><span class="leading-snug">' + esc(msg) + '</span>';
    root.appendChild(el); setTimeout(function () { el.classList.add('opacity-0'); setTimeout(function () { el.remove(); }, 250); }, ms || (type === 'err' ? 6000 : 3200));
  }

  // ---- modal ----
  var modalStack = [];
  function modal(opt) {
    var root = $('#modal-root'), wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#071324]/60 backdrop-blur-sm modal-in overflow-y-auto';
    var w = opt.width || 'max-w-xl';
    wrap.innerHTML = '<div class="relative w-full ' + w + ' my-auto bg-surface-card rounded-xl shadow-2xl flex flex-col max-h-[92vh]" role="dialog" aria-modal="true">' +
      '<div class="flex items-center justify-between px-6 py-4 border-b border-border-standard shrink-0"><div class="min-w-0"><h3 class="font-headline-sm text-headline-sm text-on-surface truncate">' + esc(opt.title || '') + '</h3>' + (opt.subtitle ? '<p class="font-body-sm text-body-sm text-on-surface-variant">' + esc(opt.subtitle) + '</p>' : '') + '</div>' +
      '<button type="button" data-x class="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low" aria-label="Tutup"><span class="material-symbols-outlined">close</span></button></div>' +
      '<div class="px-6 py-5 overflow-y-auto" data-body></div>' + (opt.footer === false ? '' : '<div class="px-6 py-4 border-t border-border-standard flex items-center justify-end gap-2 shrink-0 bg-surface-container-low/60 rounded-b-xl" data-foot></div>') + '</div>';
    root.appendChild(wrap);
    var body = $('[data-body]', wrap), foot = $('[data-foot]', wrap);
    mount(body, opt.body || raw(''));
    var api = { el: wrap, body: body, foot: foot, close: function () { if (opt.onClose) opt.onClose(); wrap.remove(); modalStack = modalStack.filter(function (m) { return m !== api; }); } };
    $('[data-x]', wrap).onclick = api.close;
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap && !opt.sticky) api.close(); });
    (opt.buttons || []).forEach(function (b) {
      var btn = document.createElement('button'); btn.type = 'button';
      btn.className = b.primary ? 'px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md hover:bg-primary transition-colors disabled:opacity-60' : b.danger ? 'px-4 py-2 rounded-lg bg-error text-on-error font-label-md hover:opacity-90 disabled:opacity-60' : 'px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md hover:bg-surface-container';
      btn.innerHTML = esc(b.label); if (b.id) btn.id = b.id;
      btn.onclick = function () { b.onClick && b.onClick(api, btn); };
      foot && foot.appendChild(btn);
    });
    modalStack.push(api);
    var f = $('input,select,textarea,button[data-x]', body); if (f && !opt.noFocus) setTimeout(function () { try { f.focus(); } catch (e) { } }, 30);
    return api;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modalStack.length) { var m = modalStack[modalStack.length - 1]; m.close(); } });
  function confirmBox(o) {
    return new Promise(function (res) {
      modal({ title: o.title || 'Konfirmasi', width: 'max-w-md', body: h`<p class="text-body-md text-on-surface-variant leading-relaxed">${o.message}</p>`,
        onClose: function () { res(false); },
        buttons: [{ label: o.cancel || 'Batal', onClick: function (m) { res(false); m.close(); } }, { label: o.ok || 'Ya, lanjutkan', danger: !!o.danger, primary: !o.danger, onClick: function (m) { res(true); m.el.remove(); modalStack = modalStack.filter(function (x) { return x !== m; }); } }]
      });
    });
  }

  // ---- unduh berkas dari base64 / cetak ----
  function downloadB64(nama, mime, b64) {
    var bin = atob(b64), n = bin.length, u8 = new Uint8Array(n); for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u8], { type: mime })), a = document.createElement('a');
    a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function copy(text, label) { var done = function () { toast((label || 'Teks') + ' disalin.', 'ok', 1800); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); }); else { fallbackCopy(text); done(); } }
  function fallbackCopy(t) { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) { } a.remove(); }
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { c = String(c === null || c === undefined ? '' : c); return /[",\n;]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n'); }
  function downloadText(nama, mime, text) { var u = URL.createObjectURL(new Blob(['﻿' + text], { type: mime })), a = document.createElement('a'); a.href = u; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }

  // ---- badge ----
  var BADGE = {
    ok: 'bg-status-success-bg text-status-success-text', info: 'bg-status-info-bg text-status-info-text', warn: 'bg-status-warning-bg text-status-warning-text',
    err: 'bg-status-error-bg text-status-error-text', mute: 'bg-surface-container-high text-on-surface-variant'
  };
  function badge(text, kind, dot) { return h`<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${BADGE[kind] || BADGE.mute} font-label-sm text-label-sm font-semibold">${dot ? raw('<span class="w-1.5 h-1.5 rounded-full bg-current ' + (dot === 'pulse' ? 'animate-pulse' : '') + '"></span>') : ''}${text}</span>`; }
  function statusJadwalBadge(s) { return s === 'Sedang Berlangsung' ? badge(s, 'ok', 'pulse') : s === 'Siap Dimulai' ? badge(s, 'info', true) : s === 'Selesai' ? badge(s, 'mute') : badge(s || 'Terjadwal', 'warn', true); }

  // ---- skeleton ----
  function skeletonRows(n, cols) { var r = ''; for (var i = 0; i < n; i++) { r += '<tr>'; for (var c = 0; c < cols; c++) r += '<td class="py-3 px-3"><div class="h-4 rounded bg-surface-container-low animate-pulse" style="width:' + (50 + (i * 17 + c * 23) % 45) + '%"></div></td>'; r += '</tr>'; } return raw(r); }

  // ---- rumus (KaTeX dimuat malas dari cdnjs, hanya bila ada rumus \( \) atau $$ $$) ----
  var katexP = null;
  function math(root) {
    if (!root || !/\\\(|\$\$/.test(root.textContent || '')) return Promise.resolve();
    if (!katexP) katexP = new Promise(function (res, rej) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css'; document.head.appendChild(l);
      var a = document.createElement('script'); a.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js'; a.crossOrigin = 'anonymous';
      a.onload = function () { var b = document.createElement('script'); b.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js'; b.crossOrigin = 'anonymous'; b.onload = res; b.onerror = rej; document.head.appendChild(b); };
      a.onerror = rej; document.head.appendChild(a);
    });
    return katexP.then(function () { window.renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); }, function () { });
  }

  // ---- field form ----
  var INP = 'w-full rounded-lg border border-border-standard bg-surface-card px-3 py-2 text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 outline-none transition-colors placeholder:text-outline';
  function field(o) {
    var id = o.id || ('f_' + o.name), req = o.required ? ' <span class="text-error">*</span>' : '', attrs = (o.attrs || '') + (o.required ? ' required' : '');
    var ctrl;
    if (o.type === 'select') ctrl = '<select id="' + id + '" name="' + o.name + '" class="' + INP + '" ' + attrs + '>' + (o.options || []).map(function (op) { var v = typeof op === 'object' ? op.value : op, l = typeof op === 'object' ? op.label : op; return '<option value="' + esc(v) + '"' + (String(v) === String(o.value === undefined ? '' : o.value) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
    else if (o.type === 'textarea') ctrl = '<textarea id="' + id + '" name="' + o.name + '" rows="' + (o.rows || 3) + '" class="' + INP + '" placeholder="' + esc(o.placeholder || '') + '" ' + attrs + '>' + esc(o.value || '') + '</textarea>';
    else ctrl = '<input id="' + id + '" name="' + o.name + '" type="' + (o.type || 'text') + '" value="' + esc(o.value === undefined ? '' : o.value) + '" placeholder="' + esc(o.placeholder || '') + '" class="' + INP + (o.mono ? ' font-tabular-code' : '') + '" ' + attrs + '>';
    return raw('<div class="' + (o.cls || '') + '"><label for="' + id + '" class="block font-label-md text-label-md text-on-surface mb-1">' + esc(o.label) + req + '</label>' + ctrl + (o.hint ? '<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">' + esc(o.hint) + '</p>' : '') + '</div>');
  }
  function formData(root) { var o = {}; $$('input,select,textarea', root).forEach(function (e) { if (!e.name) return; if (e.type === 'checkbox') o[e.name] = e.checked; else if (e.type === 'radio') { if (e.checked) o[e.name] = e.value; } else o[e.name] = e.value; }); return o; }

  // ---- tombol ----
  var BTN = {
    primary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed',
    soft: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-60',
    ghost: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors',
    danger: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-error-bg text-status-error-text font-label-md text-label-md hover:bg-error-container transition-colors'
  };
  function busy(btn, on, label) { if (!btn) return; if (on) { btn.dataset.l = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>' + (label ? ' ' + esc(label) : ''); } else { btn.disabled = false; if (btn.dataset.l) btn.innerHTML = btn.dataset.l; } }

  window.UI = { esc: esc, raw: raw, h: h, str: str, mount: mount, $: $, $$: $$, ic: ic, clean: clean, tgl: tgl, hariTgl: hariTgl, dur: dur, wib: wib, todayIso: todayIso, num: num, initials: initials, debounce: debounce, pad: pad,
    math: math, toast: toast, modal: modal, confirm: confirmBox, downloadB64: downloadB64, copy: copy, csv: csv, downloadText: downloadText, badge: badge, statusJadwalBadge: statusJadwalBadge, skeletonRows: skeletonRows,
    field: field, formData: formData, INP: INP, BTN: BTN, busy: busy, BLN: BLN, HARI: HARI };
})();
