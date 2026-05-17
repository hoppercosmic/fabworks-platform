export const scanPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>FabWorks — Scan</title>
  <style>
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
    header a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.875rem;
    }
    main {
      flex: 1;
      padding: 16px;
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
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
    input[type="text"] {
      width: 100%;
      padding: 12px;
      font-size: 1.125rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      outline: none;
    }
    input[type="text"]:focus { border-color: var(--accent); }
    input[type="text"]::placeholder { color: #475569; }
    .station-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 4px;
    }
    .station-btn {
      padding: 10px 4px;
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--bg);
      border: 2px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .station-btn:active { transform: scale(0.96); }
    .station-btn.selected {
      border-color: var(--accent);
      background: rgba(59, 130, 246, 0.15);
      color: var(--accent);
    }
    .scan-btn {
      width: 100%;
      padding: 16px;
      font-size: 1.25rem;
      font-weight: 700;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .scan-btn:active { transform: scale(0.98); }
    .scan-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .camera-btn {
      padding: 10px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      cursor: pointer;
      margin-top: 8px;
      width: 100%;
    }
    #camera-box {
      display: none;
      margin-top: 8px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    #camera-box video {
      width: 100%;
      border-radius: 8px;
    }
    #camera-box canvas { display: none; }
    .result {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      display: none;
    }
    .result.success {
      display: block;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid var(--success);
      color: var(--success);
    }
    .result.error {
      display: block;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--error);
      color: var(--error);
    }
    .result .detail {
      font-weight: 400;
      font-size: 0.875rem;
      margin-top: 4px;
      color: var(--muted);
    }
    .scanned-by-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .scanned-by-row input { flex: 1; }
    .remember-label {
      font-size: 0.75rem;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <header>
    <h1>FabWorks</h1>
    <nav>
      <a href="/jobs/new">+ Job</a>
      <a href="/dashboard">Dashboard</a>
    </nav>
  </header>

  <main>
    <div class="card">
      <label>Job Number</label>
      <input type="text" id="job-input" placeholder="3480" inputmode="numeric" autocomplete="off">
      <button class="camera-btn" id="camera-toggle">Scan Barcode</button>
      <div id="camera-box">
        <video id="camera-feed" playsinline></video>
        <canvas id="camera-canvas"></canvas>
      </div>
    </div>

    <div class="card">
      <label>Station</label>
      <div class="station-grid" id="station-grid"></div>
    </div>

    <div class="card">
      <label>Scanned By</label>
      <div class="scanned-by-row">
        <input type="text" id="scanned-by" placeholder="Name">
        <label class="remember-label">
          <input type="checkbox" id="remember-name" checked> Save
        </label>
      </div>
    </div>

    <button class="scan-btn" id="scan-btn" disabled>Log Scan</button>

    <div class="result" id="result"></div>
  </main>

  <script>
    const jobInput = document.getElementById('job-input');
    const stationGrid = document.getElementById('station-grid');
    const scanBtn = document.getElementById('scan-btn');
    const resultDiv = document.getElementById('result');
    const scannedByInput = document.getElementById('scanned-by');
    const rememberCheck = document.getElementById('remember-name');
    const cameraToggle = document.getElementById('camera-toggle');
    const cameraBox = document.getElementById('camera-box');
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');

    let selectedStation = null;
    let stations = [];
    let cameraStream = null;
    let scanInterval = null;

    const saved = localStorage.getItem('fabworks_name');
    if (saved) scannedByInput.value = saved;

    const savedStation = localStorage.getItem('fabworks_station');

    fetch('/api/stations')
      .then(r => r.json())
      .then(data => {
        stations = data;
        stations.forEach(s => {
          const btn = document.createElement('button');
          btn.className = 'station-btn';
          btn.textContent = s.name;
          btn.dataset.slug = s.slug;
          btn.addEventListener('click', () => selectStation(s.slug));
          stationGrid.appendChild(btn);
        });
        if (savedStation) selectStation(savedStation);
      });

    function selectStation(slug) {
      selectedStation = slug;
      localStorage.setItem('fabworks_station', slug);
      document.querySelectorAll('.station-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.slug === slug);
      });
      updateBtn();
    }

    function updateBtn() {
      scanBtn.disabled = !(jobInput.value.trim() && selectedStation);
    }

    jobInput.addEventListener('input', updateBtn);

    scanBtn.addEventListener('click', async () => {
      scanBtn.disabled = true;
      scanBtn.textContent = 'Logging...';
      resultDiv.className = 'result';
      resultDiv.style.display = 'none';

      if (rememberCheck.checked) {
        localStorage.setItem('fabworks_name', scannedByInput.value);
      }

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_number: jobInput.value.trim(),
            station: selectedStation,
            scanned_by: scannedByInput.value.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = data.job_name +
            '<div class="detail">' + data.station + ' — ' + data.scanned_by + '</div>';
          jobInput.value = '';
          jobInput.focus();
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = data.error;
        }
      } catch (e) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = 'Network error';
      }
      scanBtn.textContent = 'Log Scan';
      updateBtn();
    });

    // Barcode scanning via camera + BarcodeDetector API
    cameraToggle.addEventListener('click', async () => {
      if (cameraStream) {
        stopCamera();
        return;
      }
      if (!('BarcodeDetector' in window)) {
        cameraToggle.textContent = 'Camera scanning not supported';
        setTimeout(() => { cameraToggle.textContent = 'Scan Barcode'; }, 2000);
        return;
      }
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        video.srcObject = cameraStream;
        video.play();
        cameraBox.style.display = 'block';
        cameraToggle.textContent = 'Stop Camera';

        const detector = new BarcodeDetector();
        scanInterval = setInterval(async () => {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              // Extract digits from barcode (job number)
              const digits = value.replace(/[^0-9]/g, '');
              if (digits) {
                jobInput.value = digits;
                updateBtn();
                stopCamera();
              }
            }
          } catch {}
        }, 300);
      } catch (e) {
        cameraToggle.textContent = 'Camera access denied';
        setTimeout(() => { cameraToggle.textContent = 'Scan Barcode'; }, 2000);
      }
    });

    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
      }
      if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
      }
      cameraBox.style.display = 'none';
      cameraToggle.textContent = 'Scan Barcode';
    }
  </script>
