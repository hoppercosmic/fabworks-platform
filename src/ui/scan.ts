import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS, ROLE_LEVELS, SHARED_JS } from "./layout";

export function scanPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page("FabWorks", `
    main { flex: 1; padding: 10px 16px 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    #active-build-banner { background: rgba(245,158,11,0.15); border: 1px solid var(--warning, #f59e0b); color: var(--warning, #f59e0b); cursor: pointer; font-weight: 600; font-size: 0.9rem; text-align: center; padding: 10px; }
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
    .entity-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .entity-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; background: var(--bg); border: 2px solid var(--border);
      border-radius: 8px; cursor: pointer; transition: all 0.15s;
    }
    .entity-row:active { transform: scale(0.98); }
    .entity-row.selected { border-color: var(--accent); background: rgba(59,130,246,0.1); }
    .entity-row .name { font-weight: 600; font-size: 0.9rem; }
    .entity-row .meta { font-size: 0.75rem; color: var(--muted); }
    .section-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    #context-panel { display: none; }
    .swipe-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface); border: 1px solid var(--accent); border-radius: 12px;
      padding: 12px 24px; font-size: 1rem; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100;
    }
    .swipe-toast.show { opacity: 1; }
    .cab-meta-panel {
      margin: -2px 0 6px; padding: 8px 12px; background: rgba(59,130,246,0.06);
      border: 1px solid var(--border); border-top: none; border-radius: 0 0 8px 8px;
      font-size: 0.8rem;
    }
    .cab-meta-panel .meta-label { font-weight: 600; font-size: 0.7rem; color: var(--muted); text-transform: uppercase; margin-top: 6px; }
    .cab-meta-panel .meta-label:first-child { margin-top: 0; }
    .cab-meta-panel .meta-value { margin-top: 2px; white-space: pre-line; }
    .cab-meta-panel a { color: var(--accent); }
  `, `
  <main>
    <div class="card" style="padding:10px 12px">
      <div class="station-carousel" id="station-carousel">
        <div class="station-prev" id="station-prev"></div>
        <div class="station-current" id="station-current">Select Station</div>
        <div class="station-next" id="station-next"></div>
      </div>
    </div>
    <div class="card">
      <label>${config.entity_labels.l1}</label>
      <input type="text" id="job-input" placeholder="${config.entity_labels.l1} number" inputmode="numeric" autocomplete="off">
      <div id="job-info" style="margin-top:8px;font-size:0.85rem;color:var(--muted)"></div>
    </div>
    <div class="card" id="context-panel">
      <div id="context-label" class="section-label"></div>
      <div class="entity-list" id="entity-list"></div>
    </div>
    <div id="active-build-banner" style="display:none" class="card" onclick="window.location.href='/workbench'"></div>
    <button class="btn btn-primary" id="scan-btn" disabled>Log Scan</button>
    <div class="result" id="result"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    ${SHARED_JS}
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var selectedStation = localStorage.getItem('fw_station') || null;
    var selectedEntityId = null;
    var jobData = null;
    var debounceTimer = null;
    var pendingStation = null;

    var stationPrev = document.getElementById('station-prev');
    var stationCurrent = document.getElementById('station-current');
    var stationNext = document.getElementById('station-next');
    var jobInput = document.getElementById('job-input');
    var jobInfo = document.getElementById('job-info');
    var contextPanel = document.getElementById('context-panel');
    var contextLabel = document.getElementById('context-label');
    var entityList = document.getElementById('entity-list');
    var scanBtn = document.getElementById('scan-btn');
    var resultDiv = document.getElementById('result');
    var USER_NAME = ${JSON.stringify(user.name)};

    function getStation(slug) {
      for (var i = 0; i < STATIONS.length; i++) {
        if (STATIONS[i].slug === slug) return STATIONS[i];
      }
      return null;
    }

    function stationIdx() {
      for (var i = 0; i < STATIONS.length; i++) { if (STATIONS[i].slug === selectedStation) return i; }
      return 0;
    }

    function renderCarousel() {
      var idx = stationIdx();
      var s = STATIONS[idx];
      stationCurrent.innerHTML = s.name + '<span class="station-seq">' + (idx + 1) + ' of ' + STATIONS.length + '</span>';
      stationPrev.textContent = idx > 0 ? STATIONS[idx - 1].name : '';
      stationNext.textContent = idx < STATIONS.length - 1 ? STATIONS[idx + 1].name : '';
    }

    function selectStation(slug) {
      selectedStation = slug;
      localStorage.setItem('fw_station', slug);
      selectedEntityId = null;
      renderCarousel();
      loadJobContext();
      updateScanBtn();
    }

    if (!selectedStation) selectStation(STATIONS[0].slug);
    renderCarousel();

    stationPrev.addEventListener('click', function() { var i = stationIdx(); if (i > 0) selectStation(STATIONS[i - 1].slug); });
    stationNext.addEventListener('click', function() { var i = stationIdx(); if (i < STATIONS.length - 1) selectStation(STATIONS[i + 1].slug); });

    jobInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      jobData = null;
      selectedEntityId = null;
      jobInfo.textContent = '';
      contextPanel.style.display = 'none';
      updateScanBtn();
      var val = jobInput.value.trim();
      if (val.length >= 3) {
        debounceTimer = setTimeout(function() { lookupJob(val); }, 300);
      }
    });

    function lookupJob(num) {
      fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
        var job = jobs.find(function(j) { return j.job_number === num; });
        if (job) {
          fetch('/api/jobs/' + job.id).then(function(r) { return r.json(); }).then(function(detail) {
            jobData = detail;
            jobInfo.innerHTML = '<strong>' + detail.job_name + '</strong> — ' +
              detail.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + detail.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
            loadJobContext();
            updateScanBtn();
          });
        } else {
          jobInfo.textContent = 'No active ' + LABELS.l1.toLowerCase() + ' found';
          updateScanBtn();
        }
      });
    }

    function loadJobContext() {
      if (!jobData || !selectedStation) { contextPanel.style.display = 'none'; return; }
      var station = getStation(selectedStation);
      if (!station || station.level === 'l1') { contextPanel.style.display = 'none'; return; }
      contextPanel.style.display = 'block';

      if (station.level === 'l2') {
        contextLabel.textContent = 'Select ' + LABELS.l2;
        if (jobData.buckets.length === 0) {
          entityList.innerHTML = '<div style="color:var(--muted);font-size:0.85rem">No ' + LABELS.l2.toLowerCase() + 's — <a href="/job/' + jobData.id + '" style="color:var(--accent)">add ' + LABELS.l2.toLowerCase() + 's</a></div>';
          return;
        }
        entityList.innerHTML = jobData.buckets.map(function(b) {
          return '<div class="entity-row' + (selectedEntityId === b.id ? ' selected' : '') + '" data-id="' + b.id + '">' +
            '<div><div class="name">' + b.name + '</div><div class="meta">' + b.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div></div>' +
            '<span class="pill pill-' + pillColor(b.status) + '">' + displayStatus(b.status) + '</span></div>';
        }).join('');
      } else {
        contextLabel.textContent = 'Select ' + LABELS.l3;
        if (jobData.cabinets.length === 0) {
          entityList.innerHTML = '<div style="color:var(--muted);font-size:0.85rem">No ' + LABELS.l3.toLowerCase() + 's — <a href="/job/' + jobData.id + '" style="color:var(--accent)">add ' + LABELS.l3.toLowerCase() + 's</a></div>';
          return;
        }
        entityList.innerHTML = jobData.cabinets.map(function(cab) {
          var row = '<div class="entity-row' + (selectedEntityId === cab.id ? ' selected' : '') + '" data-id="' + cab.id + '">' +
            '<div><div class="name">' + LABELS.l3 + ' ' + cab.cabinet_number + '</div><div class="meta">' + (cab.label || '') + '</div></div>' +
            '<span class="pill pill-' + pillColor(cab.status) + '">' + displayStatus(cab.status) + '</span></div>';
          if (cab.accessories || cab.notes || cab.assembly_sheet_url) {
            row += '<div class="cab-meta-panel">';
            if (cab.accessories) row += '<div class="meta-label">Accessories</div><div class="meta-value">' + escHtml(cab.accessories) + '</div>';
            if (cab.notes) row += '<div class="meta-label">Notes</div><div class="meta-value">' + escHtml(cab.notes) + '</div>';
            if (cab.assembly_sheet_url) row += '<div class="meta-label">Assembly Sheet</div><div class="meta-value"><a href="' + escHtml(cab.assembly_sheet_url) + '" target="_blank" rel="noopener">Open Assembly Sheet ↗</a></div>';
            row += '</div>';
          }
          return row;
        }).join('');
      }

      entityList.querySelectorAll('.entity-row').forEach(function(row) {
        row.addEventListener('click', function() {
          selectedEntityId = parseInt(row.dataset.id);
          entityList.querySelectorAll('.entity-row').forEach(function(r) { r.classList.toggle('selected', r.dataset.id == selectedEntityId); });
          updateScanBtn();
        });
      });
    }

    function updateScanBtn() {
      if (!selectedStation || !jobData) { scanBtn.disabled = true; return; }
      var station = getStation(selectedStation);
      if (!station) { scanBtn.disabled = true; return; }
      var isBuildStation = station.sets_status === 'assembling';
      scanBtn.textContent = isBuildStation ? 'Start Build' : 'Log Scan';
      if (station.level === 'l1') { scanBtn.disabled = false; return; }
      scanBtn.disabled = !selectedEntityId;
    }

    var actionInFlight = false;

    function fireAction() {
      if (!selectedStation || !jobData) return;
      var station = getStation(selectedStation);
      if (!station) return;
      if (station.level !== 'l1' && !selectedEntityId) return;
      if (actionInFlight) return;
      actionInFlight = true;

      if (station.sets_status === 'assembling' && selectedEntityId) {
        scanBtn.disabled = true;
        scanBtn.textContent = 'Starting...';
        fetch('/api/build/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cabinet_id: selectedEntityId }),
        }).then(function(res) {
          return res.json().then(function(d) { return { ok: res.ok, data: d }; });
        }).then(function(r) {
          actionInFlight = false;
          if (r.ok || r.data.active_session_id) {
            window.location.href = '/workbench';
          } else {
            resultDiv.className = 'result error';
            resultDiv.innerHTML = r.data.error;
            resultDiv.style.display = 'block';
            scanBtn.textContent = 'Start Build';
            updateScanBtn();
          }
        });
        return;
      }

      scanBtn.disabled = true;
      scanBtn.textContent = 'Logging...';
      resultDiv.className = 'result';
      resultDiv.style.display = 'none';

      var payload = {
        station: selectedStation,
        job_id: jobData.id,
        scanned_by: USER_NAME,
      };
      if (station.level === 'l2') payload.bucket_id = selectedEntityId;
      if (station.level === 'l3') payload.cabinet_id = selectedEntityId;

      fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(function(res) {
        return res.json().then(function(data) { return { ok: res.ok, data: data }; });
      }).then(function(r) {
        actionInFlight = false;
        if (r.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = r.data.station + '<div class="detail">' +
            r.data.job_number + ' ' + r.data.job_name +
            (r.data.scanned_by ? ' — ' + r.data.scanned_by : '') + '</div>';
          selectedEntityId = null;
          fetch('/api/jobs/' + jobData.id).then(function(r2) { return r2.json(); }).then(function(detail) {
            jobData = detail;
            loadJobContext();
          });
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = r.data.error;
        }
        scanBtn.textContent = 'Log Scan';
        updateScanBtn();
      }).catch(function() {
        actionInFlight = false;
        resultDiv.className = 'result error';
        resultDiv.innerHTML = 'Network error';
        scanBtn.textContent = 'Log Scan';
        updateScanBtn();
      });
    }

    scanBtn.addEventListener('click', function() {
      if (scanBtn.disabled) return;
      fireAction();
    });

    // --- QR handler (fed by global FAB scanner) ---
    function tryAutoFire() {
      if (!pendingStation || !jobData || !selectedEntityId) return;
      selectStation(pendingStation);
      pendingStation = null;
      fireAction();
    }

    function handleQR(text) {
      var parts = text.split(':');
      if (parts[0] !== 'fw' || parts.length < 3) {
        scannerStatus.textContent = 'Not a FabWorks code';
        return;
      }
      var type = parts[1];

      if (type === 'sta') {
        var slug = parts[2];
        var station = getStation(slug);
        if (!station) {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = 'Unknown station: ' + slug;
          resultDiv.style.display = 'block';
          return;
        }
        selectStation(slug);
        if (jobData && (station.level === 'l1' || selectedEntityId)) {
          fireAction();
        } else {
          pendingStation = slug;
          showToast(station.name + ' — scan a ' + LABELS.l3.toLowerCase());
        }
        return;
      }

      var id = parseInt(parts[2]);

      if (type === 'l1' || type === 'job') {
        fetch('/api/jobs/' + id).then(function(r) { return r.json(); }).then(function(detail) {
          if (detail.error) return;
          jobData = detail;
          jobInput.value = detail.job_number;
          jobInfo.innerHTML = '<strong>' + detail.job_name + '</strong> — ' +
            detail.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + detail.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
          loadJobContext();
          updateScanBtn();
        });
      } else if (type === 'l2' || type === 'bucket') {
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
          var found = null;
          var promises = jobs.map(function(j) {
            return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }).then(function(detail) {
              var bucket = detail.buckets.find(function(b) { return b.id === id; });
              if (bucket) found = detail;
            });
          });
          Promise.all(promises).then(function() {
            if (found) {
              jobData = found;
              jobInput.value = found.job_number;
              jobInfo.innerHTML = '<strong>' + found.job_name + '</strong> — ' +
                found.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + found.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
              selectedEntityId = id;
              loadJobContext();
              updateScanBtn();
              tryAutoFire();
            }
          });
        });
      } else if (type === 'l3' || type === 'cabinet') {
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
          var found = null;
          var promises = jobs.map(function(j) {
            return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }).then(function(detail) {
              var cab = detail.cabinets.find(function(c) { return c.id === id; });
              if (cab) found = detail;
            });
          });
          Promise.all(promises).then(function() {
            if (found) {
              jobData = found;
              jobInput.value = found.job_number;
              jobInfo.innerHTML = '<strong>' + found.job_name + '</strong> — ' +
                found.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + found.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
              selectedEntityId = id;
              loadJobContext();
              updateScanBtn();
              tryAutoFire();
            }
          });
        });
      }
    }

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
      if (!STATIONS.length) return;
      var idx = stationIdx();
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
      } else if (dy < -50) {
        scanBtn.click();
      } else if (dy > 50) {
        if (jobData) {
          fetch('/api/jobs/' + jobData.id).then(function(r) { return r.json(); }).then(function(detail) {
            jobData = detail;
            loadJobContext();
            showToast('Refreshed');
          });
        }
      }
    }, { passive: true });

    window._fabworksHandleQR = handleQR;

    var qrParam = new URLSearchParams(window.location.search).get('qr');
    if (qrParam) {
      history.replaceState(null, '', '/scan');
      handleQR(qrParam);
    }

    fetch('/api/build/active').then(function(r) { return r.json(); }).then(function(data) {
      if (data.session) {
        var b = document.getElementById('active-build-banner');
        b.textContent = 'Build in progress — ${config.entity_labels.l3} #' + data.session.cabinet_number + ' →';
        b.style.display = 'block';
      }
    });
`, user, "/scan", [], config);
}

