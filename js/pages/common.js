/* common.js — komponen halaman staf yang dipakai berulang */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc, $ = U.$;
  var C = {};
  C.head = function (title, sub, actions) {
    return h`<div class="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-lg"><div><h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">${title}</h1>${sub ? h`<p class="font-body-md text-on-surface-variant mt-0.5">${sub}</p>` : ''}</div><div class="flex flex-wrap items-center gap-2">${actions || ''}</div></div>`;
  };
  C.card = function (inner, cls) { return h`<section class="bg-surface-card rounded-xl shadow-sm p-space-md md:p-space-lg ${cls || ''}">${inner}</section>`; };
  C.stat = function (o) { // {label,value,icon,tone,foot,footKind}
    var tone = o.tone || 'primary';
    return h`<div class="relative bg-surface-card rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"><div class="flex items-start justify-between"><div class="flex flex-col"><span class="font-label-md text-label-md text-on-surface-variant">${o.label}</span><span class="font-headline-lg text-headline-lg text-on-surface mt-1 group-hover:text-${tone} transition-colors">${o.value}</span></div><div class="w-11 h-11 rounded-lg ${o.iconBg || 'bg-surface-container-low'} flex items-center justify-center text-${tone} group-hover:bg-${tone === 'primary' ? 'primary-container' : tone} group-hover:text-on-${tone === 'primary' ? 'primary' : tone} transition-all">${U.ic(o.icon, 'text-[24px]')}</div></div>${o.foot ? h`<div class="mt-space-md pt-space-xs flex items-center justify-between">${U.badge(o.foot, o.footKind || 'ok')}</div>` : ''}</div>`;
  };
  C.search = function (id, ph) { return h`<div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span><input id="${id}" type="search" placeholder="${ph}" class="w-full sm:w-72 pl-10 pr-3 py-2 rounded-lg bg-surface-container-low border border-transparent text-body-md focus:bg-surface-card focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 outline-none transition-all"></div>`; };
  C.select = function (id, opts, cls) { return h`<select id="${id}" class="rounded-lg bg-surface-container-low border border-transparent text-body-md py-2 pl-3 pr-8 focus:bg-surface-card focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 outline-none ${cls || ''}">${opts.map(function (o) { return h`<option value="${o[0]}">${o[1]}</option>`; })}</select>`; };
  C.btn = function (kind, icon, label, attrs) { return raw('<button type="button" class="' + U.BTN[kind] + '" ' + (attrs || '') + '>' + (icon ? U.str(U.ic(icon, 'text-[18px]')) : '') + '<span>' + esc(label) + '</span></button>'); };
  C.iconBtn = function (act, icon, title, tone, attrs) { return raw('<button type="button" ' + (attrs || 'data-act="' + act + '"') + ' title="' + esc(title) + '" aria-label="' + esc(title) + '" class="p-1.5 rounded-lg transition-colors ' + (tone === 'danger' ? 'text-on-surface-variant hover:text-status-error-text hover:bg-status-error-bg' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low') + '"><span class="material-symbols-outlined text-[18px]">' + icon + '</span></button>'); };
  C.errorBox = function (msg, retry) { return h`<div class="p-space-md rounded-lg bg-status-error-bg text-status-error-text flex items-center gap-2 font-body-md">${U.ic('error')}<span class="flex-1">${msg}</span>${retry ? raw('<button type="button" data-retry class="px-3 py-1 rounded-lg bg-white/70 font-label-md">Coba lagi</button>') : ''}</div>`; };
  C.kelasMap = function () { var r = Api.peek('kelas.list', {}); var m = {}; ((r && r.kelas) || []).forEach(function (k) { m[k.ID_Kelas] = k; }); return m; };
  C.kelasOpts = function (withAll) { var r = Api.peek('kelas.list', {}); var o = withAll ? [['', withAll]] : []; ((r && r.kelas) || []).forEach(function (k) { o.push([k.ID_Kelas, k.Nama]); }); return o; };
  C.tingkatList = function () { return String((App.config && App.config.TINGKAT) || 'X,XI,XII').split(',').map(function (s) { return s.trim(); }).filter(Boolean); };
  // jalankan aksi tulis: busy tombol, toast, invalidasi cache, optional refresh
  C.act = function (btn, action, data, o) {
    o = o || {}; U.busy(btn, true);
    return Api.call(action, data, o.timeout ? { timeout: o.timeout } : undefined).then(function (r) {
      U.busy(btn, false);
      if (!r.success) { U.toast(r.message || 'Gagal.', 'err'); if (o.onFail) o.onFail(r); return r; }
      if (o.inv) Api.invalidate(o.inv);
      if (o.ok !== false) U.toast(o.msg || r.message || 'Berhasil.', 'ok');
      if (o.done) o.done(r); return r;
    });
  };
  // baca BACA dengan SWR dan render ke callback; kembalikan fungsi reload
  C.load = function (el, action, data, cb, opt) { return Api.swr(action, data, function (r, meta) { if (r.success) cb(r, meta); else if (meta && meta.error) { var b = $('[data-err]', el); if (b) { U.mount(b, C.errorBox(r.message, true)); b.hidden = false; } } else { var b2 = $('[data-err]', el); if (b2) b2.hidden = true; } }, opt); };
  C.xlsxReady = function () {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.integrity = ''; s.crossOrigin = 'anonymous'; s.onload = function () { res(window.XLSX); }; s.onerror = function () { rej(new Error('Pustaka Excel gagal dimuat. Periksa koneksi internet.')); }; document.head.appendChild(s); });
  };
  C.readSheet = function (file) {
    return C.xlsxReady().then(function (X) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onerror = function () { rej(new Error('Berkas tidak dapat dibaca.')); }; fr.onload = function () { try { var wb = X.read(fr.result, { type: 'array', cellDates: false }); var ws = wb.Sheets[wb.SheetNames[0]]; res(X.utils.sheet_to_json(ws, { defval: '', raw: false })); } catch (e) { rej(new Error('Format berkas tidak dikenali (gunakan .xlsx atau .csv).')); } }; fr.readAsArrayBuffer(file); }); });
  };
  C.template = function (nama, header, contoh) {
    return C.xlsxReady().then(function (X) { var ws = X.utils.aoa_to_sheet([header].concat(contoh || [])); var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Data'); X.writeFile(wb, nama); });
  };
  // cari nilai kolom tanpa peduli huruf besar/kecil/spasi
  C.pick = function (row, names) { var map = {}; Object.keys(row).forEach(function (k) { map[String(k).toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k]; }); for (var i = 0; i < names.length; i++) { var v = map[names[i].toLowerCase().replace(/[^a-z0-9]/g, '')]; if (v !== undefined && String(v).trim() !== '') return String(v).trim(); } return ''; };
  C.kredensialModal = function (list, judul) {
    var rows = Array.isArray(list) ? list : [list]; if (!rows.length) return;
    var m = U.modal({ title: judul || 'Kredensial Akun', subtitle: 'Simpan atau cetak sekarang. Sandi awal tetap dapat dilihat ulang oleh Administrator di menu ini.', width: 'max-w-2xl',
      body: h`<div class="overflow-x-auto"><table class="w-full text-left text-body-md"><thead><tr class="bg-surface-container-low text-on-surface-variant font-label-sm uppercase"><th class="py-2 px-3">Nama</th><th class="py-2 px-3">Pengguna</th><th class="py-2 px-3">Sandi</th></tr></thead><tbody>${rows.map(function (r) { return h`<tr class="border-b border-border-standard/60"><td class="py-2 px-3">${r.nama}</td><td class="py-2 px-3 font-tabular-code">${r.username || r.nisn}</td><td class="py-2 px-3 font-tabular-code font-bold tracking-wider text-primary">${r.sandi}</td></tr>`; })}</tbody></table></div>`,
      buttons: [{ label: 'Salin Semua', onClick: function () { U.copy(rows.map(function (r) { return [r.nama, r.username || r.nisn, r.sandi].join('\t'); }).join('\n'), 'Kredensial'); } },
        { label: 'Unduh CSV', onClick: function () { U.downloadText('kredensial.csv', 'text/csv', U.csv([['Nama', 'Pengguna', 'Sandi']].concat(rows.map(function (r) { return [r.nama, r.username || r.nisn, r.sandi]; })))); } },
        { label: 'Tutup', primary: true, onClick: function (x) { x.close(); } }] });
    return m;
  };
  // cetak HTML lewat iframe tersembunyi (dialog cetak peramban → bisa disimpan sebagai PDF)
  C.print = function (judul, html) {
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write('<!doctype html><meta charset="utf-8"><title>' + esc(judul) + '</title><style>body{font:12px Inter,Arial,sans-serif;color:#0b1c30;margin:18px}h1{font-size:16px;margin:0 0 4px}p{margin:0 0 10px;color:#434655}table{border-collapse:collapse;width:100%}th,td{border:1px solid #c3c6d7;padding:5px 7px;text-align:left;vertical-align:top}th{background:#eff4ff}</style>' + html); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { U.toast('Dialog cetak tidak dapat dibuka.', 'err'); } setTimeout(function () { f.remove(); }, 2000); }, 300);
  };
  window.C = C;
})();
