import type { TenantConfig, SessionUser } from "../index";
import { page, SHARED_JS } from "./layout";

export function kpiPage(config: TenantConfig, user: SessionUser): string {
  return page("Assembler KPI", `

    .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .controls select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .controls .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .kpi-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .kpi-card .name { font-size: 1.1rem; font-weight: 700; }
    .kpi-card .rank { font-size: 0.7rem; color: var(--muted); }
    .source-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; vertical-align: middle; margin-left: 6px; }
    .source-badge.timer { background: rgba(34,197,94,0.2); color: var(--success); }
    .source-badge.estimated { background: rgba(148,163,184,0.2); color: var(--muted); }
    .kpi-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .kpi-stat { text-align: center; }
    .kpi-stat .val { font-size: 1.4rem; font-weight: 700; }
    .kpi-stat .lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
    .kpi-stat .val.accent { color: var(--accent); }
    .kpi-stat .val.success { color: var(--success); }
    .kpi-stat .val.warning { color: var(--warning); }
    .kpi-stat .val.purple { color: var(--purple); }
    .kpi-stat .val.error { color: var(--error); }
    .kpi-bar-row { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--muted); }
    .kpi-breakdown-label { font-size: 0.6rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; margin-top: 10px; margin-bottom: 4px; }
    .kpi-bar-row .day-label { width: 40px; text-align: right; flex-shrink: 0; }
    .kpi-bar-track { flex: 1; height: 14px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .kpi-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .kpi-bar-fill.blue { background: var(--accent); }
    .kpi-bar-row .count { width: 20px; font-weight: 600; }
    .kpi-bar-row .pause-tag { width: 32px; font-size: 0.6rem; color: var(--warning); text-align: right; flex-shrink: 0; }
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
    .team-causes { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
    .team-causes .tc-title { font-size: 0.7rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 8px; }
    .team-causes .tc-empty { font-size: 0.8rem; color: var(--muted); }
    .team-causes .cause-bar { height: 10px; }
    .team-causes .cause-legend { margin-top: 8px; font-size: 0.72rem; }
    .cause-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px; }
    .cause-bar span { height: 100%; }
    .cause-bar .cnc { background: var(--accent); }
    .cause-bar .material { background: var(--warning); }
    .cause-bar .transit { background: var(--purple); }
    .cause-bar .other-cause { background: var(--muted); }
    .cause-legend { display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.6rem; color: var(--muted); margin-top: 4px; }
    .cause-legend span::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 3px; vertical-align: middle; }
    .cause-legend .cnc::before { background: var(--accent); }
    .cause-legend .material::before { background: var(--warning); }
    .cause-legend .transit::before { background: var(--purple); }
    .cause-legend .other-cause::before { background: var(--muted); }

    @media (max-width: 400px) {
      main { padding: 10px; gap: 10px; }
      .kpi-grid { grid-template-columns: 1fr; gap: 10px; }
      .kpi-stats { grid-template-columns: 1fr 1fr; gap: 6px; }
      .kpi-stat .val { font-size: 1.2rem; }
      .kpi-stat .lbl { font-size: 0.6rem; }
      .kpi-card { padding: 12px; gap: 10px; }
      .kpi-card .name { font-size: 1rem; }
      .summary-bar { gap: 12px; padding: 10px 12px; justify-content: center; }
      .summary-stat .val { font-size: 1.2rem; }
      .summary-stat .lbl { font-size: 0.6rem; }
      .cause-legend { display: none; }
      .kpi-bar-row .pause-tag { display: none; }
      .kpi-timing { font-size: 0.7rem; }
    }

    @media (min-width: 401px) and (max-width: 768px) {
      .summary-bar { gap: 16px; justify-content: center; }
      .kpi-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    }

    @media (min-width: 769px) {
      .summary-bar { justify-content: space-between; }
      .kpi-stats { grid-template-columns: 1fr 1fr 1fr; }
    }
  `, `
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
    <div id="team-causes" class="team-causes" style="display:none"></div>
    <div id="kpi-grid" class="kpi-grid"></div>
    <div id="empty" class="empty-state" style="display:none">No assembly data in this time range</div>
  </main>
  `, `
    ${SHARED_JS}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var daysSelect = document.getElementById('days-select');
    var gridDiv = document.getElementById('kpi-grid');
    var summaryDiv = document.getElementById('summary');
    var emptyDiv = document.getElementById('empty');
    var stationInfo = document.getElementById('station-info');

    function load() {
      var days = daysSelect.value;
      var taktPromise = fetch('/api/kpi/takt?days=' + days).then(function(r) { return r.json(); }).catch(function() { return null; });
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
            document.getElementById('team-causes').style.display = 'none';
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

          var teamFixits = data.team_fixits || 0;
          var teamFixitRate = data.team_fixit_rate || 0;
          var fixitColor = teamFixitRate > 5 ? 'warning' : 'success';

          // Team-level defect cause breakdown (aggregated — more useful than per-person)
          var tcDiv = document.getElementById('team-causes');
          var tcb = data.team_fixit_breakdown || {};
          var tcTotal = (tcb.cnc_error||0) + (tcb.material_defect||0) + (tcb.transit_damage||0) + (tcb.other_cause||0);
          if (tcTotal > 0) {
            function tcSeg(n, cls) { return n > 0 ? '<span class="' + cls + '" style="width:' + (n / tcTotal * 100) + '%"></span>' : ''; }
            function tcLeg(n, cls, label) { return n > 0 ? '<span class="' + cls + '">' + label + ' ' + n + '</span>' : ''; }
            tcDiv.innerHTML = '<div class="tc-title">Defects by Cause — team (' + tcTotal + ' total · ' + teamFixitRate + '% of builds)</div>' +
              '<div class="cause-bar">' + tcSeg(tcb.cnc_error,'cnc') + tcSeg(tcb.material_defect,'material') + tcSeg(tcb.transit_damage,'transit') + tcSeg(tcb.other_cause,'other-cause') + '</div>' +
              '<div class="cause-legend">' + tcLeg(tcb.cnc_error,'cnc','CNC') + tcLeg(tcb.material_defect,'material','Material') + tcLeg(tcb.transit_damage,'transit','Transit') + tcLeg(tcb.other_cause,'other-cause','Other') + '</div>';
            tcDiv.style.display = 'block';
          } else {
            tcDiv.style.display = 'none';
          }

          taktPromise.then(function(taktData) {
            var taktStat = '';
            if (taktData && taktData.stations && taktData.stations.length > 0) {
              var l3Stations = taktData.stations.filter(function(s) { return s.level === 'l3'; });
              if (l3Stations.length > 0) {
                var totalDwell = 0; var totalCount = 0;
                l3Stations.forEach(function(s) { totalDwell += s.avg_minutes * s.count; totalCount += s.count; });
                var avgTakt = totalCount > 0 ? Math.round(totalDwell / totalCount * 10) / 10 : null;
                if (avgTakt != null) taktStat = '<div class="summary-stat"><div class="val purple">' + fmtMin(avgTakt) + '</div><div class="lbl">Avg Takt</div></div>';
              }
            }

            summaryDiv.style.display = 'flex';
            summaryDiv.innerHTML =
              '<div class="summary-stat"><div class="val">' + totalCompleted + '</div><div class="lbl">' + LABELS.l3 + 's Completed</div></div>' +
              '<div class="summary-stat"><div class="val">' + assemblers.length + '</div><div class="lbl">Assemblers</div></div>' +
              '<div class="summary-stat"><div class="val">' + (teamAvg && teamAvg > 0 ? Math.round(60 / teamAvg * 10) / 10 : '\\u2014') + '</div><div class="lbl">Team Cab/hr</div></div>' +
              '<div class="summary-stat"><div class="val">' + fmtMin(teamAvg) + '</div><div class="lbl">Team Avg Build</div></div>' +
              taktStat +
              '<div class="summary-stat"><div class="val ' + fixitColor + '">' + teamFixitRate + '%</div><div class="lbl">Defect Rate</div></div>' +
              '<div class="summary-stat"><div class="val">' + teamFixits + '</div><div class="lbl">FixIts</div></div>' +
              '<div class="summary-stat"><div class="val">' + days + 'd</div><div class="lbl">Time Range</div></div>';
          });

          var maxDaily = 1;
          Object.keys(daily).forEach(function(name) {
            daily[name].forEach(function(d) { if (d.completed > maxDaily) maxDaily = d.completed; });
          });

          var pauseDaily = data.pause_daily || {};
          var byJob = data.by_job || {};

          gridDiv.innerHTML = assemblers.map(function(a, idx) {
            var days7 = (daily[a.assembler] || []).slice(-7);
            var pauseDays = pauseDaily[a.assembler] || [];
            var pauseByDay = {};
            pauseDays.forEach(function(p) { pauseByDay[p.day] = p.avg_pause_min; });

            var barsHtml = days7.map(function(d) {
              var pct = Math.round((d.completed / maxDaily) * 100);
              var dayLabel = d.day.slice(5);
              var pauseLabel = pauseByDay[d.day] != null ? '<span class="pause-tag">' + pauseByDay[d.day] + 'm</span>' : '';
              return '<div class="kpi-bar-row">' +
                '<span class="day-label">' + dayLabel + '</span>' +
                '<div class="kpi-bar-track"><div class="kpi-bar-fill blue" style="width:' + pct + '%"></div></div>' +
                '<span class="count">' + d.completed + '</span>' + pauseLabel + '</div>';
            }).join('');

            var jobs = byJob[a.assembler] || [];
            var maxJob = 1;
            jobs.forEach(function(jb) { if (jb.completed > maxJob) maxJob = jb.completed; });
            var jobsHtml = jobs.map(function(jb) {
              var pct = Math.round((jb.completed / maxJob) * 100);
              return '<div class="kpi-bar-row">' +
                '<span class="day-label" title="' + escHtml(jb.job_name) + '">' + escHtml(jb.job_number) + '</span>' +
                '<div class="kpi-bar-track"><div class="kpi-bar-fill purple" style="width:' + pct + '%"></div></div>' +
                '<span class="count">' + jb.completed + '</span>' +
                (jb.avg_minutes != null ? '<span class="pause-tag">' + fmtMin(jb.avg_minutes) + '</span>' : '') +
                '</div>';
            }).join('');

            var src = a.source || 'estimated';
            var badge = '<span class="source-badge ' + src + '">' + src + '</span>';
            var cycleLabel = src === 'timer' ? 'Avg Work' : 'Avg Cycle';
            var cycleVal = src === 'timer' && a.avg_working_minutes != null ? a.avg_working_minutes : a.avg_minutes;
            var cabHr = (cycleVal && cycleVal > 0) ? Math.round(60 / cycleVal * 10) / 10 : null;
            var effPct = null;
            if (src === 'timer' && a.avg_working_minutes != null && a.avg_paused_minutes != null) {
              var total = a.avg_working_minutes + a.avg_paused_minutes;
              effPct = total > 0 ? Math.round((a.avg_working_minutes / total) * 100) : null;
            }
            var effClass = effPct == null ? '' : effPct >= 85 ? 'success' : effPct >= 70 ? 'warning' : 'error';
            var effRow = effPct != null
              ? '<div class="kpi-stat"><div class="val ' + effClass + '">' + effPct + '%</div><div class="lbl">Efficiency</div></div>'
              : '';
            var pauseRow = src === 'timer' && a.avg_paused_minutes != null
              ? '<div class="kpi-stat"><div class="val warning">' + fmtMin(a.avg_paused_minutes) + '</div><div class="lbl">Avg Paused</div></div>'
              : '';

            var fixitRate = a.fixit_rate || 0;
            var fixitCount = a.fixit_count || 0;
            var fixitClass = fixitRate > 5 ? 'warning' : fixitRate > 0 ? '' : 'success';
            var fixitStat = '<div class="kpi-stat"><div class="val ' + fixitClass + '">' + fixitRate + '%</div><div class="lbl">Defect Rate (' + fixitCount + ')</div></div>';

            return '<div class="kpi-card">' +
              '<div><span class="name">' + a.assembler + '</span> <span class="rank">#' + (idx + 1) + '</span>' + badge + '</div>' +
              '<div class="kpi-stats">' +
                '<div class="kpi-stat"><div class="val success">' + a.total_completed + '</div><div class="lbl">Completed</div></div>' +
                '<div class="kpi-stat"><div class="val accent">' + a.per_day + '</div><div class="lbl">Per Day</div></div>' +
                '<div class="kpi-stat"><div class="val accent">' + (cabHr != null ? cabHr : '\\u2014') + '</div><div class="lbl">Cab/hr</div></div>' +
                '<div class="kpi-stat"><div class="val purple">' + fmtMin(cycleVal) + '</div><div class="lbl">' + cycleLabel + '</div></div>' +
                (effRow || '') +
                (pauseRow || '<div class="kpi-stat"><div class="val">' + a.active_days + '</div><div class="lbl">Active Days</div></div>') +
                fixitStat +
              '</div>' +
              '<div class="kpi-timing">' +
                '<span class="fast">Best: ' + fmtMin(a.min_minutes) + '</span>' +
                '<span class="slow">Slowest: ' + fmtMin(a.max_minutes) + '</span>' +
              '</div>' +
              (jobsHtml ? '<div class="kpi-breakdown-label">By Job (completed · avg build)</div><div>' + jobsHtml + '</div>' : '') +
              (barsHtml ? '<div class="kpi-breakdown-label">By Day (completed · avg pause)</div><div>' + barsHtml + '</div>' : '') +
            '</div>';
          }).join('');
        });
    }

    daysSelect.addEventListener('change', load);
    load();
  `, user, "/kpi", [], config);
}


