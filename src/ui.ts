import type { TenantConfig } from "./index";

const SHARED_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --border: #334155;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #3b82f6;
      --success: #22c55e;
      --error: #ef4444;
      --warning: #f59e0b;
      --purple: #a855f7;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    header h1 { font-size: 1.25rem; font-weight: 700; }
    header nav { display: flex; gap: 16px; }
    header a { color: var(--muted); text-decoration: none; font-size: 0.875rem; }
    header a:hover { color: var(--text); }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    input[type="text"], input[type="number"], select {
      width: 100%;
      padding: 12px;
      font-size: 1.125rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      outline: none;
    }
    input:focus, select:focus { border-color: var(--accent); }
    input::placeholder { color: #475569; }
    .btn {
      padding: 12px 20px;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--accent); color: white; width: 100%; padding: 16px; font-size: 1.25rem; border-radius: 12px; }
    .btn-success { background: var(--success); color: white; width: 100%; padding: 16px; font-size: 1.25rem; border-radius: 12px; }
    .btn-sm { padding: 8px 14px; font-size: 0.8rem; border-radius: 8px; }
    .result {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      display: none;
    }
    .result.success { display: block; background: rgba(34,197,94,0.15); border: 1px solid var(--success); color: var(--success); }
    .result.error { display: block; background: rgba(239,68,68,0.15); border: 1px solid var(--error); color: var(--error); }
    .result .detail { font-weight: 400; font-size: 0.875rem; margin-top: 4px; color: var(--muted); }
    .pill {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .pill-blue { background: rgba(59,130,246,0.15); color: var(--accent); }
    .pill-green { background: rgba(34,197,94,0.15); color: var(--success); }
    .pill-yellow { background: rgba(245,158,11,0.15); color: var(--warning); }
    .pill-purple { background: rgba(168,85,247,0.15); color: var(--purple); }
`;

function page(title: string, extraStyles: string, nav: string, body: string, script: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>FabWorks — ${title}</title>
  <style>${SHARED_STYLES}${extraStyles}</style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <nav>${nav}</nav>
  </header>
  ${body}
  <script>${script}</script>
</body>
</html>`;
}

const NAV_SCAN = '<a href="/">Scan</a>';
const NAV_NEW = '<a href="/jobs/new">+ Job</a>';
const NAV_DASH = '<a href="/dashboard">Dashboard</a>';
const NAV_STATIONS = '<a href="/stations">Stations</a>';

function stationNamesJS(config: TenantConfig): string {
  const map: Record<string, string> = {};
  config.stations.forEach((s) => { map[s.slug] = s.name; });
  return `var STATION_NAMES = ${JSON.stringify(map)};`;
}

function displayStatusJS(config: TenantConfig): string {
  const map: Record<string, string> = { pending: "Pending", in_progress: "In Progress", complete: "Complete" };
  config.l3_statuses.forEach((s) => {
    if (!map[s]) map[s] = s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
  });
  return `function displayStatus(s) { var m = ${JSON.stringify(map)}; return m[s] || s; }`;
}

const STATUS_COLOR_JS = `
    function statusColor(s) {
      if (s === 'pending') return 'yellow';
      if (s === 'in_progress') return 'blue';
      if (s === 'complete') return 'green';
      return 'blue';
    }
    function pillColor(s) {
      if (s === 'pending') return 'yellow';
      if (s === 'in_progress') return 'blue';
      if (s === 'complete' || s === 'assembled' || s === 'inspected' || s === 'shipped' || s === 'packed') return 'green';
      if (s === 'staged') return 'purple';
      return 'blue';
    }`;