</body>
</html>`;

export const dashboardPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FabWorks — Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --border: #334155;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #3b82f6;
      --success: #22c55e;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100dvh;
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
    header a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.875rem;
    }
    main {
      padding: 16px;
      max-width: 960px;
      margin: 0 auto;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .two-col { grid-template-columns: 1fr; }
    }
    .feed-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .feed-panel h3 {
      font-size: 0.8rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .feed-item {
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.8rem;
    }
    .feed-item:last-child { border-bottom: none; }
    .feed-job { font-weight: 600; color: var(--text); }
    .feed-station { color: var(--accent); }
    .feed-meta { color: var(--muted); font-size: 0.7rem; margin-top: 2px; }
    .refresh-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .refresh-row span { font-size: 0.8rem; color: var(--muted); }
    .refresh-btn {
      padding: 6px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      cursor: pointer;
    }
    .job-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;
    }
    .job-header h2 { font-size: 1.1rem; }
    .job-header .routing {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(59, 130, 246, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .pipeline {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .stage {
      flex: 1;
      min-width: 0;
      text-align: center;
      padding: 8px 2px;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 600;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stage.reached {
      background: rgba(34, 197, 94, 0.15);
      border-color: var(--success);
      color: var(--success);
    }
    .stage.current {
      background: rgba(59, 130, 246, 0.2);
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent);
    }
    .last-scan {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 8px;
    }
    .empty {
      text-align: center;
      padding: 48px 16px;
      color: var(--muted);
    }
    .auto-label { font-size: 0.7rem; color: var(--muted); margin-left: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>FabWorks Dashboard</h1>
    <nav>
      <a href="/">Scan</a>
      <a href="/jobs/new">+ Job</a>
    </nav>
  </header>

  <main>
    <div class="refresh-row">
      <span id="updated"></span>
      <div>
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

  <script>
    const jobsDiv = document.getElementById('jobs');
    const feedDiv = document.getElementById('feed');
    const updatedSpan = document.getElementById('updated');
    const refreshBtn = document.getElementById('refresh-btn');
    const autoCheck = document.getElementById('auto-refresh');
    let stations = [];
    let autoTimer = null;

    function timeAgo(date) {
      const s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    async function load() {
      const [stRes, jRes, feedRes] = await Promise.all([
        fetch('/api/stations').then(r => r.json()),
        fetch('/api/jobs?status=active').then(r => r.json()),
        fetch('/api/scans/recent?limit=20').then(r => r.json()),
      ]);
      stations = stRes;

      feedDiv.innerHTML = feedRes.length === 0
        ? '<div style="color:var(--muted);font-size:0.8rem">No scans yet</div>'
        : feedRes.map(s => {
          const t = new Date(s.scanned_at + 'Z');
          const ago = timeAgo(t);
          return '<div class="feed-item">' +
            '<span class="feed-job">' + s.job_number + '</span> ' +
            '<span class="feed-station">' + s.station_name + '</span>' +
            '<div class="feed-meta">' + (s.scanned_by || '?') + ' — ' + ago + '</div>' +
          '</div>';
        }).join('');

      if (jRes.length === 0) {
        jobsDiv.innerHTML = '<div class="empty">No active jobs. <a href="/jobs/new" style="color:var(--accent)">Create one</a></div>';
        updatedSpan.textContent = 'Updated ' + new Date().toLocaleTimeString();
        return;
      }

      const details = await Promise.all(
        jRes.map(j => fetch('/api/jobs/' + j.id).then(r => r.json()))
      );

      jobsDiv.innerHTML = details.map(job => {
        const scannedSlugs = new Set(job.scans.map(s => s.station));
        const lastScan = job.scans[job.scans.length - 1];
        const lastSlug = lastScan ? lastScan.station : null;

        const pipeline = stations.map(st => {
          const reached = scannedSlugs.has(st.slug);
          const isCurrent = st.slug === lastSlug;
          const cls = isCurrent ? 'stage current' : reached ? 'stage reached' : 'stage';
          return '<div class="' + cls + '">' + st.name + '</div>';
        }).join('');

        const lastInfo = lastScan
          ? 'Last: ' + lastScan.station_name + ' by ' + (lastScan.scanned_by || '?') +
            ' at ' + new Date(lastScan.scanned_at + 'Z').toLocaleString()
          : 'No scans yet';

        return '<div class="job-card">' +
          '<div class="job-header">' +
            '<h2>' + job.job_number + ' ' + job.job_name + '</h2>' +
            '<span class="routing">' + job.routing + '</span>' +
          '</div>' +
          '<div class="pipeline">' + pipeline + '</div>' +
          '<div class="last-scan">' + lastInfo + '</div>' +
        '</div>';
      }).join('');

      updatedSpan.textContent = 'Updated ' + new Date().toLocaleTimeString();
    }

    function startAuto() {
      stopAuto();
      if (autoCheck.checked) {
        autoTimer = setInterval(load, 30000);
      }
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    autoCheck.addEventListener('change', startAuto);
    refreshBtn.addEventListener('click', load);
    load();
    startAuto();
  </script>
</body>
</html>`;

