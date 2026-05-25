import type { TenantConfig, SessionUser } from "../index";
import { page, SHARED_JS } from "./layout";

export function reportsPage(config: TenantConfig, user: SessionUser): string {
  return page("Reports", `
    main { gap: 14px; }
    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 14px; }
    .tab-btn {
      padding: 10px 18px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      background: none; border: none; color: var(--muted); border-bottom: 2px solid transparent;
      margin-bottom: -2px; transition: color 0.2s, border-color 0.2s;
    }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
    .controls select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .controls .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-csv {
      padding: 8px 16px; font-size: 0.8rem; font-weight: 600; border-radius: 6px;
      background: var(--surface); border: 1px solid var(--border); color: var(--text);
      cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-csv:hover { background: var(--bg); border-color: var(--accent); }
    .btn-csv svg { width: 16px; height: 16px; }

    .report-table {
      width: 100%; border-collapse: collapse; font-size: 0.8rem;
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
    }
    .report-table th {
      text-align: left; padding: 10px 12px; font-size: 0.7rem; text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--muted); background: var(--bg); border-bottom: 1px solid var(--border);
    }
    .report-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .report-table tr:last-child td { border-bottom: none; }
    .report-table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .report-table .pct { font-weight: 700; }
    .report-table .pct.high { color: var(--success); }
    .report-table .pct.mid { color: var(--warning); }
    .report-table .pct.low { color: var(--error); }

    .summary-bar {
      display: flex; gap: 24px; flex-wrap: wrap; padding: 12px 16px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 14px;
    }
    .summary-stat { text-align: center; }
    .summary-stat .val { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .summary-stat .lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; }

    .cause-pill {
      display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;
    }
    .cause-pill.cnc_error { background: rgba(59,130,246,0.15); color: var(--accent); }
    .cause-pill.material_defect { background: rgba(245,158,11,0.15); color: var(--warning); }
    .cause-pill.transit_damage { background: rgba(168,85,247,0.15); color: var(--purple); }
    .cause-pill.other { background: rgba(148,163,184,0.15); color: var(--muted); }

    .empty-state { text-align: center; padding: 48px 16px; color: var(--muted); }

    .status-pill {
      display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 600;
    }
    .status-pill.active { background: rgba(59,130,246,0.15); color: var(--accent); }
    .status-pill.complete { background: rgba(34,197,94,0.15); color: var(--success); }

    @media (max-width: 600px) {
      .tabs { overflow-x: auto; }
      .tab-btn { padding: 8px 12px; font-size: 0.78rem; white-space: nowrap; }
      .report-table { font-size: 0.72rem; }
      .report-table th, .report-table td { padding: 8px 8px; }
      .summary-bar { gap: 12px; padding: 10px 12px; }
      .summary-stat .val { font-size: 1.2rem; }
    }
  `, `
  <main>
    <div class="tabs">
      <button class="tab-btn active" data-tab="jobs">Job Completion</button>
      <button class="tab-btn" data-tab="assemblers">Assembler Productivity</button>
      <button class="tab-btn" data-tab="quality">Quality / FixIt</button>
    </div>

    <div id="tab-jobs" class="tab-content active"></div>
    <div id="tab-assemblers" class="tab-content"></div>
    <div id="tab-quality" class="tab-content"></div>
  </main>
  `, `
    ${SHARED_JS}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var CSV_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

    var tabs = document.querySelectorAll('.tab-btn');
    var loaded = {};

    tabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        tabs.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
        var tab = btn.getAttribute('data-tab');
        document.getElementById('tab-' + tab).classList.add('active');
        if (!loaded[tab]) loadTab(tab);
      });
    });

    function loadTab(tab) {
      loaded[tab] = true;
      if (tab === 'jobs') loadJobs();
      else if (tab === 'assemblers') loadAssemblers(30);
      else if (tab === 'quality') loadQuality(30);
    }

    function daysControl(tab, current) {
      return '<div class="controls">' +
        '<span class="label">Time Range</span>' +
        '<select onchange="load' + tab.charAt(0).toUpperCase() + tab.slice(1) + '(this.value)">' +
        [7,14,30,90].map(function(d) {
          return '<option value="' + d + '"' + (d === current ? ' selected' : '') + '>Last ' + d + ' days</option>';
        }).join('') +
        '</select>' +
        '<a class="btn-csv" href="/api/reports/' + tab + '/csv?days=' + current + '" target="_blank">' + CSV_ICON + ' CSV</a>' +
        '</div>';
    }

    function pctClass(pct) {
      if (pct >= 90) return 'high';
      if (pct >= 50) return 'mid';
      return 'low';
    }

    function causeName(cause) {
      var names = { cnc_error: 'CNC Error', material_defect: 'Material Defect', transit_damage: 'Transit Damage', other: 'Other' };
      return names[cause] || cause;
    }

    // --- Jobs tab ---
    function loadJobs() {
      var el = document.getElementById('tab-jobs');
      el.innerHTML = '<div class="empty-state">Loading...</div>';
      fetch('/api/reports/jobs').then(function(r) { return r.json(); }).then(function(jobs) {
        if (jobs.length === 0) { el.innerHTML = '<div class="empty-state">No jobs found</div>'; return; }

        var activeJobs = jobs.filter(function(j) { return j.status === 'active'; });
        var totalCabs = activeJobs.reduce(function(s, j) { return s + (j.actual_cabinets || j.cabinet_count || 0); }, 0);
        var totalDone = activeJobs.reduce(function(s, j) { return s + (j.completed_count || 0); }, 0);
        var overallPct = totalCabs > 0 ? Math.round(totalDone / totalCabs * 1000) / 10 : 0;

        var html = '<div class="controls"><a class="btn-csv" href="/api/reports/jobs/csv" target="_blank">' + CSV_ICON + ' Download CSV</a></div>';
        html += '<div class="summary-bar">' +
          '<div class="summary-stat"><div class="val">' + activeJobs.length + '</div><div class="lbl">Active Jobs</div></div>' +
          '<div class="summary-stat"><div class="val">' + totalCabs + '</div><div class="lbl">Total ' + LABELS.l3 + 's</div></div>' +
          '<div class="summary-stat"><div class="val">' + totalDone + '</div><div class="lbl">Completed</div></div>' +
          '<div class="summary-stat"><div class="val ' + pctClass(overallPct) + '">' + overallPct + '%</div><div class="lbl">Overall</div></div>' +
          '</div>';

        html += '<table class="report-table"><thead><tr>' +
          '<th>Job</th><th>Name</th><th>Status</th><th class="num">Total</th><th class="num">Done</th><th class="num">%</th><th class="num">Remaining</th>' +
          '</tr></thead><tbody>';

        jobs.forEach(function(j) {
          var total = j.actual_cabinets || j.cabinet_count || 0;
          html += '<tr>' +
            '<td><a href="/job/' + j.id + '" style="color:var(--accent);text-decoration:none;font-weight:600">' + escHtml(j.job_number) + '</a></td>' +
            '<td>' + escHtml(j.job_name) + '</td>' +
            '<td><span class="status-pill ' + j.status + '">' + j.status + '</span></td>' +
            '<td class="num">' + total + '</td>' +
            '<td class="num">' + (j.completed_count || 0) + '</td>' +
            '<td class="num pct ' + pctClass(j.pct_complete) + '">' + j.pct_complete + '%</td>' +
            '<td class="num">' + j.remaining + '</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        el.innerHTML = html;
      });
    }

    // --- Assemblers tab ---
    function loadAssemblers(days) {
      var el = document.getElementById('tab-assemblers');
      el.innerHTML = '<div class="empty-state">Loading...</div>';
      fetch('/api/kpi/assemblers?days=' + days).then(function(r) { return r.json(); }).then(function(data) {
        var assemblers = data.assemblers || [];
        if (assemblers.length === 0) {
          el.innerHTML = daysControl('assemblers', days) + '<div class="empty-state">No data in this range</div>';
          return;
        }

        var html = daysControl('assemblers', days);
        html += '<div class="summary-bar">' +
          '<div class="summary-stat"><div class="val">' + assemblers.length + '</div><div class="lbl">Assemblers</div></div>' +
          '<div class="summary-stat"><div class="val">' + assemblers.reduce(function(s,a){return s+(a.total_completed||0);},0) + '</div><div class="lbl">Total Completed</div></div>' +
          '<div class="summary-stat"><div class="val">' + (data.team_fixit_rate || 0) + '%</div><div class="lbl">Team Defect Rate</div></div>' +
          '</div>';

        html += '<table class="report-table"><thead><tr>' +
          '<th>Assembler</th><th class="num">Completed</th><th class="num">Per Day</th>' +
          '<th class="num">Avg Cycle</th><th class="num">FixIts</th><th class="num">Defect %</th>' +
          '</tr></thead><tbody>';

        assemblers.forEach(function(a) {
          html += '<tr>' +
            '<td style="font-weight:600">' + escHtml(a.assembler) + '</td>' +
            '<td class="num">' + (a.total_completed || 0) + '</td>' +
            '<td class="num">' + (a.per_day || 0) + '</td>' +
            '<td class="num">' + fmtMin(a.avg_working_minutes || a.avg_minutes) + '</td>' +
            '<td class="num">' + (a.fixit_count || 0) + '</td>' +
            '<td class="num pct ' + (a.fixit_rate > 5 ? 'mid' : 'high') + '">' + (a.fixit_rate || 0) + '%</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        el.innerHTML = html;
      });
    }

    // --- Quality tab ---
    function loadQuality(days) {
      var el = document.getElementById('tab-quality');
      el.innerHTML = '<div class="empty-state">Loading...</div>';
      fetch('/api/reports/quality?days=' + days).then(function(r) { return r.json(); }).then(function(data) {
        var html = daysControl('quality', days);

        if (data.total_fixits === 0) {
          el.innerHTML = html + '<div class="empty-state">No FixIt requests in this range</div>';
          return;
        }

        html += '<div class="summary-bar">' +
          '<div class="summary-stat"><div class="val">' + data.total_fixits + '</div><div class="lbl">Total FixIts</div></div>' +
          '<div class="summary-stat"><div class="val">' + (data.avg_resolution_minutes != null ? fmtMin(data.avg_resolution_minutes) : '—') + '</div><div class="lbl">Avg Resolution</div></div>' +
          '<div class="summary-stat"><div class="val">' + data.resolved_count + '</div><div class="lbl">Resolved</div></div>' +
          '<div class="summary-stat"><div class="val">' + (data.total_fixits - data.resolved_count) + '</div><div class="lbl">Open</div></div>' +
          '</div>';

        // Cause breakdown
        html += '<h3 style="font-size:0.85rem;margin:16px 0 8px;font-weight:700">Root Cause Breakdown</h3>';
        html += '<table class="report-table"><thead><tr><th>Cause</th><th class="num">Count</th><th class="num">%</th></tr></thead><tbody>';
        data.causes.forEach(function(c) {
          html += '<tr><td><span class="cause-pill ' + c.root_cause + '">' + causeName(c.root_cause) + '</span></td>' +
            '<td class="num">' + c.count + '</td><td class="num">' + c.pct + '%</td></tr>';
        });
        html += '</tbody></table>';

        // Top problem cabinets
        if (data.top_cabinets && data.top_cabinets.length > 0) {
          html += '<h3 style="font-size:0.85rem;margin:16px 0 8px;font-weight:700">Top Problem ' + LABELS.l3 + 's</h3>';
          html += '<table class="report-table"><thead><tr><th>Job</th><th>' + LABELS.l3 + ' #</th><th>Label</th><th class="num">Issues</th></tr></thead><tbody>';
          data.top_cabinets.forEach(function(cab) {
            html += '<tr><td>' + escHtml(cab.job_number) + '</td>' +
              '<td>' + escHtml(String(cab.cabinet_number)) + '</td>' +
              '<td>' + escHtml(cab.label || '') + '</td>' +
              '<td class="num" style="font-weight:700;color:var(--error)">' + cab.issue_count + '</td></tr>';
          });
          html += '</tbody></table>';
        }

        el.innerHTML = html;
      });
    }

    // Load initial tab
    loadTab('jobs');
  `, user, "/reports", [], null);
}