// ─── SCAN PAGE ────────────────────────────────────────────
export function scanPage(config: TenantConfig): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page("FabWorks", `
    main { flex: 1; padding: 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .station-bar { display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; -webkit-overflow-scrolling: touch; }
    .station-chip {
      flex-shrink: 0; padding: 8px 12px; font-size: 0.75rem; font-weight: 600;
      background: var(--bg); border: 2px solid var(--border); border-radius: 20px;
      color: var(--muted); cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .station-chip:active { transform: scale(0.96); }
    .station-chip.selected { border-color: var(--accent); background: rgba(59,130,246,0.15); color: var(--accent); }
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
    .scanned-by-row { display: flex; gap: 8px; align-items: center; }
    .scanned-by-row input { flex: 1; }
    .remember-label { font-size: 0.75rem; color: var(--muted); display: flex; align-items: center; gap: 4px; white-space: nowrap; }
    .section-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    #context-panel { display: none; }
    .swipe-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface); border: 1px solid var(--accent); border-radius: 12px;
      padding: 12px 24px; font-size: 1rem; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100;
    }
    .swipe-toast.show { opacity: 1; }
`, `${NAV_NEW}${NAV_STATIONS}${NAV_DASH}`, `
  <main>
    <div class="card">
      <label>Your Station</label>
      <div class="station-bar" id="station-bar"></div>
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
    <div class="card">
      <label>Scanned By</label>
      <div class="scanned-by-row">
        <input type="text" id="scanned-by" placeholder="Name">
        <label class="remember-label"><input type="checkbox" id="remember-name" checked> Save</label>
      </div>
    </div>
    <button class="btn btn-primary" id="scan-btn" disabled>Log Scan</button>
    <div class="result" id="result"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var selectedStation = localStorage.getItem('fw_station') || null;
    var selectedEntityId = null;
    var jobData = null;
    var debounceTimer = null;

    var stationBar = document.getElementById('station-bar');
    var jobInput = document.getElementById('job-input');
    var jobInfo = document.getElementById('job-info');
    var contextPanel = document.getElementById('context-panel');
    var contextLabel = document.getElementById('context-label');
    var entityList = document.getElementById('entity-list');
    var scanBtn = document.getElementById('scan-btn');
    var resultDiv = document.getElementById('result');
    var scannedByInput = document.getElementById('scanned-by');
    var rememberCheck = document.getElementById('remember-name');

    var savedName = localStorage.getItem('fw_name');
    if (savedName) scannedByInput.value = savedName;

    function getStation(slug) {
      for (var i = 0; i < STATIONS.length; i++) {
        if (STATIONS[i].slug === slug) return STATIONS[i];
      }
      return null;
    }

    STATIONS.forEach(function(s) {
      var chip = document.createElement('button');
      chip.className = 'station-chip' + (s.slug === selectedStation ? ' selected' : '');
      chip.textContent = s.name;
      chip.dataset.slug = s.slug;
      chip.addEventListener('click', function() {
        selectedStation = s.slug;
        localStorage.setItem('fw_station', s.slug);
        document.querySelectorAll('.station-chip').forEach(function(c) { c.classList.toggle('selected', c.dataset.slug === s.slug); });
        selectedEntityId = null;
        loadJobContext();
        updateScanBtn();
      });
      stationBar.appendChild(chip);
    });

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
          return '<div class="entity-row' + (selectedEntityId === cab.id ? ' selected' : '') + '" data-id="' + cab.id + '">' +
            '<div><div class="name">' + LABELS.l3 + ' ' + cab.cabinet_number + '</div><div class="meta">' + (cab.label || '') + '</div></div>' +
            '<span class="pill pill-' + pillColor(cab.status) + '">' + displayStatus(cab.status) + '</span></div>';
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
      if (station.level === 'l1') { scanBtn.disabled = false; return; }
      scanBtn.disabled = !selectedEntityId;
    }

    scanBtn.addEventListener('click', function() {
      if (scanBtn.disabled) return;
      scanBtn.disabled = true;
      scanBtn.textContent = 'Logging...';
      resultDiv.className = 'result';
      resultDiv.style.display = 'none';

      if (rememberCheck.checked) localStorage.setItem('fw_name', scannedByInput.value);

      var station = getStation(selectedStation);
      var payload = {
        station: selectedStation,
        job_id: jobData.id,
        scanned_by: scannedByInput.value.trim() || undefined,
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
        resultDiv.className = 'result error';
        resultDiv.innerHTML = 'Network error';
        scanBtn.textContent = 'Log Scan';
        updateScanBtn();
      });
    });

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
      var idx = -1;
      for (var i = 0; i < STATIONS.length; i++) {
        if (STATIONS[i].slug === selectedStation) { idx = i; break; }
      }
      if (idx === -1) idx = 0;
      else idx = (idx + dir + STATIONS.length) % STATIONS.length;
      var s = STATIONS[idx];
      selectedStation = s.slug;
      localStorage.setItem('fw_station', s.slug);
      document.querySelectorAll('.station-chip').forEach(function(c) { c.classList.toggle('selected', c.dataset.slug === s.slug); });
      var chip = document.querySelector('.station-chip[data-slug="' + s.slug + '"]');
      if (chip) chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      selectedEntityId = null;
      loadJobContext();
      updateScanBtn();
      showToast(dir > 0 ? s.name + ' →' : '← ' + s.name);
    }

    var touchStartX = 0, touchStartY = 0, swiping = false;
    document.addEventListener('touchstart', function(e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
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
`);
}

