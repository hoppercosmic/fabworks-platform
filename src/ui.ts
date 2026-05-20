import type { TenantConfig, SessionUser } from "./index";

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

function page(title: string, extraStyles: string, nav: string, body: string, script: string, cdnScripts: string[] = []): string {
  const cdnTags = cdnScripts.map((src) => `<script src="${src}"></script>`).join("\n  ");
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
  ${cdnTags}
  <script>${script}</script>
</body>
</html>`;
}

const NAV_SCAN = '<a href="/">Scan</a>';
const NAV_NEW = '<a href="/jobs/new">+ Job</a>';
const NAV_DASH = '<a href="/dashboard">Dashboard</a>';
const NAV_STATIONS = '<a href="/stations">Stations</a>';
const NAV_KPI = '<a href="/kpi">KPI</a>';

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

// ─── LOGIN PAGE ────────────────────────────────────────────
export function loginPage(): string {
  return page("Login", `
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .login-card { width: 100%; max-width: 360px; }
    .login-card h2 { font-size: 1.4rem; margin-bottom: 20px; text-align: center; }
    .login-card .field { margin-bottom: 16px; }
    .login-error { color: var(--error); font-size: 0.85rem; text-align: center; margin-top: 8px; display: none; }
  `, "", `
  <main>
    <div class="card login-card">
      <h2>FabWorks</h2>
      <div class="field">
        <label>Email</label>
        <input type="text" id="email" placeholder="you@example.com" autocomplete="email" autocapitalize="none">
      </div>
      <div class="field">
        <label>PIN</label>
        <input type="text" id="pin" placeholder="Your PIN" inputmode="numeric" autocomplete="current-password">
      </div>
      <button class="btn btn-primary" id="login-btn">Log In</button>
      <div class="login-error" id="error"></div>
    </div>
  </main>
  `, `
    var emailInput = document.getElementById('email');
    var pinInput = document.getElementById('pin');
    var loginBtn = document.getElementById('login-btn');
    var errorDiv = document.getElementById('error');

    var savedEmail = localStorage.getItem('fw_email');
    if (savedEmail) emailInput.value = savedEmail;

    function doLogin() {
      errorDiv.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim(), pin: pinInput.value.trim() }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          localStorage.setItem('fw_email', emailInput.value.trim());
          localStorage.setItem('fw_name', r.data.user.name);
          window.location.href = '/';
        } else {
          errorDiv.textContent = r.data.error;
          errorDiv.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.textContent = 'Log In';
        }
      }).catch(function() {
        errorDiv.textContent = 'Network error';
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      });
    }

    loginBtn.addEventListener('click', doLogin);
    pinInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
  `);
}

// ─── SCAN PAGE ────────────────────────────────────────────
export function scanPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page("FabWorks", `
    main { flex: 1; padding: 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .station-carousel { display: flex; align-items: center; justify-content: center; gap: 0; user-select: none; }
    .station-prev, .station-next {
      flex: 1; font-size: 0.8rem; color: var(--muted); opacity: 0.4; cursor: pointer;
      padding: 10px 8px; transition: opacity 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .station-prev { text-align: right; }
    .station-next { text-align: left; }
    .station-prev:hover, .station-next:hover { opacity: 0.7; }
    .station-current {
      flex-shrink: 0; padding: 10px 20px; font-size: 1.1rem; font-weight: 700;
      background: rgba(59,130,246,0.15); border: 2px solid var(--accent);
      border-radius: 10px; color: var(--accent); text-align: center; min-width: 140px;
    }
    .station-seq { font-size: 0.6rem; font-weight: 400; color: var(--muted); display: block; margin-top: 2px; }
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
    .job-input-row { display: flex; gap: 8px; align-items: center; }
    .job-input-row input { flex: 1; }
    .cam-btn {
      width: 48px; height: 48px; flex-shrink: 0; border: 1px solid var(--border);
      border-radius: 8px; background: var(--bg); color: var(--accent); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
    }
    .cam-btn:active { transform: scale(0.95); }
    .scanner-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 200;
      display: none; flex-direction: column; align-items: center; justify-content: center;
    }
    .scanner-overlay.active { display: flex; }
    .scanner-close {
      position: absolute; top: 16px; right: 16px; background: none; border: none;
      color: white; font-size: 2rem; cursor: pointer; z-index: 201;
    }
    #qr-reader { width: 100%; max-width: 400px; }
    .scanner-status { color: var(--muted); font-size: 0.85rem; margin-top: 12px; }
    .swipe-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface); border: 1px solid var(--accent); border-radius: 12px;
      padding: 12px 24px; font-size: 1rem; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100;
    }
    .swipe-toast.show { opacity: 1; }
    .user-menu { position: relative; }
    .user-btn { background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--muted); font-size: 0.75rem; padding: 4px 10px; cursor: pointer; }
    .user-btn:hover { color: var(--text); border-color: var(--accent); }
    .user-dropdown { display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; min-width: 140px; z-index: 50; overflow: hidden; }
    .user-dropdown.open { display: block; }
    .user-dropdown a { display: block; padding: 10px 14px; color: var(--text); text-decoration: none; font-size: 0.8rem; }
    .user-dropdown a:hover { background: var(--bg); }