export function taktPage(config: TenantConfig, user: SessionUser): string {
  return page("Takt Time", `

    .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .controls select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .controls .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .takt-chart { display: flex; flex-direction: column; gap: 6px; }
    .takt-row { display: flex; align-items: center; gap: 8px; }
    .takt-label {
      width: 130px; flex-shrink: 0; text-align: right; font-size: 0.8rem; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .takt-bar-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
    .takt-bar-track { flex: 1; height: 28px; background: var(--bg); border-radius: 6px; overflow: hidden; position: relative; }
    .takt-bar-fill { height: 100%; border-radius: 6px; transition: width 0.4s; min-width: 2px; }
    .takt-bar-p90 {
      position: absolute; top: 0; height: 100%; width: 2px; background: var(--warning);
      opacity: 0.8;
    }
    .takt-val { width: 60px; font-size: 0.8rem; font-weight: 600; flex-shrink: 0; }
    .takt-meta { font-size: 0.65rem; color: var(--muted); }
    .level-tag {
      display: inline-block; font-size: 0.55rem; font-weight: 700; text-transform: uppercase;
      padding: 1px 5px; border-radius: 3px; margin-left: 4px; vertical-align: middle;
    }
    .level-l1 { background: rgba(59,130,246,0.15); color: var(--accent); }
    .level-l2 { background: rgba(34,197,94,0.15); color: var(--success); }
    .level-l3 { background: rgba(168,85,247,0.15); color: var(--purple); }
    .fill-l1 { background: var(--accent); }
    .fill-l2 { background: var(--success); }
    .fill-l3 { background: var(--purple); }
    .legend { display: flex; gap: 16px; font-size: 0.7rem; color: var(--muted); flex-wrap: wrap; align-items: center; }
    .legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; vertical-align: middle; }
    .legend .p90-mark { display: inline-block; width: 10px; height: 10px; border-left: 2px solid var(--warning); margin-right: 4px; }
    .outlier-list { display: flex; flex-direction: column; gap: 6px; }
    .outlier-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; font-size: 0.8rem;
    }
    .outlier-item .station { font-weight: 700; color: var(--warning); }
    .outlier-item .entity { color: var(--text); }
    .outlier-item .job { color: var(--muted); font-size: 0.7rem; }
    .outlier-item .time { font-weight: 700; font-size: 0.9rem; }
    .section-title { font-size: 0.85rem; font-weight: 700; color: var(--text); }
    .empty-state { text-align: center; padding: 48px 16px; color: var(--muted); }
    .bottleneck-badge {
      display: inline-block; font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
      background: rgba(239,68,68,0.15); color: var(--error); padding: 2px 6px; border-radius: 4px;
      margin-left: 6px;
    }
  `, `
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
    <div class="card">
      <div class="section-title">Station Dwell Times</div>
      <div class="legend" style="margin:8px 0">
        <span><span class="legend-dot" style="background:var(--accent)"></span>${config.entity_labels.l1}</span>
        <span><span class="legend-dot" style="background:var(--success)"></span>${config.entity_labels.l2}</span>
        <span><span class="legend-dot" style="background:var(--purple)"></span>${config.entity_labels.l3}</span>
        <span><span class="p90-mark"></span>P90</span>
      </div>
      <div class="takt-chart" id="takt-chart"></div>
    </div>
    <div class="card" id="outlier-card" style="display:none">
      <div class="section-title">Outliers <span style="font-weight:400;font-size:0.7rem;color:var(--muted)">&gt; 2x avg &amp; &gt; 30min</span></div>
      <div class="outlier-list" id="outlier-list"></div>
    </div>
    <div id="empty" class="empty-state" style="display:none">No transition data in this time range</div>
  </main>
  `, `
    ${SHARED_JS}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var daysSelect = document.getElementById('days-select');
    var chartDiv = document.getElementById('takt-chart');
    var outlierCard = document.getElementById('outlier-card');
    var outlierList = document.getElementById('outlier-list');
    var emptyDiv = document.getElementById('empty');

    function load() {
      var days = daysSelect.value;
      fetch('/api/kpi/takt?days=' + days)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var stations = data.stations || [];
          var outliers = data.outliers || [];
          var names = data.station_names || {};

          if (stations.length === 0) {
            chartDiv.innerHTML = '';
            outlierCard.style.display = 'none';
            emptyDiv.style.display = 'block';
            return;
          }
          emptyDiv.style.display = 'none';

          var maxAvg = Math.max.apply(null, stations.map(function(s) { return s.avg_minutes; }));
          var maxP90 = Math.max.apply(null, stations.map(function(s) { return s.p90_minutes; }));
          var maxBar = Math.max(maxAvg, maxP90) || 1;
          var bottleneckStation = stations.reduce(function(a, b) { return a.avg_minutes > b.avg_minutes ? a : b; });

          chartDiv.innerHTML = stations.map(function(s) {
            var avgPct = Math.round((s.avg_minutes / maxBar) * 100);
            var p90Pct = Math.round((s.p90_minutes / maxBar) * 100);
            var isBottleneck = s.station === bottleneckStation.station && stations.length > 1;
            var levelClass = 'fill-' + s.level;
            var fromName = names[s.station] || s.station;
            var toName = names[s.next_station] || s.next_station;

            return '<div class="takt-row">' +
              '<div class="takt-label">' + fromName +
                '<span class="level-tag level-' + s.level + '">' + s.level + '</span>' +
                (isBottleneck ? '<span class="bottleneck-badge">Bottleneck</span>' : '') +
              '</div>' +
              '<div class="takt-bar-wrap">' +
                '<div class="takt-bar-track">' +
                  '<div class="takt-bar-fill ' + levelClass + '" style="width:' + avgPct + '%"></div>' +
                  '<div class="takt-bar-p90" style="left:' + p90Pct + '%"></div>' +
                '</div>' +
                '<div class="takt-val">' + fmtMin(s.avg_minutes) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="takt-row" style="margin-bottom:4px">' +
              '<div class="takt-label"></div>' +
              '<div class="takt-meta">' + s.count + ' transitions — min ' + fmtMin(s.min_minutes) + ' / p90 ' + fmtMin(s.p90_minutes) + ' / max ' + fmtMin(s.max_minutes) + ' — to ' + toName + '</div>' +
            '</div>';
          }).join('');

          if (outliers.length > 0) {
            outlierCard.style.display = 'block';
            outlierList.innerHTML = outliers.map(function(o) {
              var fromName = names[o.station] || o.station;
              var toName = names[o.next_station] || o.next_station;
              return '<div class="outlier-item">' +
                '<div><span class="station">' + fromName + ' → ' + toName + '</span>' +
                  '<div><span class="entity">' + o.entity_label + '</span> <span class="job">' + o.job_number + '</span></div>' +
                '</div>' +
                '<div class="time">' + fmtMin(o.dwell_minutes) + '</div>' +
              '</div>';
            }).join('');
          } else {
            outlierCard.style.display = 'none';
          }
        });
    }

    daysSelect.addEventListener('change', load);
    load();
  `, user, "/takt", [], config);
}