// ─── NEW JOB PAGE ────────────────────────────────────────
export function newJobPage(config: TenantConfig): string {
  const L1 = config.entity_labels.l1;
  const L3 = config.entity_labels.l3;
  return page(`New ${L1}`, `
    main { flex: 1; padding: 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .recent-job {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem;
    }
    .recent-job:last-child { border-bottom: none; }
    .recent-job .num { font-weight: 600; }
    .recent-job a { color: var(--accent); text-decoration: none; font-size: 0.8rem; }
`, `${NAV_SCAN}${NAV_STATIONS}${NAV_DASH}`, `
  <main>
    <div class="card">
      <label>${L1} Number</label>
      <input type="text" id="job-number" placeholder="3480" inputmode="numeric" autocomplete="off">
    </div>
    <div class="card">
      <label>${L1} Name</label>
      <input type="text" id="job-name" placeholder="Muirfield Lot 10" autocomplete="off">
    </div>
    <div class="card">
      <label>Total ${L3} Count</label>
      <input type="number" id="cab-count" placeholder="24" min="0">
    </div>
    <button class="btn btn-success" id="submit-btn" disabled>Create ${L1}</button>
    <div class="result" id="result"></div>
    <div class="card">
      <label>Recent ${L1}s</label>
      <div id="recent-list"></div>
    </div>
  </main>
`, `
    var LABELS = ${JSON.stringify(config.entity_labels)};

    var numInput = document.getElementById('job-number');
    var nameInput = document.getElementById('job-name');
    var cabInput = document.getElementById('cab-count');
    var submitBtn = document.getElementById('submit-btn');
    var resultDiv = document.getElementById('result');
    var recentList = document.getElementById('recent-list');

    function updateBtn() { submitBtn.disabled = !(numInput.value.trim() && nameInput.value.trim()); }
    numInput.addEventListener('input', updateBtn);
    nameInput.addEventListener('input', updateBtn);

    submitBtn.addEventListener('click', function() {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      resultDiv.className = 'result'; resultDiv.style.display = 'none';
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_number: numInput.value.trim(),
          job_name: nameInput.value.trim(),
          cabinet_count: parseInt(cabInput.value) || 0,
        }),
      }).then(function(res) {
        return res.json().then(function(data) { return { ok: res.ok, data: data }; });
      }).then(function(r) {
        if (r.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = 'Created: ' + r.data.job_number + ' ' + r.data.job_name +
            '<div class="detail"><a href="/job/' + r.data.id + '" style="color:var(--accent)">Set up ' + LABELS.l2.toLowerCase() + 's & ' + LABELS.l3.toLowerCase() + 's &rarr;</a></div>';
          numInput.value = ''; nameInput.value = ''; cabInput.value = '';
          numInput.focus(); updateBtn(); loadRecent();
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = r.data.error;
        }
        submitBtn.textContent = 'Create ${L1}'; updateBtn();
      }).catch(function() {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = 'Network error';
        submitBtn.textContent = 'Create ${L1}'; updateBtn();
      });
    });

    function loadRecent() {
      fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
        recentList.innerHTML = jobs.length === 0
          ? '<div style="color:var(--muted);font-size:0.8rem">No ' + LABELS.l1.toLowerCase() + 's yet</div>'
          : jobs.slice(0, 10).map(function(j) {
            return '<div class="recent-job"><span class="num">' + j.job_number + ' ' + j.job_name + '</span>' +
              '<a href="/job/' + j.id + '">Setup</a></div>';
          }).join('');
      });
    }
    loadRecent();
`);
}