`, `${NAV_NEW}${NAV_STATIONS}${NAV_DASH}${NAV_KPI}<div class="user-menu"><button class="user-btn" id="user-btn">${user.name}</button><div class="user-dropdown" id="user-dropdown"><a href="#" id="logout-link">Log out</a></div></div>`, `
  <main>
    <div class="card">
      <div class="station-carousel" id="station-carousel">
        <div class="station-prev" id="station-prev"></div>
        <div class="station-current" id="station-current">Select Station</div>
        <div class="station-next" id="station-next"></div>
      </div>
    </div>
    <div class="card">
      <label>${config.entity_labels.l1}</label>
      <div class="job-input-row">
        <input type="text" id="job-input" placeholder="${config.entity_labels.l1} number" inputmode="numeric" autocomplete="off">
        <button class="cam-btn" id="cam-btn" title="Scan QR code">&#x1F4F7;</button>
      </div>
      <div id="job-info" style="margin-top:8px;font-size:0.85rem;color:var(--muted)"></div>
    </div>
    <div class="scanner-overlay" id="scanner-overlay">
      <button class="scanner-close" id="scanner-close">&times;</button>
      <div id="qr-reader"></div>
      <div class="scanner-status" id="scanner-status">Point camera at a FabWorks QR code</div>
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
    var scannedByInput = document.getElementById('scanned-by');
    var rememberCheck = document.getElementById('remember-name');

    scannedByInput.value = ${JSON.stringify(user.name)};

    // User menu
    var userBtn = document.getElementById('user-btn');
    var userDrop = document.getElementById('user-dropdown');
    userBtn.addEventListener('click', function(e) { e.stopPropagation(); userDrop.classList.toggle('open'); });
    document.addEventListener('click', function() { userDrop.classList.remove('open'); });
    document.getElementById('logout-link').addEventListener('click', function(e) {
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/login'; });
    });

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

    // --- QR Scanner ---
    var scannerOverlay = document.getElementById('scanner-overlay');
    var scannerStatus = document.getElementById('scanner-status');
    var qrScanner = null;
    var scannerActive = false;

    document.getElementById('cam-btn').addEventListener('click', function() {
      if (typeof Html5Qrcode === 'undefined') {
        scannerStatus.textContent = 'Scanner library not loaded';
        return;
      }
      scannerOverlay.classList.add('active');
      scannerStatus.textContent = 'Starting camera...';

      if (!qrScanner) qrScanner = new Html5Qrcode('qr-reader');

      qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        function(decoded) { handleQR(decoded); },
        function() {}
      ).then(function() {
        scannerActive = true;
        scannerStatus.textContent = 'Point camera at a FabWorks QR code';
      }).catch(function(err) {
        scannerStatus.textContent = 'Camera error: ' + err;
      });
    });

    function stopScanner() {
      if (qrScanner && scannerActive) {
        qrScanner.stop().then(function() { scannerActive = false; });
      }
      scannerOverlay.classList.remove('active');
    }

    document.getElementById('scanner-close').addEventListener('click', stopScanner);

    function handleQR(text) {
      stopScanner();
      var parts = text.split(':');
      if (parts[0] !== 'fw' || parts.length < 3) {
        scannerStatus.textContent = 'Not a FabWorks code';
        return;
      }
      var type = parts[1];
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
`, ["https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"]);
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
`, `${NAV_SCAN}${NAV_STATIONS}${NAV_DASH}${NAV_KPI}`, `
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
    .label-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
    .qr-label {
      background: white; color: #111; border-radius: 8px; padding: 12px;
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .qr-label canvas { max-width: 120px; }
    .qr-label .qr-title { font-weight: 700; font-size: 0.85rem; }
    .qr-label .qr-sub { font-size: 0.7rem; color: #666; }
    #labels-panel { display: none; }
    @media print {
      header, .card, .scan-log, #scan-log, .add-form, .section-title button, .btn-sm { display: none !important; }
      #labels-panel { display: block !important; }
      .label-grid { grid-template-columns: repeat(3, 1fr); }
      .qr-label { border: 1px solid #ccc; break-inside: avoid; }
      main { padding: 0 !important; max-width: none !important; }
    }
`, `${NAV_SCAN}${NAV_NEW}${NAV_STATIONS}${NAV_DASH}${NAV_KPI}`, `
  <main>
    <div id="loading" style="color:var(--muted);text-align:center;padding:48px">Loading...</div>
    <div id="content" style="display:none">
      <div class="card">
        <div class="job-title" id="job-title"></div>
        <div class="job-meta" id="job-meta"></div>
        <div style="margin-top:8px">
          <button class="btn btn-sm" id="print-labels-btn" style="background:var(--accent);color:white">Print QR Labels</button>
          <a class="btn btn-sm" id="progress-link" style="background:var(--purple);color:white;text-decoration:none;display:inline-block;margin-left:6px">Progress Matrix</a>
        </div>
      </div>
      <div id="labels-panel">
        <div class="label-grid" id="label-grid"></div>
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
        document.getElementById('progress-link').href = '/job/' + job.id + '/progress';
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

    // --- QR Label Generation ---
    document.getElementById('print-labels-btn').addEventListener('click', function() {
      if (!job || typeof QRCode === 'undefined') return;
      var grid = document.getElementById('label-grid');
      var panel = document.getElementById('labels-panel');
      grid.innerHTML = '';
      panel.style.display = 'block';

      function makeLabel(text, title, subtitle) {
        var div = document.createElement('div');
        div.className = 'qr-label';
        var canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, text, { width: 120, margin: 1 });
        div.appendChild(canvas);
        var t = document.createElement('div');
        t.className = 'qr-title';
        t.textContent = title;
        div.appendChild(t);
        if (subtitle) {
          var s = document.createElement('div');
          s.className = 'qr-sub';
          s.textContent = subtitle;
          div.appendChild(s);
        }
        grid.appendChild(div);
      }

      makeLabel('fw:l1:' + job.id + ':' + job.job_number, job.job_number + ' ' + job.job_name, LABELS.l1);

      job.buckets.forEach(function(b) {
        makeLabel('fw:l2:' + b.id + ':' + b.name, b.name, LABELS.l2 + ' — ' + job.job_number);
      });

      job.cabinets.forEach(function(c) {
        var label = c.label || (LABELS.l3 + ' ' + c.cabinet_number);
        makeLabel('fw:l3:' + c.id + ':' + label, label, LABELS.l3 + ' #' + c.cabinet_number + ' — ' + job.job_number);
      });

      setTimeout(function() { window.print(); }, 300);
    });
`, ["https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"]);
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
`, `${NAV_SCAN}${NAV_NEW}${NAV_STATIONS}${NAV_KPI}`, `
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
    .station-carousel { display: flex; align-items: center; justify-content: center; gap: 0; user-select: none; }
    .station-prev, .station-next {
      flex: 1; font-size: 0.8rem; color: var(--muted); opacity: 0.4; cursor: pointer;
      padding: 10px 8px; transition: opacity 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .station-prev { text-align: right; }
    .station-next { text-align: left; }
    .station-prev:hover, .station-next:hover { opacity: 0.7; }
    .station-current {
      flex-shrink: 0; padding: 10px 20px; font-size: 1.1rem; font-weight: 700;
      background: rgba(59,130,246,0.15); border: 2px solid var(--accent);
      border-radius: 10px; color: var(--accent); text-align: center; min-width: 140px;
    }
    .station-seq { font-size: 0.6rem; font-weight: 400; color: var(--muted); display: block; margin-top: 2px; }
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
`, `${NAV_SCAN}${NAV_NEW}${NAV_DASH}${NAV_KPI}`, `
  <main>
    <div class="card">
      <div class="station-carousel" id="station-carousel">
        <div class="station-prev" id="station-prev"></div>
        <div class="station-current" id="station-current">Select Station</div>
        <div class="station-next" id="station-next"></div>
      </div>
    </div>
    <div id="item-count" style="font-size:0.8rem;color:var(--muted)"></div>
    <div id="items"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};

    var selected = localStorage.getItem('stationView') || STATIONS[0].slug;
    var svPrev = document.getElementById('station-prev');
    var svCurrent = document.getElementById('station-current');
    var svNext = document.getElementById('station-next');
    var itemsDiv = document.getElementById('items');
    var countDiv = document.getElementById('item-count');

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

