import type { TenantConfig, SessionUser, UserRole } from "../index";
import { page, SHARED_JS } from "./layout";

export function qrPage(config: TenantConfig, user: SessionUser): string {
  const isAdmin = (["admin"] as UserRole[]).includes(user.role);
  return page("QR Codes", `
    main { flex: 1; padding: 10px 16px 16px; max-width: 600px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .qr-tabs { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    .qr-tabs button {
      flex: 1; padding: 10px 12px; font-size: 0.8rem; font-weight: 600; border: none;
      background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.2s;
    }
    .qr-tabs button.active { background: var(--accent); color: #fff; }
    .job-select { width: 100%; padding: 12px; font-size: 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); }
    .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .qr-card {
      background: white; color: #111; border-radius: 8px; padding: 10px;
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px;
      cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
    }
    .qr-card:active { transform: scale(0.97); }
    .qr-card canvas, .qr-card img { display: block; width: 110px; height: 110px; }
    .qr-card .qr-title { font-weight: 700; font-size: 0.75rem; word-break: break-word; }
    .qr-card .qr-sub { font-size: 0.65rem; color: #666; }
    .qr-section { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-top: 4px; }
    .qr-actions { display: flex; gap: 8px; }
    .qr-actions .btn { flex: 1; }
    .qr-spotlight {
      position: fixed; inset: 0; background: white; z-index: 250;
      display: none; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; padding: 20px;
    }
    .qr-spotlight.active { display: flex; }
    .qr-spotlight canvas, .qr-spotlight img { width: min(80vw, 300px); height: min(80vw, 300px); }
    .qr-spotlight .spot-title { font-size: 1.4rem; font-weight: 700; color: #111; margin-top: 16px; }
    .qr-spotlight .spot-sub { font-size: 0.9rem; color: #666; margin-top: 4px; }
    .qr-spotlight .spot-hint { font-size: 0.75rem; color: #999; margin-top: 24px; }
    .qr-empty { text-align: center; padding: 48px 16px; color: var(--muted); }
    @media print {
      .top-bar, .qr-tabs, .qr-actions, .qr-fab, .job-select-row, .qr-spotlight, #fab-spotlight { display: none !important; }
      body { padding-top: 0 !important; background: white !important; color: #111 !important; }
      main { padding: 8px !important; max-width: none !important; }
      .qr-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .qr-card { border: 1px solid #ccc; break-inside: avoid; }
      .qr-section { color: #333; }
      .card { background: none !important; border: none !important; padding: 0 !important; }
    }
  `, `
  <main>
    ${isAdmin ? `<div class="card">
      <div class="qr-tabs" id="qr-tabs">
        <button data-tab="stations">Stations</button>
        <button class="active" data-tab="job">Job Labels</button>
        <button data-tab="system">System</button>
      </div>
    </div>
    <div id="tab-stations" style="display:none">
      <div class="qr-grid" id="station-grid"></div>
    </div>` : ''}
    <div id="tab-job">
      <div class="card job-select-row">
        <label>Select Job</label>
        <select class="job-select" id="job-select"><option value="">— Choose a job —</option></select>
      </div>
      <div id="job-qr-content"></div>
    </div>
    ${isAdmin ? `<div id="tab-system" style="display:none">
      <div class="qr-section">System Commands</div>
      <div class="qr-grid" id="system-grid"></div>
      <div class="qr-section" style="margin-top:12px">All Stations</div>
      <div class="qr-grid" id="system-stations-grid"></div>
    </div>` : ''}
    <div class="qr-actions">
      <button class="btn btn-primary" id="print-btn" style="font-size:1rem;padding:12px">Print</button>
    </div>
    <div class="qr-spotlight" id="spotlight">
      <img id="spot-canvas" alt="QR Code" />
      <div class="spot-title" id="spot-title"></div>
      <div class="spot-sub" id="spot-sub"></div>
      <div class="spot-hint">Tap anywhere to close</div>
    </div>
  </main>
  `, `
    ${SHARED_JS}
    var IS_ADMIN = ${isAdmin};
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var activeTab = 'job';

    // --- Tabs (admin only) ---
    var tabs = document.getElementById('qr-tabs');
    var tabStations = document.getElementById('tab-stations');
    var tabJob = document.getElementById('tab-job');
    var tabSystem = document.getElementById('tab-system');
    if (tabs) {
      tabs.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        activeTab = btn.dataset.tab;
        tabs.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (tabStations) tabStations.style.display = activeTab === 'stations' ? '' : 'none';
        tabJob.style.display = activeTab === 'job' ? '' : 'none';
        if (tabSystem) tabSystem.style.display = activeTab === 'system' ? '' : 'none';
        if (activeTab === 'system' && !systemRendered) renderSystem();
      });
    }

    // --- Spotlight (full-screen QR for device-to-device scanning) ---
    var spotlight = document.getElementById('spotlight');
    var spotCanvas = document.getElementById('spot-canvas');
    var spotTitle = document.getElementById('spot-title');
    var spotSub = document.getElementById('spot-sub');

    function showSpotlight(code, title, sub) {
      QRCode.toDataURL(code, { width: 600, margin: 2 }, function(err, url) {
        spotCanvas.src = url;
        spotTitle.textContent = title;
        spotSub.textContent = sub || '';
        spotlight.classList.add('active');
      });
    }
    spotlight.addEventListener('click', function() { spotlight.classList.remove('active'); });

    // --- Station QR grid ---
    function makeQRImg(code, size, cb) {
      QRCode.toDataURL(code, { width: size, margin: 1 }, function(err, url) {
        var img = document.createElement('img');
        img.src = url;
        img.width = size;
        img.height = size;
        if (cb) cb(img);
      });
    }

    function renderStations() {
      var grid = document.getElementById('station-grid');
      if (!grid) return;
      grid.innerHTML = '';
      STATIONS.forEach(function(s) {
        var card = document.createElement('div');
        card.className = 'qr-card';
        var code = 'fw:sta:' + s.slug;
        makeQRImg(code, 220, function(img) { card.insertBefore(img, card.firstChild); });
        var t = document.createElement('div');
        t.className = 'qr-title';
        t.textContent = s.name;
        card.appendChild(t);
        var sub = document.createElement('div');
        sub.className = 'qr-sub';
        sub.textContent = s.level.toUpperCase() + ' — ' + s.slug;
        card.appendChild(sub);
        card.addEventListener('click', function() { showSpotlight(code, s.name, s.level.toUpperCase() + ' Station'); });
        grid.appendChild(card);
      });
    }
    if (IS_ADMIN) renderStations();

    // --- Job selector ---
    var jobSelect = document.getElementById('job-select');
    var jobContent = document.getElementById('job-qr-content');

    fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
      jobs.forEach(function(j) {
        var opt = document.createElement('option');
        opt.value = j.id;
        opt.textContent = j.job_number + ' — ' + j.job_name;
        jobSelect.appendChild(opt);
      });
    });

    jobSelect.addEventListener('change', function() {
      var id = jobSelect.value;
      if (!id) { jobContent.innerHTML = ''; return; }
      fetch('/api/jobs/' + id).then(function(r) { return r.json(); }).then(function(job) {
        renderJobQR(job);
      });
    });

    function renderJobQR(job) {
      var html = '<div class="qr-section" style="margin-top:8px">' + LABELS.l1 + '</div><div class="qr-grid">';
      html += '<div class="qr-card" data-code="fw:l1:' + job.id + ':' + job.job_number + '" data-title="' + escHtml(job.job_number + ' ' + job.job_name) + '" data-sub="' + LABELS.l1 + '">';
      html += '<img id="qr-job-' + job.id + '" width="220" height="220" alt="QR" />';
      html += '<div class="qr-title">' + escHtml(job.job_number + ' ' + job.job_name) + '</div>';
      html += '<div class="qr-sub">' + LABELS.l1 + '</div></div></div>';

      if (job.buckets.length) {
        html += '<div class="qr-section">' + LABELS.l2 + 's</div><div class="qr-grid">';
        job.buckets.forEach(function(b) {
          html += '<div class="qr-card" data-code="fw:l2:' + b.id + ':' + b.name + '" data-title="' + escHtml(b.name) + '" data-sub="' + LABELS.l2 + ' — ' + job.job_number + '">';
          html += '<img id="qr-bucket-' + b.id + '" width="220" height="220" alt="QR" />';
          html += '<div class="qr-title">' + escHtml(b.name) + '</div>';
          html += '<div class="qr-sub">' + LABELS.l2 + ' — ' + job.job_number + '</div></div>';
        });
        html += '</div>';
      }

      if (job.cabinets.length) {
        html += '<div class="qr-section">' + LABELS.l3 + 's (' + job.cabinets.length + ')</div><div class="qr-grid">';
        job.cabinets.forEach(function(c) {
          var label = c.label || (LABELS.l3 + ' ' + c.cabinet_number);
          html += '<div class="qr-card" data-code="fw:l3:' + c.id + ':' + label + '" data-title="' + escHtml(label) + '" data-sub="' + LABELS.l3 + ' #' + c.cabinet_number + ' — ' + job.job_number + '">';
          html += '<img id="qr-cab-' + c.id + '" width="220" height="220" alt="QR" />';
          html += '<div class="qr-title">#' + c.cabinet_number + '</div>';
          html += '<div class="qr-sub">' + escHtml(label) + '</div></div>';
        });
        html += '</div>';
      }

      jobContent.innerHTML = html;

      // Render QR images
      QRCode.toDataURL('fw:l1:' + job.id + ':' + job.job_number, { width: 220, margin: 1 }, function(e, u) { document.getElementById('qr-job-' + job.id).src = u; });
      job.buckets.forEach(function(b) {
        QRCode.toDataURL('fw:l2:' + b.id + ':' + b.name, { width: 220, margin: 1 }, function(e, u) { document.getElementById('qr-bucket-' + b.id).src = u; });
      });
      job.cabinets.forEach(function(c) {
        var label = c.label || (LABELS.l3 + ' ' + c.cabinet_number);
        QRCode.toDataURL('fw:l3:' + c.id + ':' + label, { width: 220, margin: 1 }, function(e, u) { document.getElementById('qr-cab-' + c.id).src = u; });
      });

      // Click-to-spotlight
      jobContent.querySelectorAll('.qr-card').forEach(function(card) {
        card.addEventListener('click', function() {
          showSpotlight(card.dataset.code, card.dataset.title, card.dataset.sub);
        });
      });
    }

    // --- System tab ---
    var systemRendered = false;
    var SYSTEM_CODES = [
      { code: 'fw:cmd:ask', title: 'Ask System', sub: 'Prompt a question to the system' },
      { code: 'fw:cmd:status', title: 'Status Check', sub: 'Show current system status' },
      { code: 'fw:cmd:whoami', title: 'Who Am I', sub: 'Show current user info' },
      { code: 'fw:cmd:clock-in', title: 'Clock In', sub: 'Start shift / log arrival' },
      { code: 'fw:cmd:clock-out', title: 'Clock Out', sub: 'End shift / log departure' },
      { code: 'fw:cmd:break', title: 'Break', sub: 'Start / end break' },
    ];

    function renderSystem() {
      systemRendered = true;
      var sysGrid = document.getElementById('system-grid');
      sysGrid.innerHTML = '';
      SYSTEM_CODES.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'qr-card';
        makeQRImg(item.code, 220, function(img) { card.insertBefore(img, card.firstChild); });
        var t = document.createElement('div');
        t.className = 'qr-title';
        t.textContent = item.title;
        card.appendChild(t);
        var sub = document.createElement('div');
        sub.className = 'qr-sub';
        sub.textContent = item.sub;
        card.appendChild(sub);
        card.addEventListener('click', function() { showSpotlight(item.code, item.title, item.sub); });
        sysGrid.appendChild(card);
      });

      var staGrid = document.getElementById('system-stations-grid');
      staGrid.innerHTML = '';
      STATIONS.forEach(function(s) {
        var card = document.createElement('div');
        card.className = 'qr-card';
        var code = 'fw:sta:' + s.slug;
        makeQRImg(code, 220, function(img) { card.insertBefore(img, card.firstChild); });
        var t = document.createElement('div');
        t.className = 'qr-title';
        t.textContent = s.name;
        card.appendChild(t);
        var sub = document.createElement('div');
        sub.className = 'qr-sub';
        sub.textContent = s.level.toUpperCase() + ' — ' + s.slug;
        card.appendChild(sub);
        card.addEventListener('click', function() { showSpotlight(code, s.name, s.level.toUpperCase() + ' Station'); });
        staGrid.appendChild(card);
      });
    }

    // --- Print ---
    document.getElementById('print-btn').addEventListener('click', function() {
      window.print();
    });
`, user, "/qr", ["https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"], config);
}