// ─── JOB DETAIL PAGE ────────────────────────────────────
export function jobDetailPage(config: TenantConfig): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page(`${config.entity_labels.l1} Detail`, `
    main { flex: 1; padding: 16px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .job-title { font-size: 1.4rem; font-weight: 700; }
    .job-meta { font-size: 0.85rem; color: var(--muted); margin-top: 4px; }
    .section-title { font-size: 0.85rem; font-weight: 700; color: var(--text); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .add-form { display: flex; gap: 8px; margin-bottom: 12px; }
    .add-form input, .add-form select { flex: 1; padding: 10px; font-size: 0.9rem; }
    .entity-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; margin-bottom: 6px; font-size: 0.85rem;
    }
    .entity-item .name { font-weight: 600; }
    .entity-item .meta { font-size: 0.75rem; color: var(--muted); }
    .scan-log { font-size: 0.8rem; }
    .scan-entry { padding: 6px 0; border-bottom: 1px solid var(--border); }
    .scan-entry:last-child { border-bottom: none; }
    .scan-station { font-weight: 600; color: var(--accent); }
    .scan-meta { color: var(--muted); font-size: 0.75rem; }
    .cab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 6px; }
    .cab-tile {
      padding: 10px 6px; text-align: center; background: var(--bg);
      border: 1px solid var(--border); border-radius: 8px; font-size: 0.8rem; font-weight: 600;
    }
    .cab-tile.assembling { border-color: var(--accent); color: var(--accent); }
    .cab-tile.assembled { border-color: var(--success); color: var(--success); }
    .cab-tile.staged { border-color: var(--purple); color: var(--purple); }
    .cab-tile .sub { font-weight: 400; font-size: 0.65rem; color: var(--muted); }
`, `${NAV_SCAN}${NAV_NEW}${NAV_STATIONS}${NAV_DASH}`, `
  <main>
    <div id="loading" style="color:var(--muted);text-align:center;padding:48px">Loading...</div>
    <div id="content" style="display:none">
      <div class="card">
        <div class="job-title" id="job-title"></div>
        <div class="job-meta" id="job-meta"></div>
      </div>
      <div class="card">
        <div class="section-title">${L2}s</div>
        <div class="add-form">
          <input type="text" id="bucket-name" placeholder="C1 Mirlux Matte">
          <input type="number" id="bucket-cabs" placeholder="4" style="max-width:60px" min="1">
          <button class="btn btn-sm" id="add-bucket-btn" style="background:var(--accent);color:white">Add</button>
        </div>
        <div id="bucket-list"></div>
      </div>
      <div class="card">
        <div class="section-title">
          <span>${L3}s</span>
          <button class="btn btn-sm" id="gen-cabs-btn" style="background:var(--accent);color:white">Auto-generate</button>
        </div>
        <div class="add-form">
          <input type="number" id="cab-number" placeholder="${L3} #" min="1" style="max-width:80px">
          <input type="text" id="cab-label" placeholder="Label (optional)">
          <select id="cab-bucket" style="max-width:120px;font-size:0.8rem"><option value="">No ${L2.toLowerCase()}</option></select>
          <button class="btn btn-sm" id="add-cab-btn" style="background:var(--accent);color:white">Add</button>
        </div>
        <div class="cab-grid" id="cab-grid"></div>
      </div>
      <div class="card">
        <div class="section-title">Scan History</div>
        <div class="scan-log" id="scan-log"></div>
      </div>
    </div>
  </main>
`, `
    ${stationNamesJS(config)}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var jobId = window.location.pathname.split('/').pop();
    var job = null;

    function load() {
      fetch('/api/jobs/' + jobId).then(function(r) { return r.json(); }).then(function(data) {
        job = data;
        if (job.error) { document.getElementById('loading').textContent = job.error; return; }
        document.getElementById('loading').style.display = 'none';
        var content = document.getElementById('content');
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.gap = '16px';

        document.getElementById('job-title').textContent = job.job_number + ' ' + job.job_name;
        document.getElementById('job-meta').textContent =
          job.cabinet_count + ' total ' + LABELS.l3.toLowerCase() + 's — ' + job.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's — ' + job.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's entered';

        var bucketList = document.getElementById('bucket-list');
        bucketList.innerHTML = job.buckets.map(function(b) {
          return '<div class="entity-item"><div><span class="name">' + b.name + '</span>' +
            '<div class="meta">' + b.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div></div>' +
            '<span class="pill pill-' + pillColor(b.status) + '">' + displayStatus(b.status) + '</span></div>';
        }).join('') || '<div style="color:var(--muted);font-size:0.8rem">No ' + LABELS.l2.toLowerCase() + 's yet</div>';

        var sel = document.getElementById('cab-bucket');
        sel.innerHTML = '<option value="">No ' + LABELS.l2.toLowerCase() + '</option>' +
          job.buckets.map(function(b) { return '<option value="' + b.id + '">' + b.name + '</option>'; }).join('');

        var grid = document.getElementById('cab-grid');
        grid.innerHTML = job.cabinets.map(function(c) {
          return '<div class="cab-tile ' + c.status + '">' + LABELS.l3 + ' ' + c.cabinet_number +
            '<div class="sub">' + (c.label || displayStatus(c.status)) + '</div></div>';
        }).join('') || '<div style="color:var(--muted);font-size:0.8rem">No ' + LABELS.l3.toLowerCase() + 's yet</div>';

        var log = document.getElementById('scan-log');
        log.innerHTML = job.scans.map(function(s) {
          return '<div class="scan-entry"><span class="scan-station">' + (STATION_NAMES[s.station] || s.station) + '</span> — ' +
            (s.scanned_by || '?') + '<div class="scan-meta">' +
            new Date(s.scanned_at + 'Z').toLocaleString() + '</div></div>';
        }).join('') || '<div style="color:var(--muted)">No scans yet</div>';
      });
    }

    document.getElementById('add-bucket-btn').addEventListener('click', function() {
      var name = document.getElementById('bucket-name').value.trim();
      var cabs = parseInt(document.getElementById('bucket-cabs').value) || 4;
      if (!name) return;
      fetch('/api/jobs/' + jobId + '/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, cabinet_count: cabs }),
      }).then(function() {
        document.getElementById('bucket-name').value = '';
        document.getElementById('bucket-cabs').value = '';
        load();
      });
    });

    document.getElementById('add-cab-btn').addEventListener('click', function() {
      var num = parseInt(document.getElementById('cab-number').value);
      var label = document.getElementById('cab-label').value.trim();
      var bucketId = document.getElementById('cab-bucket').value;
      if (!num) return;
      fetch('/api/jobs/' + jobId + '/cabinets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinet_number: num, label: label || undefined, bucket_id: bucketId ? parseInt(bucketId) : undefined }),
      }).then(function() {
        document.getElementById('cab-number').value = '';
        document.getElementById('cab-label').value = '';
        load();
      });
    });

    document.getElementById('gen-cabs-btn').addEventListener('click', function() {
      if (!job || job.buckets.length === 0) return;
      var existing = {};
      job.cabinets.forEach(function(c) { existing[c.cabinet_number] = true; });
      var nextNum = job.cabinets.length > 0 ? Math.max.apply(null, job.cabinets.map(function(c) { return c.cabinet_number; })) + 1 : 1;

      var promises = [];
      job.buckets.forEach(function(bucket) {
        for (var i = 0; i < bucket.cabinet_count; i++) {
          while (existing[nextNum]) nextNum++;
          promises.push(fetch('/api/jobs/' + jobId + '/cabinets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cabinet_number: nextNum, bucket_id: bucket.id, label: bucket.name }),
          }));
          existing[nextNum] = true;
          nextNum++;
        }
      });
      Promise.all(promises).then(function() { load(); });
    });

    load();
`);
}

