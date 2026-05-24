import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS } from "./layout";

export function dashboardPage(config: TenantConfig, user: SessionUser): string {
  return page("Dashboard", `
    main { padding: 16px; width: 100%; margin: 0 auto; }
    .dash-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .dash-bar span { font-size: 0.8rem; color: var(--muted); }
    .dash-bar-right { display: flex; align-items: center; gap: 10px; }
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
    .feed-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; overflow-y: auto; }
    .feed-panel h3 { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .feed-item { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
    .feed-item:last-child { border-bottom: none; }
    .feed-job { font-weight: 600; color: var(--text); }
    .feed-station { color: var(--accent); }
    .feed-detail { color: var(--muted); font-size: 0.7rem; }
    .feed-meta { color: var(--muted); font-size: 0.7rem; margin-top: 2px; }
    .empty { text-align: center; padding: 48px 16px; color: var(--muted); }
    .empty a { color: var(--accent); text-decoration: none; }
`, `
  <main>
    <div class="dash-bar">
      <span id="updated"></span>
      <div class="dash-bar-right">
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
`, user, "/dashboard", [], config);
}

