import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS, SHARED_JS } from "./layout";

export function stagingPage(config: TenantConfig, user: SessionUser): string {
  const L3 = config.entity_labels.l3;
  return page("Staging", `
    main { gap: 12px; }
    .search-box { position: relative; }
    .search-box input { width: 100%; padding: 12px 14px 12px 38px; font-size: 0.95rem; box-sizing: border-box; }
    .search-box .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 1rem; pointer-events: none; }
    .search-results { display: flex; flex-direction: column; gap: 6px; }
    .sr-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
    }
    .sr-primary { font-weight: 700; font-size: 0.9rem; }
    .sr-secondary { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .sr-station { font-size: 0.75rem; color: var(--accent); }
    .sr-right { text-align: right; flex-shrink: 0; }
    .sr-loc { font-size: 0.8rem; color: var(--accent); background: rgba(59,130,246,0.08); padding: 2px 8px; border-radius: 6px; }
    .sr-empty { text-align: center; padding: 24px; color: var(--muted); font-size: 0.85rem; }
    .toggle-row { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    .toggle-row button {
      flex: 1; padding: 8px 12px; font-size: 0.8rem; font-weight: 600; border: none;
      background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.2s;
    }
    .toggle-row button.active { background: var(--accent); color: #fff; }
    .progress-list { display: flex; flex-direction: column; gap: 8px; }
    .pj-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
    }
    .pj-header { padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .pj-header:active { background: rgba(59,130,246,0.08); }
    .pj-title { font-weight: 700; font-size: 1rem; }
    .pj-sub { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .pj-progress { display: flex; align-items: center; gap: 8px; }
    .pj-bar { width: 60px; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .pj-fill { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.3s; }
    .pj-fill.full { background: var(--success); }
    .pj-pct { font-size: 0.75rem; font-weight: 600; color: var(--muted); min-width: 36px; text-align: right; }
    .pj-badge { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(34,197,94,0.15); color: var(--success); }
    .pj-cabs { border-top: 1px solid var(--border); display: none; }
    .pj-cabs.open { display: block; }
    .pj-cab { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); gap: 8px; }
    .pj-cab:last-child { border-bottom: none; }
    .pj-cab-info { flex: 1; min-width: 0; }
    .pj-cab-label { font-weight: 600; font-size: 0.85rem; }
    .pj-cab-meta { font-size: 0.7rem; color: var(--muted); }
    .pj-cab-staged { font-size: 0.65rem; font-weight: 600; color: var(--success); }
    .pj-cab-pending { font-size: 0.65rem; color: var(--muted); }
    .loc-text { font-size: 0.8rem; color: var(--accent); cursor: pointer; padding: 4px 8px; border-radius: 6px; background: rgba(59,130,246,0.08); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .loc-empty { font-size: 0.8rem; color: var(--muted); cursor: pointer; font-style: italic; padding: 4px 8px; }
    .loc-wrap { flex-shrink: 0; max-width: 140px; }
    .loc-wrap input {
      width: 130px; padding: 6px 8px; font-size: 0.8rem; border-radius: 6px;
      border: 1px solid var(--accent); background: var(--bg); color: var(--text); outline: none;
    }
    .flag-badges { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 2px; }
    .flag-badge { display: inline-block; font-size: 0.55rem; font-weight: 700; padding: 1px 5px; border-radius: 3px; text-transform: uppercase; }
    .flag-hold { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .flag-remake { background: rgba(239,68,68,0.2); color: #ef4444; }
    .flag-missing_part { background: rgba(139,92,246,0.2); color: #8b5cf6; }
    .flag-priority { background: rgba(59,130,246,0.2); color: #3b82f6; }
    .summary-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .summary-stat { font-size: 0.8rem; color: var(--muted); }
    .summary-stat strong { color: var(--text); font-size: 1rem; }
  `, `
  <main>
    <div class="card search-box">
      <span class="search-icon">⌕</span>
      <input type="text" id="search-input" placeholder="Search ${L3.toLowerCase()}s, jobs..." autocomplete="off">
    </div>
    <div id="search-results" style="display:none"></div>
    <div id="progress-section">
      <div class="summary-row" id="summary"></div>
      <div class="toggle-row" style="margin-top:4px">
        <button id="btn-all" class="active">All Jobs</button>
        <button id="btn-partial">In Progress</button>
        <button id="btn-complete">Fully Staged</button>
      </div>
      <div class="progress-list" id="progress-list" style="margin-top:8px"></div>
      <div id="progress-empty" class="sr-empty" style="display:none">No active jobs</div>
    </div>
  </main>
  `, `
    ${SHARED_JS}
    ${stationNamesJS(config)}
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var FLAG_LABELS = { hold: 'Hold', remake: 'Remake', missing_part: 'Missing', priority: 'Priority' };

    function renderFlagBadges(flags) {
      if (!flags) return '';
      var parsed = typeof flags === 'string' ? JSON.parse(flags) : flags;
      if (!parsed || !parsed.length) return '';
      return '<div class="flag-badges">' + parsed.map(function(f) {
        return '<span class="flag-badge flag-' + f + '">' + (FLAG_LABELS[f] || f) + '</span>';
      }).join('') + '</div>';
    }

    // --- Search ---
    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');
    var progressSection = document.getElementById('progress-section');
    var searchDebounce = null;

    searchInput.addEventListener('input', function() {
      clearTimeout(searchDebounce);
      var q = searchInput.value.trim();
      if (q.length < 2) {
        searchResults.style.display = 'none';
        progressSection.style.display = '';
        return;
      }
      searchDebounce = setTimeout(function() { doSearch(q); }, 250);
    });

    function doSearch(q) {
      fetch('/api/search?q=' + encodeURIComponent(q))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          progressSection.style.display = 'none';
          searchResults.style.display = '';
          var items = data.results || [];
          if (items.length === 0) {
            searchResults.innerHTML = '<div class="sr-empty">No results for "' + escHtml(q) + '"</div>';
            return;
          }
          searchResults.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);margin-bottom:4px">' + items.length + ' result' + (items.length !== 1 ? 's' : '') + '</div>'
            + '<div class="search-results">' + items.map(function(c) {
            var lbl = c.label || (LABELS.l3 + ' ' + c.cabinet_number);
            var stationName = c.last_station ? (STATION_NAMES[c.last_station] || c.last_station) : 'No scans';
            var locHtml = c.staging_location ? '<div class="sr-loc">' + escHtml(c.staging_location) + '</div>' : '';
            var agoHtml = c.last_scan_at ? '<div style="font-size:0.7rem;color:var(--muted)">' + timeAgo(new Date(c.last_scan_at + 'Z')) + '</div>' : '';
            return '<div class="sr-card">'
              + '<div>'
              +   '<div class="sr-primary">' + escHtml(lbl) + '</div>'
              +   '<div class="sr-secondary">' + c.job_number + ' — ' + escHtml(c.job_name) + (c.bucket_name ? ' / ' + escHtml(c.bucket_name) : '') + '</div>'
              +   '<div class="sr-station">Last: ' + stationName + '</div>'
              +   renderFlagBadges(c.flags)
              + '</div>'
              + '<div class="sr-right">'
              +   '<span class="pill pill-' + pillColor(c.status) + '">' + displayStatus(c.status) + '</span>'
              +   agoHtml
              +   locHtml
              + '</div>'
              + '</div>';
          }).join('') + '</div>';
        });
    }

    // --- Progress ---
    var progressList = document.getElementById('progress-list');
    var progressEmpty = document.getElementById('progress-empty');
    var summaryDiv = document.getElementById('summary');
    var allJobs = [];
    var filter = 'all';

    document.getElementById('btn-all').addEventListener('click', function() { setFilter('all'); });
    document.getElementById('btn-partial').addEventListener('click', function() { setFilter('partial'); });
    document.getElementById('btn-complete').addEventListener('click', function() { setFilter('complete'); });

    function setFilter(f) {
      filter = f;
      document.querySelectorAll('.toggle-row button').forEach(function(b) { b.classList.remove('active'); });
      document.getElementById('btn-' + (f === 'partial' ? 'partial' : f === 'complete' ? 'complete' : 'all')).classList.add('active');
      renderProgress();
    }

    function saveLocation(cabId, value) {
      fetch('/api/cabinets/' + cabId + '/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: value })
      });
    }

    function loadProgress() {
      fetch('/api/staging/progress')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          allJobs = data.jobs || [];
          var totalCabs = 0, totalStaged = 0;
          allJobs.forEach(function(j) { totalCabs += j.total; totalStaged += j.staged; });
          summaryDiv.innerHTML =
            '<div class="summary-stat"><strong>' + allJobs.length + '</strong> jobs</div>' +
            '<div class="summary-stat"><strong>' + totalStaged + '</strong> / ' + totalCabs + ' staged</div>' +
            '<div class="summary-stat"><strong>' + allJobs.filter(function(j) { return j.staged >= j.total; }).length + '</strong> complete</div>';
          renderProgress();
        });
    }

    function renderProgress() {
      var filtered = allJobs;
      if (filter === 'partial') filtered = allJobs.filter(function(j) { return j.staged > 0 && j.staged < j.total; });
      if (filter === 'complete') filtered = allJobs.filter(function(j) { return j.staged >= j.total; });

      if (filtered.length === 0) {
        progressList.innerHTML = '';
        progressEmpty.style.display = '';
        progressEmpty.textContent = filter === 'all' ? 'No active jobs' : 'No ' + filter + ' jobs';
        return;
      }
      progressEmpty.style.display = 'none';

      progressList.innerHTML = filtered.map(function(job, ji) {
        var pct = job.total > 0 ? Math.round((job.staged / job.total) * 100) : 0;
        var isFull = job.staged >= job.total;
        var cabsHtml = job.cabinets.map(function(cab) {
          var lbl = cab.label || (LABELS.l3 + ' ' + cab.cabinet_number);
          var bucket = cab.bucket_name ? cab.bucket_name : '';
          var stagedHtml = cab.staged_at
            ? '<span class="pj-cab-staged">Staged</span>'
            : '<span class="pj-cab-pending">' + displayStatus(cab.status) + '</span>';
          var locHtml = cab.staging_location
            ? '<div class="loc-text" data-cab="' + cab.id + '">' + escHtml(cab.staging_location) + '</div>'
            : '<div class="loc-empty" data-cab="' + cab.id + '">+ Location</div>';
          return '<div class="pj-cab">'
            + '<div class="pj-cab-info">'
            +   '<div class="pj-cab-label">' + escHtml(lbl) + ' ' + stagedHtml + '</div>'
            +   (bucket ? '<div class="pj-cab-meta">' + escHtml(bucket) + '</div>' : '')
            +   renderFlagBadges(cab.flags)
            + '</div>'
            + '<div class="loc-wrap">' + locHtml + '</div>'
            + '</div>';
        }).join('');

        return '<div class="pj-card">'
          + '<div class="pj-header" data-idx="' + ji + '">'
          +   '<div>'
          +     '<div class="pj-title">' + job.job_number + '</div>'
          +     '<div class="pj-sub">' + escHtml(job.job_name) + '</div>'
          +   '</div>'
          +   '<div class="pj-progress">'
          +     (isFull ? '<span class="pj-badge">Complete</span>' : '')
          +     '<div class="pj-bar"><div class="pj-fill' + (isFull ? ' full' : '') + '" style="width:' + pct + '%"></div></div>'
          +     '<span class="pj-pct">' + job.staged + '/' + job.total + '</span>'
          +   '</div>'
          + '</div>'
          + '<div class="pj-cabs" data-cabs="' + ji + '">' + cabsHtml + '</div>'
          + '</div>';
      }).join('');

      progressList.querySelectorAll('.pj-header').forEach(function(hdr) {
        hdr.addEventListener('click', function() {
          var cabs = progressList.querySelector('[data-cabs="' + hdr.dataset.idx + '"]');
          cabs.classList.toggle('open');
        });
      });

      wireLocEditing();
    }

    function wireLocEditing() {
      progressList.addEventListener('click', function(e) {
        var tgt = e.target;
        if (!tgt.classList.contains('loc-text') && !tgt.classList.contains('loc-empty')) return;
        var cabId = tgt.getAttribute('data-cab');
        var current = tgt.classList.contains('loc-text') ? tgt.textContent : '';
        var input = document.createElement('input');
        input.type = 'text';
        input.value = current;
        input.placeholder = 'e.g. Bay 3 left';
        var parent = tgt.parentNode;
        parent.replaceChild(input, tgt);
        input.focus();
        input.select();
        function commit() {
          var val = input.value.trim();
          saveLocation(cabId, val);
          var el = document.createElement('div');
          if (val) {
            el.className = 'loc-text';
            el.textContent = val;
          } else {
            el.className = 'loc-empty';
            el.textContent = '+ Location';
          }
          el.setAttribute('data-cab', cabId);
          parent.replaceChild(el, input);
        }
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') input.blur(); });
      });
    }

    loadProgress();
  `, user, "/staging", [], config);
}