// ─── DASHBOARD ────────────────────────────────────────────
export function dashboardPage(config: TenantConfig): string {
  return page("Dashboard", `
    main { padding: 16px; max-width: 1100px; margin: 0 auto; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .top-bar span { font-size: 0.8rem; color: var(--muted); }
    .top-bar-right { display: flex; align-items: center; gap: 10px; }
    .auto-label { font-size: 0.7rem; color: var(--muted); display: flex; align-items: center; gap: 4px; }
    .refresh-btn { padding: 6px 14px; font-size: 0.8rem; font-weight: 600; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); cursor: pointer; }
    .two-col { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }
    .job-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
    .job-header h2 { font-size: 1.1rem; }
    .job-header a { color: var(--accent); text-decoration: none; font-size: 0.75rem; }
    .progress-bar { height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .progress-fill.green { background: var(--success); }
    .stats-row { display: flex; gap: 16px; font-size: 0.8rem; color: var(--muted); flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 4px; }
    .stat .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-pending { background: var(--border); }
    .dot-active { background: var(--accent); }
    .dot-done { background: var(--success); }
    .dot-terminal { background: var(--purple); }
    .bucket-row { font-size: 0.75rem; color: var(--muted); padding: 4px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
    .bucket-row:last-child { border-bottom: none; }
    .feed-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; max-height: 80vh; overflow-y: auto; }
    .feed-panel h3 { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .feed-item { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
    .feed-item:last-child { border-bottom: none; }
    .feed-job { font-weight: 600; color: var(--text); }
    .feed-station { color: var(--accent); }
    .feed-detail { color: var(--muted); font-size: 0.7rem; }
    .feed-meta { color: var(--muted); font-size: 0.7rem; margin-top: 2px; }
    .empty { text-align: center; padding: 48px 16px; color: var(--muted); }
    .empty a { color: var(--accent); text-decoration: none; }
`, `${NAV_SCAN}${NAV_NEW}${NAV_STATIONS}`, `
  <main>
    <div class="top-bar">
      <span id="updated"></span>
      <div class="top-bar-right">
        <label class="auto-label"><input type="checkbox" id="auto-refresh" checked> Auto 30s</label>
        <button class="refresh-btn" id="refresh-btn">Refresh</button>
      </div>
    </div>
    <div class="two-col">
      <div id="jobs"></div>
      <div class="feed-panel">
        <h3>Live Feed</h3>
        <div id="feed"></div>
      </div>
    </div>
  </main>
`, `
    ${stationNamesJS(config)}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var L3_STATUSES = ${JSON.stringify(config.l3_statuses)};
    var TERMINAL = ${JSON.stringify(config.l3_terminal_status)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var jobsDiv = document.getElementById('jobs');
    var feedDiv = document.getElementById('feed');
    var updatedSpan = document.getElementById('updated');
    var refreshBtn = document.getElementById('refresh-btn');
    var autoCheck = document.getElementById('auto-refresh');
    var autoTimer = null;

    function timeAgo(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    function load() {
      Promise.all([
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }),
        fetch('/api/scans/recent?limit=25').then(function(r) { return r.json(); }),
      ]).then(function(results) {
        var jRes = results[0];
        var feedRes = results[1];

        feedDiv.innerHTML = feedRes.length === 0
          ? '<div style="color:var(--muted);font-size:0.8rem">No scans yet</div>'
          : feedRes.map(function(s) {
            var t = new Date(s.scanned_at + 'Z');
            var detail = s.bucket_name ? s.bucket_name : s.cabinet_number ? LABELS.l3 + ' ' + s.cabinet_number : '';
            return '<div class="feed-item">' +
              '<span class="feed-job">' + s.job_number + '</span> ' +
              '<span class="feed-station">' + (STATION_NAMES[s.station] || s.station) + '</span>' +
              (detail ? '<div class="feed-detail">' + detail + '</div>' : '') +
              '<div class="feed-meta">' + (s.scanned_by || '?') + ' — ' + timeAgo(t) + '</div></div>';
          }).join('');

        if (jRes.length === 0) {
          jobsDiv.innerHTML = '<div class="empty">No active ' + LABELS.l1.toLowerCase() + 's. <a href="/jobs/new">Create one</a></div>';
          updatedSpan.textContent = 'Updated ' + new Date().toLocaleTimeString();
          return;
        }

        Promise.all(jRes.map(function(j) { return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }); }))
          .then(function(details) {
            jobsDiv.innerHTML = details.map(function(job) {
              var total = job.cabinets.length || job.cabinet_count || 1;
              var counts = {};
              L3_STATUSES.forEach(function(st) { counts[st] = 0; });
              job.cabinets.forEach(function(c) { counts[c.status] = (counts[c.status] || 0) + 1; });
              var terminalCount = counts[TERMINAL] || 0;
              var pct = total > 0 ? Math.round((terminalCount / total) * 100) : 0;

              var lastScan = job.scans[0];
              var lastInfo = lastScan
                ? (STATION_NAMES[lastScan.station] || lastScan.station) + ' by ' + (lastScan.scanned_by || '?') +
                  ' — ' + timeAgo(new Date(lastScan.scanned_at + 'Z'))
                : 'No scans yet';

              var bucketInfo = job.buckets.map(function(b) {
                return '<div class="bucket-row"><span>' + b.name + '</span><span class="pill pill-' + statusColor(b.status) + '">' + displayStatus(b.status) + '</span></div>';
              }).join('');

              var statsHtml = L3_STATUSES.map(function(st, i) {
                var dotClass = st === 'pending' ? 'dot-pending' : st === TERMINAL ? 'dot-terminal' : i === L3_STATUSES.length - 1 ? 'dot-done' : i > 0 ? 'dot-active' : 'dot-pending';
                return '<div class="stat"><div class="dot ' + dotClass + '"></div>' + (counts[st] || 0) + ' ' + displayStatus(st).toLowerCase() + '</div>';
              }).join('');

              return '<div class="job-card">' +
                '<div class="job-header"><h2>' + job.job_number + ' ' + job.job_name + '</h2>' +
                '<a href="/job/' + job.id + '">Details</a></div>' +
                '<div class="progress-bar"><div class="progress-fill green" style="width:' + pct + '%"></div></div>' +
                '<div class="stats-row">' + statsHtml + '</div>' +
                (bucketInfo ? '<div style="margin-top:10px">' + bucketInfo + '</div>' : '') +
                '<div style="margin-top:8px;font-size:0.75rem;color:var(--muted)">Last: ' + lastInfo + '</div>' +
              '</div>';
            }).join('');

            updatedSpan.textContent = 'Updated ' + new Date().toLocaleTimeString();
          });
      });
    }

    function startAuto() { stopAuto(); if (autoCheck.checked) autoTimer = setInterval(load, 30000); }
    function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    autoCheck.addEventListener('change', startAuto);
    refreshBtn.addEventListener('click', load);
    load();
    startAuto();
`);
}

