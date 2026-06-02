import type { TenantConfig, SessionUser } from "../index";
import { page, SHARED_JS } from "./layout";

export function monitorPage(config: TenantConfig, user: SessionUser): string {
  return page("Monitor", `
    main { padding: 12px 16px; max-width: 900px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .monitor-tabs { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    .monitor-tabs button {
      flex: 1; padding: 10px 8px; font-size: 0.78rem; font-weight: 600; border: none;
      background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .monitor-tabs button.active { background: var(--accent); color: #fff; }
    .feed-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-bottom: 1px solid var(--border); font-size: 0.85rem;
    }
    .feed-row:last-child { border-bottom: none; }
    .feed-time { font-size: 0.7rem; color: var(--muted); white-space: nowrap; min-width: 52px; }
    .feed-station { font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: rgba(59,130,246,0.15); color: var(--accent); white-space: nowrap; }
    .feed-station.event { background: rgba(249,115,22,0.15); color: #f97316; }
    .feed-cab { font-weight: 600; flex: 1; }
    .feed-who { font-size: 0.75rem; color: var(--muted); }
    .job-progress-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
    .job-progress-card h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 10px; }
    .station-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.78rem; }
    .station-bar-label { min-width: 100px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .station-bar-track { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
    .station-bar-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.4s; }
    .station-bar-pct { min-width: 36px; text-align: right; font-size: 0.7rem; color: var(--muted); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; text-align: center; }
    .kpi-card .kpi-val { font-size: 1.8rem; font-weight: 800; color: var(--accent); }
    .kpi-card .kpi-name { font-size: 0.7rem; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .export-btn { padding: 14px 20px; font-size: 0.9rem; font-weight: 700; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text); cursor: pointer; text-align: left; width: 100%; display: flex; align-items: center; gap: 10px; }
    .export-btn:active { background: var(--bg); }
    .export-icon { font-size: 1.3rem; }
    .loading { text-align: center; padding: 40px; color: var(--muted); font-size: 0.85rem; }
    .empty { text-align: center; padding: 40px; color: var(--muted); font-size: 0.85rem; }
  `, `
  <main>
    <div class="card" style="padding: 10px 12px">
      <div class="monitor-tabs" id="monitor-tabs">
        <button class="active" data-tab="feed">Live Feed</button>
        <button data-tab="progress">Job Progress</button>
        <button data-tab="kpi">KPI</button>
        <button data-tab="export">Export</button>
      </div>
    </div>

    <div id="tab-feed">
      <div class="card" style="padding: 0">
        <div id="feed-list"><div class="loading">Loading scan feed…</div></div>
      </div>
    </div>

    <div id="tab-progress" style="display:none">
      <div id="progress-list"><div class="loading">Loading jobs…</div></div>
    </div>

    <div id="tab-kpi" style="display:none">
      <div id="kpi-summary"><div class="loading">Loading KPI…</div></div>
    </div>

    <div id="tab-export" style="display:none">
      <div class="card" style="display:flex;flex-direction:column;gap:10px">
        <button class="export-btn" id="export-scans">
          <span class="export-icon">📋</span>
          <div>
            <div style="font-weight:700">Job Scan Report</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:2px">All jobs with station completion %</div>
          </div>
        </button>
        <button class="export-btn" id="export-assemblers">
          <span class="export-icon">👷</span>
          <div>
            <div style="font-weight:700">Assembler Performance</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:2px">30-day cycle times, counts, quality rates</div>
          </div>
        </button>
        <button class="export-btn" id="export-quality">
          <span class="export-icon">🔧</span>
          <div>
            <div style="font-weight:700">Quality / FixIt Report</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:2px">30-day root causes and resolution times</div>
          </div>
        </button>
      </div>
    </div>
  </main>
  `, `
    ${SHARED_JS}
    var activeTab = 'feed';
    var feedLoaded = false, progressLoaded = false, kpiLoaded = false;
    var feedTimer = null;

    // --- Tabs ---
    var tabs = document.getElementById('monitor-tabs');
    tabs.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      activeTab = btn.dataset.tab;
      tabs.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-feed').style.display = activeTab === 'feed' ? '' : 'none';
      document.getElementById('tab-progress').style.display = activeTab === 'progress' ? '' : 'none';
      document.getElementById('tab-kpi').style.display = activeTab === 'kpi' ? '' : 'none';
      document.getElementById('tab-export').style.display = activeTab === 'export' ? '' : 'none';
      if (activeTab === 'feed') startFeedPolling();
      else stopFeedPolling();
      if (activeTab === 'progress' && !progressLoaded) loadProgress();
      if (activeTab === 'kpi' && !kpiLoaded) loadKPI();
    });

    // --- Live Feed ---
    function startFeedPolling() {
      loadFeed();
      feedTimer = setInterval(loadFeed, 15000);
    }
    function stopFeedPolling() {
      clearInterval(feedTimer); feedTimer = null;
    }

    function loadFeed() {
      fetch('/api/scans/recent?limit=50')
        .then(function(r) { return r.json(); })
        .then(function(scans) {
          feedLoaded = true;
          if (!scans.length) { document.getElementById('feed-list').innerHTML = '<div class="empty">No scans yet</div>'; return; }
          var html = '';
          scans.forEach(function(s) {
            var isEvent = s.station === 'event';
            var stationLabel = isEvent ? (s.note ? s.note.replace(/^\\[action:([^\\]]+)\\].*/, '$1').replace(/_/g, ' ') : 'event') : (s.station || '');
            var cabLabel = s.cabinet_label ? ('#' + s.cabinet_number + ' ' + escHtml(s.cabinet_label)) : (s.cabinet_number ? '#' + s.cabinet_number : '');
            var jobInfo = s.job_number ? escHtml(s.job_number) : '';
            var noteSnippet = '';
            if (s.note && !isEvent) noteSnippet = ' <span style="color:var(--muted);font-size:0.7rem">— ' + escHtml(s.note.substring(0, 40)) + '</span>';
            html += '<div class="feed-row">';
            html += '<span class="feed-time">' + timeAgo(new Date(s.scanned_at + 'Z')) + '</span>';
            html += '<span class="feed-station' + (isEvent ? ' event' : '') + '">' + escHtml(stationLabel) + '</span>';
            html += '<span class="feed-cab">' + cabLabel + (jobInfo ? ' <span style="color:var(--muted)">' + jobInfo + '</span>' : '') + noteSnippet + '</span>';
            html += '<span class="feed-who">' + escHtml(s.scanned_by || '') + '</span>';
            html += '</div>';
          });
          document.getElementById('feed-list').innerHTML = html;
        })
        .catch(function() {
          document.getElementById('feed-list').innerHTML = '<div class="empty">Failed to load scan feed</div>';
        });
    }
    startFeedPolling();

    // --- Job Progress ---
    function loadProgress() {
      progressLoaded = true;
      fetch('/api/jobs?status=active')
        .then(function(r) { return r.json(); })
        .then(function(jobs) {
          if (!jobs.length) { document.getElementById('progress-list').innerHTML = '<div class="empty">No active jobs</div>'; return; }
          var promises = jobs.map(function(j) { return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }); });
          Promise.all(promises).then(function(details) {
            var html = '';
            details.forEach(function(job) {
              var cabs = job.cabinets || [];
              var stationMap = {};
              cabs.forEach(function(c) {
                (job.scans || []).filter(function(s) { return s.cabinet_id === c.id; }).forEach(function(s) {
                  stationMap[s.station] = (stationMap[s.station] || 0) + 1;
                });
              });
              var total = cabs.length;
              html += '<div class="job-progress-card">';
              html += '<h3>' + escHtml(job.job_number) + ' — ' + escHtml(job.job_name) + ' <span style="font-weight:400;color:var(--muted);font-size:0.75rem">(' + total + ' ' + escHtml('${config.entity_labels.l3}s') + ')</span></h3>';
              var stations = ${JSON.stringify(config.stations)}.filter(function(s) { return s.level === 'l3'; });
              stations.forEach(function(s) {
                var count = stationMap[s.slug] || 0;
                var pct = total > 0 ? Math.round((count / total) * 100) : 0;
                html += '<div class="station-bar-row">';
                html += '<span class="station-bar-label">' + escHtml(s.name) + '</span>';
                html += '<div class="station-bar-track"><div class="station-bar-fill" style="width:' + pct + '%"></div></div>';
                html += '<span class="station-bar-pct">' + pct + '%</span>';
                html += '</div>';
              });
              html += '</div>';
            });
            document.getElementById('progress-list').innerHTML = html;
          });
        })
        .catch(function() { document.getElementById('progress-list').innerHTML = '<div class="empty">Failed to load jobs</div>'; });
    }

    // --- KPI Snapshot ---
    function loadKPI() {
      kpiLoaded = true;
      fetch('/api/kpi/assemblers?days=7')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var assemblers = data.assemblers || data || [];
          if (!assemblers.length) { document.getElementById('kpi-summary').innerHTML = '<div class="empty">No KPI data yet</div>'; return; }
          var totalCompleted = 0, totalStarted = 0;
          assemblers.forEach(function(a) { totalCompleted += (a.completed || 0); totalStarted += (a.started || 0); });
          var avgCycle = 0, cycleCount = 0;
          assemblers.forEach(function(a) { if (a.avg_minutes) { avgCycle += a.avg_minutes; cycleCount++; } });
          if (cycleCount) avgCycle = Math.round(avgCycle / cycleCount);

          var html = '<div class="kpi-grid" style="margin-bottom:16px">';
          html += '<div class="kpi-card"><div class="kpi-val">' + totalCompleted + '</div><div class="kpi-name">Completed (7d)</div></div>';
          html += '<div class="kpi-card"><div class="kpi-val">' + totalStarted + '</div><div class="kpi-name">Started (7d)</div></div>';
          html += '<div class="kpi-card"><div class="kpi-val">' + (avgCycle ? avgCycle + 'm' : '—') + '</div><div class="kpi-name">Avg Cycle</div></div>';
          html += '<div class="kpi-card"><div class="kpi-val">' + assemblers.length + '</div><div class="kpi-name">Active Assemblers</div></div>';
          html += '</div>';

          html += '<div class="card" style="padding:0">';
          assemblers.forEach(function(a) {
            html += '<div class="feed-row">';
            html += '<span class="feed-cab" style="font-weight:700">' + escHtml(a.name || 'Unknown') + '</span>';
            html += '<span class="feed-station">' + (a.completed || 0) + ' done</span>';
            html += '<span class="feed-who">' + (a.avg_minutes ? Math.round(a.avg_minutes) + 'm avg' : '—') + '</span>';
            html += '</div>';
          });
          html += '</div>';

          document.getElementById('kpi-summary').innerHTML = html;
        })
        .catch(function() { document.getElementById('kpi-summary').innerHTML = '<div class="empty">Failed to load KPI data</div>'; });
    }

    // --- Export ---
    document.getElementById('export-scans').addEventListener('click', function() {
      window.location.href = '/api/reports/jobs/csv';
    });
    document.getElementById('export-assemblers').addEventListener('click', function() {
      window.location.href = '/api/reports/assemblers/csv?days=30';
    });
    document.getElementById('export-quality').addEventListener('click', function() {
      window.location.href = '/api/reports/quality?days=30';
    });

    window.addEventListener('beforeunload', stopFeedPolling);
  `, user, "/monitor", [], config);
}
