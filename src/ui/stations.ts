import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS, ROLE_LEVELS, SHARED_JS } from "./layout";

export function stationViewPage(config: TenantConfig, user: SessionUser): string {
  return page("Station View", `
    main { gap: 12px; }
    .station-carousel { display: flex; align-items: center; justify-content: center; gap: 0; user-select: none; }
    .station-prev, .station-next {
      flex: 1; font-size: 0.75rem; color: var(--muted); opacity: 0.4; cursor: pointer;
      padding: 8px 6px; transition: opacity 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .station-prev { text-align: right; }
    .station-next { text-align: left; }
    .station-prev:hover, .station-next:hover { opacity: 0.7; }
    .station-current {
      flex-shrink: 0; padding: 8px 16px; font-size: 1rem; font-weight: 700;
      background: rgba(59,130,246,0.15); border: 2px solid var(--accent);
      border-radius: 8px; color: var(--accent); text-align: center; min-width: 120px;
    }
    .station-seq { font-size: 0.55rem; font-weight: 400; color: var(--muted); display: block; margin-top: 1px; }
    .date-picker-row { display: flex; align-items: center; gap: 8px; }
    .date-picker-row button {
      padding: 6px 14px; font-size: 0.8rem; font-weight: 600; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface); color: var(--muted); cursor: pointer;
    }
    .date-picker-row button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .date-picker-row input[type="date"] {
      padding: 6px 10px; font-size: 0.8rem; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      color-scheme: dark;
    }
    .date-label { font-size: 0.7rem; color: var(--warning); font-weight: 600; }
    .level-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 8px 0 2px; }
    .item-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;
    }
    .item-card .primary { font-weight: 700; font-size: 1rem; }
    .item-card .secondary { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .item-card .right { text-align: right; font-size: 0.75rem; color: var(--muted); }
    .item-card a { color: var(--accent); text-decoration: none; font-size: 0.75rem; }
    .count-badge { font-size: 0.7rem; font-weight: 700; background: rgba(59,130,246,0.15); color: var(--accent); padding: 2px 8px; border-radius: 10px; margin-left: 6px; }
    .empty-state { text-align: center; padding: 48px 16px; color: var(--muted); font-size: 0.9rem; }
    .swipe-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface); border: 1px solid var(--accent); border-radius: 12px;
      padding: 12px 24px; font-size: 1rem; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100;
    }
    .swipe-toast.show { opacity: 1; }
    .staging-job { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .staging-job-header { padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .staging-job-header:active { background: rgba(59,130,246,0.08); }
    .staging-job-title { font-weight: 700; font-size: 1rem; }
    .staging-job-sub { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .staging-progress { display: flex; align-items: center; gap: 8px; }
    .staging-progress-bar { width: 60px; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .staging-progress-fill { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.3s; }
    .staging-progress-fill.full { background: var(--success); }
    .staging-progress-text { font-size: 0.75rem; font-weight: 600; color: var(--muted); min-width: 36px; text-align: right; }
    .staging-badge { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(34,197,94,0.15); color: var(--success); }
    .staging-cabs { border-top: 1px solid var(--border); display: none; }
    .staging-cabs.open { display: block; }
    .staging-cab { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); gap: 8px; }
    .staging-cab:last-child { border-bottom: none; }
    .staging-cab-info { flex: 1; min-width: 0; }
    .staging-cab-label { font-weight: 600; font-size: 0.85rem; }
    .staging-cab-bucket { font-size: 0.7rem; color: var(--muted); }
    .staging-loc { flex-shrink: 0; max-width: 140px; }
    .staging-loc-text { font-size: 0.8rem; color: var(--accent); cursor: pointer; padding: 4px 8px; border-radius: 6px; background: rgba(59,130,246,0.08); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .staging-loc-empty { font-size: 0.8rem; color: var(--muted); cursor: pointer; font-style: italic; padding: 4px 8px; }
    .staging-loc input {
      width: 130px; padding: 6px 8px; font-size: 0.8rem; border-radius: 6px;
      border: 1px solid var(--accent); background: var(--bg); color: var(--text);
      outline: none;
    }
    .staging-toggle { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    .staging-toggle button {
      flex: 1; padding: 8px 16px; font-size: 0.8rem; font-weight: 600; border: none;
      background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.2s;
    }
    .staging-toggle button.active { background: var(--accent); color: #fff; }
    .staging-loc-group { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); padding: 8px 0 4px; }
    .staging-flat-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px;
    }
    .staging-flat-job { font-size: 0.7rem; color: var(--muted); }
    .staging-flat-label { font-weight: 600; font-size: 0.85rem; }
`, `
  <main>
    <div class="card" style="padding:10px 12px">
      <div class="station-carousel" id="station-carousel">
        <div class="station-prev" id="station-prev"></div>
        <div class="station-current" id="station-current">Select Station</div>
        <div class="station-next" id="station-next"></div>
      </div>
    </div>
    <div class="date-picker-row">
      <button id="btn-live" class="active">Live</button>
      <input type="date" id="date-pick" />
      <span id="date-label" class="date-label" style="display:none"></span>
    </div>
    <div id="staging-controls" style="display:none">
      <div class="staging-toggle">
        <button id="btn-by-job" class="active">By Job</button>
        <button id="btn-by-loc">By Location</button>
      </div>
    </div>
    <div id="item-count" style="font-size:0.8rem;color:var(--muted)"></div>
    <div id="items"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    ${SHARED_JS}
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var TERMINAL_STATUS = ${JSON.stringify(config.l3_terminal_status)};

    var selected = localStorage.getItem('stationView') || STATIONS[0].slug;
    var svPrev = document.getElementById('station-prev');
    var svCurrent = document.getElementById('station-current');
    var svNext = document.getElementById('station-next');
    var itemsDiv = document.getElementById('items');
    var countDiv = document.getElementById('item-count');

    var viewDate = null;
    var btnLive = document.getElementById('btn-live');
    var datePick = document.getElementById('date-pick');
    var dateLabel = document.getElementById('date-label');

    btnLive.addEventListener('click', function() {
      viewDate = null;
      datePick.value = '';
      btnLive.classList.add('active');
      dateLabel.style.display = 'none';
      load();
    });
    datePick.addEventListener('change', function() {
      if (datePick.value) {
        viewDate = datePick.value;
        btnLive.classList.remove('active');
        dateLabel.textContent = 'Viewing ' + viewDate;
        dateLabel.style.display = '';
      } else {
        viewDate = null;
        btnLive.classList.add('active');
        dateLabel.style.display = 'none';
      }
      load();
    });

    var stagingMode = localStorage.getItem('stagingMode') || 'job';
    var stagingControls = document.getElementById('staging-controls');
    var btnByJob = document.getElementById('btn-by-job');
    var btnByLoc = document.getElementById('btn-by-loc');
    var lastStagingData = null;

    btnByJob.addEventListener('click', function() { stagingMode = 'job'; localStorage.setItem('stagingMode', 'job'); btnByJob.classList.add('active'); btnByLoc.classList.remove('active'); if (lastStagingData) renderStagingView(lastStagingData); });
    btnByLoc.addEventListener('click', function() { stagingMode = 'loc'; localStorage.setItem('stagingMode', 'loc'); btnByLoc.classList.add('active'); btnByJob.classList.remove('active'); if (lastStagingData) renderStagingView(lastStagingData); });
    if (stagingMode === 'loc') { btnByLoc.classList.add('active'); btnByJob.classList.remove('active'); }

    function isTerminal(slug) {
      var s = STATIONS.find(function(st) { return st.slug === slug; });
      return s && s.sets_status === TERMINAL_STATUS;
    }

    function svIdx() {
      for (var i = 0; i < STATIONS.length; i++) { if (STATIONS[i].slug === selected) return i; }
      return 0;
    }

    function renderCarousel() {
      var idx = svIdx();
      var s = STATIONS[idx];
      svCurrent.innerHTML = s.name + '<span class="station-seq">' + (idx + 1) + ' of ' + STATIONS.length + '</span>';
      svPrev.textContent = idx > 0 ? STATIONS[idx - 1].name : '';
      svNext.textContent = idx < STATIONS.length - 1 ? STATIONS[idx + 1].name : '';
    }

    function selectStation(slug) {
      selected = slug;
      localStorage.setItem('stationView', slug);
      renderCarousel();
      load();
    }

    svPrev.addEventListener('click', function() { var i = svIdx(); if (i > 0) selectStation(STATIONS[i - 1].slug); });
    svNext.addEventListener('click', function() { var i = svIdx(); if (i < STATIONS.length - 1) selectStation(STATIONS[i + 1].slug); });

    function levelLabel(level) {
      if (level === 'l1') return LABELS.l1.toLowerCase() + 's';
      if (level === 'l2') return LABELS.l2.toLowerCase() + 's';
      return LABELS.l3.toLowerCase() + 's';
    }

    function saveLocation(cabId, value) {
      fetch('/api/cabinets/' + cabId + '/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: value })
      });
    }

    function renderStagingView(jobs) {
      lastStagingData = jobs;
      if (jobs.length === 0) {
        countDiv.textContent = '0 jobs in staging';
        itemsDiv.innerHTML = '<div class="empty-state">Nothing staged right now</div>';
        return;
      }
      if (stagingMode === 'loc') {
        renderByLocation(jobs);
      } else {
        renderByJob(jobs);
      }
      wireLocationEditing();
    }

    function renderByJob(jobs) {
      countDiv.textContent = jobs.length + ' job' + (jobs.length !== 1 ? 's' : '') + ' in staging';
      itemsDiv.innerHTML = jobs.map(function(job, ji) {
        var pct = job.cabinet_count > 0 ? Math.round((job.staged_count / job.cabinet_count) * 100) : 0;
        var isFull = job.staged_count >= job.cabinet_count;
        var cabsHtml = job.cabinets.map(function(cab) {
          var lbl = cab.label || (LABELS.l3 + ' ' + cab.cabinet_number);
          var bucket = cab.bucket_name ? cab.bucket_name : '';
          var locHtml = cab.staging_location
            ? '<div class="staging-loc-text" data-cab="' + cab.id + '">' + cab.staging_location.replace(/</g,'&lt;') + '</div>'
            : '<div class="staging-loc-empty" data-cab="' + cab.id + '">+ Location</div>';
          return '<div class="staging-cab">' +
            '<div class="staging-cab-info">' +
              '<a href="/cabinet/' + cab.id + '" class="staging-cab-label" style="color:var(--text);text-decoration:none">' + lbl + '</a>' +
              (bucket ? '<div class="staging-cab-bucket">' + bucket + '</div>' : '') +
            '</div>' +
            '<div class="staging-loc">' + locHtml + '</div>' +
          '</div>';
        }).join('');
        return '<div class="staging-job" style="display:flex;flex-direction:column;gap:0">' +
          '<div class="staging-job-header" data-job-idx="' + ji + '">' +
            '<div>' +
              '<div class="staging-job-title">' + job.job_number + '</div>' +
              '<div class="staging-job-sub">' + job.job_name + '</div>' +
            '</div>' +
            '<div class="staging-progress">' +
              (isFull ? '<span class="staging-badge">Fully Staged</span>' : '') +
              '<div class="staging-progress-bar"><div class="staging-progress-fill' + (isFull ? ' full' : '') + '" style="width:' + pct + '%"></div></div>' +
              '<span class="staging-progress-text">' + job.staged_count + '/' + job.cabinet_count + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="staging-cabs" data-cabs="' + ji + '">' + cabsHtml + '</div>' +
        '</div>';
      }).join('');

      itemsDiv.querySelectorAll('.staging-job-header').forEach(function(hdr) {
        hdr.addEventListener('click', function() {
          var idx = hdr.getAttribute('data-job-idx');
          var cabs = itemsDiv.querySelector('[data-cabs="' + idx + '"]');
          cabs.classList.toggle('open');
        });
      });
    }

    function renderByLocation(jobs) {
      var allCabs = [];
      jobs.forEach(function(job) {
        job.cabinets.forEach(function(cab) {
          allCabs.push({ cab: cab, job_number: job.job_number, job_name: job.job_name, job_id: job.id });
        });
      });
      allCabs.sort(function(a, b) {
        var locA = (a.cab.staging_location || '').toLowerCase();
        var locB = (b.cab.staging_location || '').toLowerCase();
        if (!locA && !locB) return a.job_number.localeCompare(b.job_number) || a.cab.cabinet_number - b.cab.cabinet_number;
        if (!locA) return 1;
        if (!locB) return -1;
        if (locA !== locB) return locA.localeCompare(locB);
        return a.job_number.localeCompare(b.job_number) || a.cab.cabinet_number - b.cab.cabinet_number;
      });

      var totalWithLoc = allCabs.filter(function(c) { return c.cab.staging_location; }).length;
      countDiv.textContent = allCabs.length + ' ' + LABELS.l3.toLowerCase() + 's — ' + totalWithLoc + ' with locations';

      var html = '';
      var currentLoc = null;
      allCabs.forEach(function(item) {
        var loc = item.cab.staging_location || null;
        if (loc !== currentLoc) {
          currentLoc = loc;
          html += '<div class="staging-loc-group">' + (loc ? loc.replace(/</g,'&lt;') : 'No Location') + '</div>';
        }
        var lbl = item.cab.label || (LABELS.l3 + ' ' + item.cab.cabinet_number);
        var locHtml = item.cab.staging_location
          ? '<div class="staging-loc-text" data-cab="' + item.cab.id + '">' + item.cab.staging_location.replace(/</g,'&lt;') + '</div>'
          : '<div class="staging-loc-empty" data-cab="' + item.cab.id + '">+ Location</div>';
        var metaLine = '';
        if (item.cab.accessories || item.cab.notes || item.cab.assembly_sheet_url) {
          var parts = [];
          if (item.cab.accessories) parts.push(item.cab.accessories.split('\\n').join(', ').replace(/</g,'&lt;'));
          if (item.cab.notes) parts.push(item.cab.notes.split('\\n').join(', ').replace(/</g,'&lt;'));
          if (item.cab.assembly_sheet_url) parts.push('<a href="' + item.cab.assembly_sheet_url.replace(/"/g,'&quot;') + '" target="_blank" rel="noopener" style="color:var(--accent);font-size:0.7rem">Sheet ↗</a>');
          metaLine = '<div style="font-size:0.7rem;color:var(--muted);margin-top:2px">' + parts.join(' · ') + '</div>';
        }
        html += '<div class="staging-flat-card">' +
          '<div>' +
            '<a href="/cabinet/' + item.cab.id + '" class="staging-flat-label" style="color:var(--text);text-decoration:none">' + lbl + '</a>' +
            '<div class="staging-flat-job">' + item.job_number + ' ' + item.job_name + (item.cab.bucket_name ? ' / ' + item.cab.bucket_name : '') + '</div>' +
            metaLine +
          '</div>' +
          '<div class="staging-loc">' + locHtml + '</div>' +
        '</div>';
      });
      itemsDiv.innerHTML = html;
    }

    function wireLocationEditing() {
      itemsDiv.addEventListener('click', function(e) {
        var tgt = e.target;
        if (!tgt.classList.contains('staging-loc-text') && !tgt.classList.contains('staging-loc-empty')) return;
        var cabId = tgt.getAttribute('data-cab');
        var current = tgt.classList.contains('staging-loc-text') ? tgt.textContent : '';
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
          var newEl = document.createElement('div');
          if (val) {
            newEl.className = 'staging-loc-text';
            newEl.textContent = val;
          } else {
            newEl.className = 'staging-loc-empty';
            newEl.textContent = '+ Location';
          }
          newEl.setAttribute('data-cab', cabId);
          parent.replaceChild(newEl, input);
        }
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') input.blur(); });
      });
    }

    function load() {
      var qs = viewDate ? '?date=' + viewDate : '';
      if (isTerminal(selected)) {
        stagingControls.style.display = '';
        fetch('/api/stations/' + selected + '/staging' + qs)
          .then(function(r) { return r.json(); })
          .then(function(data) { renderStagingView(data.jobs || []); });
        return;
      }
      stagingControls.style.display = 'none';
      lastStagingData = null;
      fetch('/api/stations/' + selected + '/items' + qs)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var items = data.items || [];
          var level = data.level;
          var suffix = viewDate ? ' on ' + viewDate : ' at this station';
          countDiv.textContent = items.length + ' ' + levelLabel(level) + suffix;

          if (items.length === 0) {
            itemsDiv.innerHTML = '<div class="empty-state">' + (viewDate ? 'No activity on ' + viewDate : 'Nothing here right now') + '</div>';
            return;
          }

          if (level === 'l1') {
            itemsDiv.innerHTML = items.map(function(j) {
              return '<div class="item-card"><div>' +
                '<div class="primary">' + j.job_number + '</div>' +
                '<div class="secondary">' + j.job_name + '</div>' +
                '</div><div class="right">' +
                '<div>' + j.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div>' +
                '<div>' + timeAgo(new Date(j.scanned_at + 'Z')) + '</div>' +
                '<a href="/job/' + j.id + '">Details</a>' +
                '</div></div>';
            }).join('');
          } else if (level === 'l2') {
            itemsDiv.innerHTML = items.map(function(b) {
              return '<div class="item-card"><div>' +
                '<div class="primary">' + b.name + '</div>' +
                '<div class="secondary">' + b.job_number + ' ' + b.job_name + '</div>' +
                '</div><div class="right">' +
                '<div>' + b.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div>' +
                '<div>' + timeAgo(new Date(b.scanned_at + 'Z')) + '</div>' +
                '<a href="/job/' + b.job_id + '">Details</a>' +
                '</div></div>';
            }).join('');
          } else {
            itemsDiv.innerHTML = items.map(function(cab) {
              var lbl = cab.label || (LABELS.l3 + ' ' + cab.cabinet_number);
              var bucket = cab.bucket_name ? ' / ' + cab.bucket_name : '';
              var meta = '';
              if (cab.accessories || cab.notes || cab.assembly_sheet_url) {
                meta = '<div style="padding:4px 14px 10px;font-size:0.75rem;color:var(--muted)">';
                if (cab.accessories) meta += '<div><strong>Accessories:</strong> ' + cab.accessories.split('\\n').join(', ').replace(/</g,'&lt;') + '</div>';
                if (cab.notes) meta += '<div><strong>Notes:</strong> ' + cab.notes.split('\\n').join(', ').replace(/</g,'&lt;') + '</div>';
                if (cab.assembly_sheet_url) meta += '<div><a href="' + cab.assembly_sheet_url.replace(/"/g,'&quot;') + '" target="_blank" rel="noopener" style="color:var(--accent)">Assembly Sheet ↗</a></div>';
                meta += '</div>';
              }
              return '<a href="/cabinet/' + cab.id + '" class="item-card" style="text-decoration:none;color:var(--text)"><div>' +
                '<div class="primary">' + lbl + '</div>' +
                '<div class="secondary">' + cab.job_number + ' ' + cab.job_name + bucket + '</div>' +
                '</div><div class="right">' +
                '<div>' + timeAgo(new Date(cab.scanned_at + 'Z')) + '</div>' +
                '<span style="color:var(--accent);font-size:0.75rem">View →</span>' +
                '</div></a>' + meta;
            }).join('');
          }
        });
    }

    renderCarousel();
    load();

    // --- Swipe gestures ---
    var swipeToast = document.getElementById('swipe-toast');
    var toastTimer = null;
    function showToast(msg) {
      swipeToast.textContent = msg;
      swipeToast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { swipeToast.classList.remove('show'); }, 600);
    }

    function cycleStation(dir) {
      var idx = svIdx();
      idx = (idx + dir + STATIONS.length) % STATIONS.length;
      var s = STATIONS[idx];
      selectStation(s.slug);
      showToast(dir > 0 ? s.name + ' →' : '← ' + s.name);
    }

    var touchStartX = 0, touchStartY = 0, swiping = false;
    document.addEventListener('touchstart', function(e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.target.closest && e.target.closest('.qr-fab')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!swiping) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
      if (!swiping) return;
      swiping = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      var absDx = Math.abs(dx), absDy = Math.abs(dy);
      if (absDx < 50 && absDy < 50) return;

      if (absDx > absDy) {
        cycleStation(dx < 0 ? 1 : -1);
      } else if (dy > 50 && window.scrollY < 10) {
        load();
        showToast('Refreshed');
      }
    }, { passive: true });
`, user, "/stations", [], config);
}