// ─── STATION VIEW PAGE ──────────────────────────────────────
export function stationViewPage(config: TenantConfig): string {
  return page("Station View", `
    main { flex: 1; padding: 16px; max-width: 600px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .station-bar { display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; -webkit-overflow-scrolling: touch; }
    .station-chip {
      flex-shrink: 0; padding: 8px 12px; font-size: 0.75rem; font-weight: 600;
      background: var(--bg); border: 2px solid var(--border); border-radius: 20px;
      color: var(--muted); cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .station-chip:active { transform: scale(0.96); }
    .station-chip.selected { border-color: var(--accent); background: rgba(59,130,246,0.15); color: var(--accent); }
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
`, `${NAV_SCAN}${NAV_NEW}${NAV_DASH}`, `
  <main>
    <div class="card">
      <label>Station</label>
      <div class="station-bar" id="station-bar"></div>
    </div>
    <div id="item-count" style="font-size:0.8rem;color:var(--muted)"></div>
    <div id="items"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};

    var selected = localStorage.getItem('stationView') || STATIONS[0].slug;
    var bar = document.getElementById('station-bar');
    var itemsDiv = document.getElementById('items');
    var countDiv = document.getElementById('item-count');

    function renderBar() {
      bar.innerHTML = STATIONS.map(function(s) {
        return '<div class="station-chip' + (s.slug === selected ? ' selected' : '') +
          '" data-slug="' + s.slug + '">' + s.name + '</div>';
      }).join('');
    }

    bar.addEventListener('click', function(e) {
      var chip = e.target.closest('.station-chip');
      if (!chip) return;
      selected = chip.dataset.slug;
      localStorage.setItem('stationView', selected);
      renderBar();
      load();
    });

    function timeAgo(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    function levelLabel(level) {
      if (level === 'l1') return LABELS.l1.toLowerCase() + 's';
      if (level === 'l2') return LABELS.l2.toLowerCase() + 's';
      return LABELS.l3.toLowerCase() + 's';
    }

    function load() {
      fetch('/api/stations/' + selected + '/items')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var items = data.items || [];
          var level = data.level;
          countDiv.textContent = items.length + ' ' + levelLabel(level) + ' at this station';

          if (items.length === 0) {
            itemsDiv.innerHTML = '<div class="empty-state">Nothing here right now</div>';
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
              return '<div class="item-card"><div>' +
                '<div class="primary">' + lbl + '</div>' +
                '<div class="secondary">' + cab.job_number + ' ' + cab.job_name + bucket + '</div>' +
                '</div><div class="right">' +
                '<div>' + timeAgo(new Date(cab.scanned_at + 'Z')) + '</div>' +
                '<a href="/job/' + cab.job_id + '">Details</a>' +
                '</div></div>';
            }).join('');
          }
        });
    }

    renderBar();
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
      var idx = -1;
      for (var i = 0; i < STATIONS.length; i++) {
        if (STATIONS[i].slug === selected) { idx = i; break; }
      }
      if (idx === -1) idx = 0;
      else idx = (idx + dir + STATIONS.length) % STATIONS.length;
      var s = STATIONS[idx];
      selected = s.slug;
      localStorage.setItem('stationView', s.slug);
      renderBar();
      var chip = document.querySelector('.station-chip[data-slug="' + s.slug + '"]');
      if (chip) chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      load();
      showToast(dir > 0 ? s.name + ' →' : '← ' + s.name);
    }

    var touchStartX = 0, touchStartY = 0, swiping = false;
    document.addEventListener('touchstart', function(e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
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
      } else if (dy > 50) {
        load();
        showToast('Refreshed');
      }
    }, { passive: true });
`);
}
