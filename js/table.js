/* table.js — tabel data generik: cari, urut, filter, pilih baris, paginasi (klien) */
(function () {
  'use strict';
  var U = window.UI, h = U.h, raw = U.raw, esc = U.esc;
  function TableView(o) {
    var self = this, st = { rows: [], q: '', filter: null, page: 1, size: o.size || 10, sel: {}, sortKey: o.sortKey || null, sortDir: 1, loading: true };
    var root = o.el; root.classList.add('tv');
    function view() {
      var r = st.rows, q = st.q.trim().toLowerCase();
      if (st.filter) r = r.filter(st.filter);
      if (q) { var keys = o.searchKeys || []; r = r.filter(function (x) { return keys.some(function (k) { return String(typeof k === 'function' ? k(x) : x[k] === undefined ? '' : x[k]).toLowerCase().indexOf(q) >= 0; }); }); }
      if (st.sortKey) { var k = st.sortKey, d = st.sortDir; r = r.slice().sort(function (a, b) { var x = a[k], y = b[k]; if (typeof x === 'number' && typeof y === 'number') return (x - y) * d; return String(x === undefined ? '' : x).localeCompare(String(y === undefined ? '' : y), 'id', { numeric: true }) * d; }); }
      return r;
    }
    function render() {
      var all = view(), total = all.length, pages = Math.max(1, Math.ceil(total / st.size)); if (st.page > pages) st.page = pages;
      var from = (st.page - 1) * st.size, rows = all.slice(from, from + st.size), id = o.rowId || 'ID', cols = o.columns, nc = cols.length + (o.selectable ? 1 : 0);
      var allSel = rows.length && rows.every(function (r) { return st.sel[r[id]]; });
      var head = '<tr class="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">' +
        (o.selectable ? '<th class="py-2.5 px-3 w-10 rounded-l-lg"><input type="checkbox" data-all class="rounded border-border-strong text-primary-container focus:ring-primary-container/30" ' + (allSel ? 'checked' : '') + ' aria-label="Pilih semua"></th>' : '') +
        cols.map(function (c, i) { var s = c.sort !== false && c.key; var act = !!c.key && st.sortKey === c.key; return '<th class="py-2.5 px-3 ' + (c.th || '') + (i === 0 && !o.selectable ? ' rounded-l-lg' : '') + (i === cols.length - 1 ? ' rounded-r-lg' : '') + (s ? ' cursor-pointer select-none hover:text-primary' : '') + '"' + (s ? ' data-sort="' + esc(c.key) + '"' : '') + '>' + esc(c.label) + (act ? '<span class="material-symbols-outlined text-[14px] align-middle ml-0.5">' + (st.sortDir > 0 ? 'arrow_upward' : 'arrow_downward') + '</span>' : '') + '</th>'; }).join('') + '</tr>';
      var body;
      if (st.loading && !st.rows.length) body = U.str(U.skeletonRows(Math.min(st.size, 6), nc));
      else if (!rows.length) body = '<tr><td colspan="' + nc + '" class="py-12 text-center"><div class="flex flex-col items-center gap-2 text-on-surface-variant"><span class="material-symbols-outlined text-[40px] text-outline">' + esc(o.emptyIcon || 'search_off') + '</span><span class="font-label-md">' + esc(st.q || st.filter ? 'Tidak ada data yang cocok dengan pencarian/filter.' : (o.emptyText || o.empty || 'Belum ada data.')) + '</span>' + (o.emptyHint && !st.q ? '<span class="font-body-sm">' + esc(o.emptyHint) + '</span>' : '') + '</div></td></tr>';
      else body = rows.map(function (r) {
        return '<tr class="hover:bg-surface-container-lowest/70 hover:bg-primary-fixed/20 transition-colors border-b border-border-standard/50 last:border-0' + (st.sel[r[id]] ? ' bg-primary-fixed/30' : '') + '" data-id="' + esc(r[id]) + '">' +
          (o.selectable ? '<td class="py-3 px-3 align-middle"><input type="checkbox" data-sel class="rounded border-border-strong text-primary-container focus:ring-primary-container/30" ' + (st.sel[r[id]] ? 'checked' : '') + ' aria-label="Pilih baris"></td>' : '') +
          cols.map(function (c) { var v = c.render ? c.render(r) : esc(r[c.key]); return '<td class="py-3 px-3 align-middle ' + (c.td || '') + '">' + (v && v.__raw !== undefined ? v.__raw : (c.render ? esc(v) : v)) + '</td>'; }).join('') + '</tr>';
      }).join('');
      var pg = '';
      if (pages > 1) {
        var p = st.page, list = [1]; for (var i = Math.max(2, p - 1); i <= Math.min(pages - 1, p + 1); i++) list.push(i); if (pages > 1) list.push(pages);
        list = list.filter(function (v, i, a) { return a.indexOf(v) === i; });
        pg = '<div class="flex items-center gap-1"><button data-pg="' + (p - 1) + '" class="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40" ' + (p <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>' +
          list.map(function (n, i) { return (i && n - list[i - 1] > 1 ? '<span class="px-1 text-outline">…</span>' : '') + '<button data-pg="' + n + '" class="min-w-8 h-8 px-2 rounded-lg font-tabular-code text-[12px] ' + (n === p ? 'bg-primary-container text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-low') + '">' + n + '</button>'; }).join('') +
          '<button data-pg="' + (p + 1) + '" class="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40" ' + (p >= pages ? 'disabled' : '') + ' aria-label="Berikutnya"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button></div>';
      }
      var nsel = Object.keys(st.sel).length;
      root.innerHTML = '<div class="overflow-x-auto -mx-1 px-1"><table class="w-full text-left"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        '<div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 mt-1 border-t border-border-standard/60"><span class="font-body-sm text-body-sm text-on-surface-variant">' + (total ? 'Menampilkan <b class="font-tabular-code">' + (from + 1) + '–' + Math.min(total, from + st.size) + '</b> dari <b class="font-tabular-code">' + total + '</b> data' : 'Tidak ada data') + (nsel ? ' · <span class="text-primary font-semibold">' + nsel + ' dipilih</span>' : '') + '</span>' + pg + '</div>';
      if (o.onRender) o.onRender(self);
    }
    root.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-pg]')) && !el.disabled) { st.page = +el.dataset.pg; render(); return; }
      if ((el = t.closest('[data-sort]'))) { var k = el.dataset.sort; if (st.sortKey === k) st.sortDir = -st.sortDir; else { st.sortKey = k; st.sortDir = 1; } render(); return; }
      if ((el = t.closest('[data-act]'))) { var tr = el.closest('tr'), id = tr && tr.dataset.id, row = st.rows.filter(function (r) { return String(r[o.rowId || 'ID']) === id; })[0]; if (o.onAction) o.onAction(el.dataset.act, row, el, e); }
    });
    root.addEventListener('change', function (e) {
      var id = o.rowId || 'ID';
      if (e.target.matches('[data-all]')) { var rows = view().slice((st.page - 1) * st.size, st.page * st.size); rows.forEach(function (r) { if (e.target.checked) st.sel[r[id]] = 1; else delete st.sel[r[id]]; }); render(); if (o.onSelect) o.onSelect(self.selected()); }
      else if (e.target.matches('[data-sel]')) { var rid = e.target.closest('tr').dataset.id; if (e.target.checked) st.sel[rid] = 1; else delete st.sel[rid]; render(); if (o.onSelect) o.onSelect(self.selected()); }
    });
    self.setRows = function (rows) { st.rows = rows || []; st.loading = false; var ids = {}; st.rows.forEach(function (r) { ids[r[o.rowId || 'ID']] = 1; }); Object.keys(st.sel).forEach(function (k) { if (!ids[k]) delete st.sel[k]; }); render(); if (o.onSelect) o.onSelect(self.selected()); };
    self.rows = function () { return st.rows; };
    self.setQuery = function (q) { st.q = q || ''; st.page = 1; render(); };
    self.setFilter = function (f) { st.filter = f; st.page = 1; render(); };
    self.selected = function () { return Object.keys(st.sel); };
    self.selectedRows = function () { return st.rows.filter(function (r) { return st.sel[r[o.rowId || 'ID']]; }); };
    self.clearSel = function () { st.sel = {}; render(); if (o.onSelect) o.onSelect([]); };
    self.filtered = function () { return view(); };
    self.refresh = render; self.loading = function (b) { st.loading = b; render(); };
    render();
  }
  window.TableView = TableView;
})();