export const newJobPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>FabWorks — New Job</title>
  <style>
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
    main {
      flex: 1;
      padding: 16px;
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
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
    input[type="text"] {
      width: 100%;
      padding: 12px;
      font-size: 1.125rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      outline: none;
    }
    input[type="text"]:focus { border-color: var(--accent); }
    input[type="text"]::placeholder { color: #475569; }
    .routing-options {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .routing-btn {
      flex: 1;
      padding: 10px 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--bg);
      border: 2px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }
    .routing-btn:active { transform: scale(0.96); }
    .routing-btn.selected {
      border-color: var(--accent);
      background: rgba(59, 130, 246, 0.15);
      color: var(--accent);
    }
    .submit-btn {
      width: 100%;
      padding: 16px;
      font-size: 1.25rem;
      font-weight: 700;
      background: var(--success);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .submit-btn:active { transform: scale(0.98); }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .result {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      display: none;
    }
    .result.success {
      display: block;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid var(--success);
      color: var(--success);
    }
    .result.error {
      display: block;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--error);
      color: var(--error);
    }
    .result .detail {
      font-weight: 400;
      font-size: 0.875rem;
      margin-top: 4px;
      color: var(--muted);
    }
    .result a {
      color: var(--accent);
      text-decoration: none;
      font-size: 0.875rem;
    }
    .recent-jobs {
      margin-top: 8px;
    }
    .recent-jobs h3 {
      font-size: 0.75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .recent-job {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.85rem;
    }
    .recent-job:last-child { border-bottom: none; }
    .recent-job .num { font-weight: 600; }
    .recent-job .routing-tag {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(59, 130, 246, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>
    <h1>New Job</h1>
    <nav>
      <a href="/">Scan</a>
      <a href="/dashboard">Dashboard</a>
    </nav>
  </header>

  <main>
    <div class="card">
      <label>Job Number</label>
      <input type="text" id="job-number" placeholder="3480" inputmode="numeric" autocomplete="off">
    </div>

    <div class="card">
      <label>Job Name</label>
      <input type="text" id="job-name" placeholder="Muirfield Lot 10" autocomplete="off">
    </div>

    <div class="card">
      <label>Routing</label>
      <div class="routing-options">
        <button class="routing-btn selected" data-route="standard">Standard</button>
        <button class="routing-btn" data-route="custom_then_finish">Custom + Finish</button>
        <button class="routing-btn" data-route="finish_only">Finish Only</button>
      </div>
    </div>

    <button class="submit-btn" id="submit-btn" disabled>Create Job</button>

    <div class="result" id="result"></div>

    <div class="card recent-jobs">
      <h3>Recent Jobs</h3>
      <div id="recent-list"></div>
    </div>
  </main>

  <script>
    const numInput = document.getElementById('job-number');
    const nameInput = document.getElementById('job-name');
    const submitBtn = document.getElementById('submit-btn');
    const resultDiv = document.getElementById('result');
    const recentList = document.getElementById('recent-list');
    let selectedRouting = 'standard';

    document.querySelectorAll('.routing-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRouting = btn.dataset.route;
        document.querySelectorAll('.routing-btn').forEach(b =>
          b.classList.toggle('selected', b.dataset.route === selectedRouting));
      });
    });

    function updateBtn() {
      submitBtn.disabled = !(numInput.value.trim() && nameInput.value.trim());
    }
    numInput.addEventListener('input', updateBtn);
    nameInput.addEventListener('input', updateBtn);

    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      resultDiv.className = 'result';
      resultDiv.style.display = 'none';

      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_number: numInput.value.trim(),
            job_name: nameInput.value.trim(),
            routing: selectedRouting,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = 'Created: ' + data.job_number + ' ' + data.job_name +
            '<div class="detail">' + data.routing +
            '</div><a href="/">Go scan it &rarr;</a>';
          numInput.value = '';
          nameInput.value = '';
          numInput.focus();
          updateBtn();
          loadRecent();
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = data.error;
        }
      } catch (e) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = 'Network error';
      }
      submitBtn.textContent = 'Create Job';
      updateBtn();
    });

    async function loadRecent() {
      const jobs = await fetch('/api/jobs?status=active').then(r => r.json());
      if (jobs.length === 0) {
        recentList.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">No jobs yet</div>';
        return;
      }
      recentList.innerHTML = jobs.slice(0, 10).map(j =>
        '<div class="recent-job">' +
          '<span class="num">' + j.job_number + ' ' + j.job_name + '</span>' +
          '<span class="routing-tag">' + j.routing + '</span>' +
        '</div>'
      ).join('');
    }
    loadRecent();
  </script>
</body>
</html>`;