// ─── PROGRESS MATRIX PAGE ──────────────────────────────────
export function progressPage(config: TenantConfig): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page(`${config.entity_labels.l1} Progress`, `
    main { flex: 1; padding: 16px; max-width: 1200px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .job-header-row { display: flex; justify-content: space-between; align-items: baseline; }
    .job-header-row h2 { font-size: 1.2rem; }
    .job-header-row a { color: var(--accent); text-decoration: none; font-size: 0.8rem; }
    .matrix-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .matrix { border-collapse: collapse; width: 100%; min-width: 600px; font-size: 0.75rem; }
    .matrix th, .matrix td { padding: 8px 6px; text-align: center; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .matrix th { color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.65rem; position: sticky; top: 0; background: var(--surface); }
    .matrix th:first-child, .matrix td:first-child { text-align: left; position: sticky; left: 0; background: var(--surface); z-index: 1; min-width: 140px; }
    .matrix th:first-child { z-index: 2; }
    .matrix .bucket-row td { background: var(--bg); font-weight: 700; font-size: 0.8rem; cursor: pointer; }
    .matrix .bucket-row td:first-child::before { content: '▸ '; color: var(--muted); }
    .matrix .bucket-row.expanded td:first-child::before { content: '▾ '; }
    .matrix .cab-row.hidden { display: none; }
    .matrix .cab-row td:first-child { padding-left: 20px; color: var(--muted); }
    .dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; }
    .dot-none { background: var(--border); opacity: 0.3; }
    .dot-scanned { background: var(--success); }
    .dot-current { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
    .summary { font-size: 0.8rem; color: var(--muted); }
    .summary .done { color: var(--success); font-weight: 600; }
  `, `${NAV_SCAN}${NAV_NEW}${NAV_STATIONS}${NAV_DASH}${NAV_KPI}`, `
  <main>
    <div id="loading" style="color:var(--muted);text-align:center;padding:48px">Loading...</div>
    <div id="content" style="display:none">
      <div class="card">
        <div class="job-header-row">
          <h2 id="job-title"></h2>
          <a id="detail-link" href="#">Details</a>
        </div>
        <div class="summary" id="summary"></div>
      </div>
      <div class="card">
        <div class="matrix-wrap">
          <table class="matrix" id="matrix"></table>
        </div>
      </div>
    </div>
  </main>
  `, `
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var TERMINAL = ${JSON.stringify(config.l3_terminal_status)};

    var jobId = window.location.pathname.split('/')[2];

    fetch('/api/jobs/' + jobId).then(function(r) { return r.json(); }).then(function(job) {
      if (job.error) { document.getElementById('loading').textContent = job.error; return; }

      document.getElementById('loading').style.display = 'none';
      var content = document.getElementById('content');
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      content.style.gap = '16px';

      document.getElementById('job-title').textContent = job.job_number + ' ' + job.job_name;
      document.getElementById('detail-link').href = '/job/' + job.id;

      var scanned = {};
      job.scans.forEach(function(s) {
        if (s.cabinet_id) scanned['l3:' + s.cabinet_id + ':' + s.station] = true;
        if (s.bucket_id) scanned['l2:' + s.bucket_id + ':' + s.station] = true;
        scanned['l1:' + s.job_id + ':' + s.station] = true;
      });

      function currentStation(type, id) {
        var maxSeq = -1;
        STATIONS.forEach(function(st) {
          if (scanned[type + ':' + id + ':' + st.slug] && st.seq > maxSeq) maxSeq = st.seq;
        });
        return maxSeq;
      }

      var totalCabs = job.cabinets.length;
      var doneCabs = job.cabinets.filter(function(c) { return c.status === TERMINAL; }).length;
      document.getElementById('summary').innerHTML = '<span class="done">' + doneCabs + '</span> / ' + totalCabs + ' ' + LABELS.l3.toLowerCase() + 's at terminal (' + TERMINAL + ')';

      var table = document.getElementById('matrix');
      var thead = '<tr><th>' + LABELS.l3 + '</th>';
      STATIONS.forEach(function(st) { thead += '<th>' + st.name + '</th>'; });
      thead += '</tr>';

      var tbody = '';
      var bucketMap = {};
      var noBucket = [];
      job.cabinets.forEach(function(c) {
        if (c.bucket_id) {
          if (!bucketMap[c.bucket_id]) bucketMap[c.bucket_id] = [];
          bucketMap[c.bucket_id].push(c);
        } else {
          noBucket.push(c);
        }
      });

      job.buckets.forEach(function(bucket) {
        var cabs = bucketMap[bucket.id] || [];
        var bucketDone = cabs.filter(function(c) { return c.status === TERMINAL; }).length;

        tbody += '<tr class="bucket-row" data-bucket="' + bucket.id + '"><td>' + bucket.name +
          ' (' + bucketDone + '/' + cabs.length + ')</td>';
        STATIONS.forEach(function(st) {
          if (st.level === 'l2' || st.level === 'l1') {
            var key = (st.level === 'l2' ? 'l2:' + bucket.id : 'l1:' + job.id) + ':' + st.slug;
            var cur = st.level === 'l2' ? currentStation('l2', bucket.id) : -1;
            var cls = scanned[key] ? (st.seq === cur && st.level === 'l2' ? 'dot-current' : 'dot-scanned') : 'dot-none';
            tbody += '<td><span class="dot ' + cls + '"></span></td>';
          } else {
            var count = 0;
            cabs.forEach(function(c) { if (scanned['l3:' + c.id + ':' + st.slug]) count++; });
            if (count === 0) tbody += '<td><span class="dot dot-none"></span></td>';
            else if (count === cabs.length) tbody += '<td><span class="dot dot-scanned"></span></td>';
            else tbody += '<td style="font-size:0.65rem;color:var(--muted)">' + count + '/' + cabs.length + '</td>';
          }
        });
        tbody += '</tr>';

        cabs.forEach(function(cab) {
          var curSeq = currentStation('l3', cab.id);
          tbody += '<tr class="cab-row hidden" data-parent="' + bucket.id + '"><td>${L3} ' + cab.cabinet_number + (cab.label ? ' — ' + cab.label : '') + '</td>';
          STATIONS.forEach(function(st) {
            var key = st.level === 'l3' ? 'l3:' + cab.id + ':' + st.slug :
                      st.level === 'l2' ? 'l2:' + (cab.bucket_id || 0) + ':' + st.slug :
                      'l1:' + job.id + ':' + st.slug;
            var isCurrent = st.level === 'l3' && st.seq === curSeq;
            var cls = scanned[key] ? (isCurrent ? 'dot-current' : 'dot-scanned') : 'dot-none';
            tbody += '<td><span class="dot ' + cls + '"></span></td>';
          });
          tbody += '</tr>';
        });
      });

      noBucket.forEach(function(cab) {
        var curSeq = currentStation('l3', cab.id);
        tbody += '<tr class="cab-row"><td>${L3} ' + cab.cabinet_number + (cab.label ? ' — ' + cab.label : '') + '</td>';
        STATIONS.forEach(function(st) {
          var key = st.level === 'l3' ? 'l3:' + cab.id + ':' + st.slug : 'l1:' + job.id + ':' + st.slug;
          var isCurrent = st.level === 'l3' && st.seq === curSeq;
          var cls = scanned[key] ? (isCurrent ? 'dot-current' : 'dot-scanned') : 'dot-none';
          tbody += '<td><span class="dot ' + cls + '"></span></td>';
        });
        tbody += '</tr>';
      });

      table.innerHTML = thead + tbody;

      table.querySelectorAll('.bucket-row').forEach(function(row) {
        row.addEventListener('click', function() {
          var bucketId = row.dataset.bucket;
          var expanded = row.classList.toggle('expanded');
          table.querySelectorAll('.cab-row[data-parent="' + bucketId + '"]').forEach(function(r) {
            r.classList.toggle('hidden', !expanded);
          });
        });
      });
    });
  `);
}

// ─── KPI DASHBOARD ──────────────────────────────────────
export function kpiPage(config: TenantConfig): string {
  return page("Assembler KPI", `
    main { flex: 1; padding: 16px; max-width: 900px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .controls select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .controls .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .kpi-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .kpi-card .name { font-size: 1.1rem; font-weight: 700; }
    .kpi-card .rank { font-size: 0.7rem; color: var(--muted); }
    .kpi-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .kpi-stat { text-align: center; }
    .kpi-stat .val { font-size: 1.4rem; font-weight: 700; }
    .kpi-stat .lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
    .kpi-stat .val.accent { color: var(--accent); }
    .kpi-stat .val.success { color: var(--success); }
    .kpi-stat .val.warning { color: var(--warning); }
    .kpi-stat .val.purple { color: var(--purple); }
    .kpi-bar-row { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--muted); }
    .kpi-bar-row .day-label { width: 40px; text-align: right; flex-shrink: 0; }
    .kpi-bar-track { flex: 1; height: 14px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .kpi-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .kpi-bar-fill.blue { background: var(--accent); }
    .kpi-bar-row .count { width: 20px; font-weight: 600; }
    .kpi-timing { font-size: 0.75rem; color: var(--muted); display: flex; justify-content: space-between; }
    .kpi-timing .fast { color: var(--success); }
    .kpi-timing .slow { color: var(--warning); }
    .summary-bar {
      display: flex; gap: 24px; flex-wrap: wrap; padding: 12px 16px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    }
    .summary-stat { text-align: center; }
    .summary-stat .val { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .summary-stat .lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; }
    .empty-state { text-align: center; padding: 48px 16px; color: var(--muted); }
    .station-info { font-size: 0.75rem; color: var(--muted); }
  `, `${NAV_SCAN}${NAV_NEW}${NAV_STATIONS}${NAV_DASH}`, `
  <main>
    <div class="controls">
      <span class="label">Time Range</span>
      <select id="days-select">
        <option value="7">Last 7 days</option>
        <option value="14">Last 14 days</option>
        <option value="30" selected>Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
    </div>
    <div id="station-info" class="station-info"></div>
    <div id="summary" class="summary-bar" style="display:none"></div>
    <div id="kpi-grid" class="kpi-grid"></div>
    <div id="empty" class="empty-state" style="display:none">No assembly data in this time range</div>
  </main>
  `, `
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var daysSelect = document.getElementById('days-select');
    var gridDiv = document.getElementById('kpi-grid');
    var summaryDiv = document.getElementById('summary');
    var emptyDiv = document.getElementById('empty');
    var stationInfo = document.getElementById('station-info');

    function fmtMin(m) {
      if (m == null) return '—';
      if (m < 60) return m + 'm';
      var h = Math.floor(m / 60);
      var rm = Math.round(m % 60);
      return h + 'h ' + rm + 'm';
    }

    function load() {
      var days = daysSelect.value;
      fetch('/api/kpi/assemblers?days=' + days)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var assemblers = data.assemblers || [];
          var daily = data.daily || {};

          stationInfo.textContent = data.start_station && data.end_station
            ? 'Measuring cycle time from ' + data.start_station + ' to ' + data.end_station
            : '';

          if (assemblers.length === 0) {
            gridDiv.innerHTML = '';
            summaryDiv.style.display = 'none';
            emptyDiv.style.display = 'block';
            return;
          }
          emptyDiv.style.display = 'none';

          var totalCompleted = 0;
          var totalStarted = 0;
          var allAvg = [];
          assemblers.forEach(function(a) {
            totalCompleted += a.total_completed;
            totalStarted += a.total_started;
            if (a.avg_minutes != null) allAvg.push(a.avg_minutes);
          });
          var teamAvg = allAvg.length > 0 ? Math.round(allAvg.reduce(function(s,v){return s+v;},0) / allAvg.length * 10) / 10 : null;

          summaryDiv.style.display = 'flex';
          summaryDiv.innerHTML =
            '<div class="summary-stat"><div class="val">' + totalCompleted + '</div><div class="lbl">' + LABELS.l3 + 's Completed</div></div>' +
            '<div class="summary-stat"><div class="val">' + assemblers.length + '</div><div class="lbl">Assemblers</div></div>' +
            '<div class="summary-stat"><div class="val">' + fmtMin(teamAvg) + '</div><div class="lbl">Team Avg Cycle</div></div>' +
            '<div class="summary-stat"><div class="val">' + days + 'd</div><div class="lbl">Time Range</div></div>';

          var maxDaily = 1;
          Object.keys(daily).forEach(function(name) {
            daily[name].forEach(function(d) { if (d.completed > maxDaily) maxDaily = d.completed; });
          });

          gridDiv.innerHTML = assemblers.map(function(a, idx) {
            var days7 = (daily[a.assembler] || []).slice(-7);

            var barsHtml = days7.map(function(d) {
              var pct = Math.round((d.completed / maxDaily) * 100);
              var dayLabel = d.day.slice(5);
              return '<div class="kpi-bar-row">' +
                '<span class="day-label">' + dayLabel + '</span>' +
                '<div class="kpi-bar-track"><div class="kpi-bar-fill blue" style="width:' + pct + '%"></div></div>' +
                '<span class="count">' + d.completed + '</span></div>';
            }).join('');

            return '<div class="kpi-card">' +
              '<div><span class="name">' + a.assembler + '</span> <span class="rank">#' + (idx + 1) + '</span></div>' +
              '<div class="kpi-stats">' +
                '<div class="kpi-stat"><div class="val success">' + a.total_completed + '</div><div class="lbl">Completed</div></div>' +
                '<div class="kpi-stat"><div class="val accent">' + a.per_day + '</div><div class="lbl">Per Day</div></div>' +
                '<div class="kpi-stat"><div class="val purple">' + fmtMin(a.avg_minutes) + '</div><div class="lbl">Avg Cycle</div></div>' +
                '<div class="kpi-stat"><div class="val">' + a.active_days + '</div><div class="lbl">Active Days</div></div>' +
              '</div>' +
              '<div class="kpi-timing">' +
                '<span class="fast">Best: ' + fmtMin(a.min_minutes) + '</span>' +
                '<span class="slow">Slowest: ' + fmtMin(a.max_minutes) + '</span>' +
              '</div>' +
              (barsHtml ? '<div>' + barsHtml + '</div>' : '') +
            '</div>';
          }).join('');
        });
    }

    daysSelect.addEventListener('change', load);
    load();
  `);
}
