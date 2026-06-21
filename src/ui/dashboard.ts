import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS, SHARED_JS } from "./layout";
import { NOTES_STYLES, notesHTML } from "./components/notes";

export function dashboardPage(config: TenantConfig, user: SessionUser): string {
  const isLead = ["lead", "supervisor", "admin"].includes(user.role);

  return page("Dashboard", `


    /* Splash mode */
    .splash { display: flex; flex-direction: column; gap: 16px; }
    .splash .brief-card, .splash .quick-jobs { margin-bottom: 0; }
    .brief-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
    .brief-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .brief-header h3 { font-size: 0.95rem; font-weight: 700; }
    .brief-meta { font-size: 0.7rem; color: var(--muted); }
    .brief-content { font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; }
    .brief-empty { color: var(--muted); font-size: 0.85rem; font-style: italic; }
    .brief-edit { display: none; width: 100%; min-height: 100px; font-family: inherit; font-size: 0.85rem; padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); resize: vertical; }
    .brief-actions { display: flex; gap: 8px; margin-top: 10px; }
    .btn-sm { padding: 6px 14px; font-size: 0.75rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; }
    .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    .btn-secondary { background: var(--surface); color: var(--text); }

    .quick-jobs { display: flex; flex-direction: column; gap: 8px; }
    .quick-jobs h3 { font-size: 0.95rem; font-weight: 700; }
    .quick-job { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; text-decoration: none; color: var(--text); }
    .quick-job:active { background: var(--bg); }
    .quick-job-name { font-weight: 600; font-size: 0.9rem; }
    .quick-job-sub { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
    .quick-job-pct { font-size: 0.85rem; font-weight: 700; color: var(--accent); }
    .empty-msg { text-align: center; padding: 32px 16px; color: var(--muted); font-size: 0.85rem; }
    .empty-msg a { color: var(--accent); text-decoration: none; }

    /* Job hub mode */
    .job-hub { display: flex; flex-direction: column; gap: 16px; }
    #job-detail { display: flex; flex-direction: column; gap: 16px; }
    .job-selector { display: flex; align-items: center; gap: 10px; }
    .job-selector select { flex: 1; padding: 14px 16px; font-size: 1.2rem; font-weight: 700; border: 2px solid var(--accent); border-radius: 12px; background: var(--surface); color: var(--text); appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%233b82f6'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
    .hub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .hub-grid { grid-template-columns: 1fr; } }

    .hub-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
    .hub-card h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin-bottom: 8px; }
    .hub-card-full { grid-column: 1 / -1; }

    .progress-bar { height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; background: var(--success); }
    .stats-row { display: flex; gap: 14px; font-size: 0.8rem; color: var(--muted); flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 4px; }
    .stat .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-pending { background: var(--border); }
    .dot-active { background: var(--accent); }
    .dot-done { background: var(--success); }
    .dot-terminal { background: var(--purple); }

    .feed-scroll-wrap { max-height: 180px; overflow: hidden; position: relative; }
    .feed-scroll-wrap::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 30px; background: linear-gradient(transparent, var(--surface)); pointer-events: none; }
    .feed-scroll-inner { animation: feedScroll 20s linear infinite; }
    .feed-scroll-inner:hover { animation-play-state: paused; }
    @keyframes feedScroll { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }

    .detail-row { display: flex; justify-content: space-between; font-size: 0.8rem; padding: 4px 0; border-bottom: 1px solid var(--border); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: var(--muted); }
    .detail-value { font-weight: 500; }

    .notes-preview { font-size: 0.8rem; white-space: pre-wrap; color: var(--text); line-height: 1.4; }

    .feed-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
    .feed-panel h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin-bottom: 8px; }
    .feed-item { padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.78rem; }
    .feed-item:last-child { border-bottom: none; }
    .feed-station { color: var(--accent); }
    .feed-meta { color: var(--muted); font-size: 0.68rem; margin-top: 1px; }

    .link-list a { display: block; padding: 6px 0; font-size: 0.8rem; color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--border); }
    .link-list a:last-child { border-bottom: none; }

    .refresh-bar { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--muted); }
    .refresh-bar button { padding: 4px 12px; font-size: 0.7rem; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); cursor: pointer; }
    ${NOTES_STYLES}
  `, `
  <main>
    <div id="dash-splash" class="splash" style="display:none"></div>
    <div id="dash-hub" class="job-hub" style="display:none"></div>
  </main>
  `, `
    ${SHARED_JS}
    ${stationNamesJS(config)}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var L3_STATUSES = ${JSON.stringify(config.l3_statuses)};
    var TERMINAL = ${JSON.stringify(config.l3_terminal_status)};
    var IS_LEAD = ${isLead};
    var USER_ROLE = '${user.role}';
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var splash = document.getElementById('dash-splash');
    var hub = document.getElementById('dash-hub');
    var selectedJobId = null;
    var jobsCache = [];
    var autoTimer = null;

    function loadDashboard() {
      fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
        jobsCache = jobs;
        if (jobs.length === 0) {
          showSplash([]);
        } else {
          showHub(jobs);
        }
      });
    }

    function showSplash(jobs) {
      hub.style.display = 'none';
      splash.style.display = 'flex';
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }

      fetch('/api/briefs/today').then(function(r) { return r.json(); }).then(function(brief) {
        var briefHtml = '<div class="brief-card">' +
          '<div class="brief-header"><h3>Daily Brief</h3>' +
          (brief.author_name ? '<span class="brief-meta">by ' + escHtml(brief.author_name) + '</span>' : '') +
          '</div>' +
          '<div id="brief-display">' +
          (brief.content ? '<div class="brief-content">' + escHtml(brief.content) + '</div>' : '<div class="brief-empty">No brief posted today</div>') +
          '</div>' +
          '<textarea id="brief-edit" class="brief-edit">' + escHtml(brief.content || '') + '</textarea>' +
          (IS_LEAD ? '<div class="brief-actions">' +
            '<button class="btn-sm btn-primary" id="brief-edit-btn" onclick="toggleBriefEdit()">Edit</button>' +
            '<button class="btn-sm btn-secondary" id="brief-save-btn" style="display:none" onclick="saveBrief()">Save</button>' +
            '<button class="btn-sm btn-secondary" id="brief-cancel-btn" style="display:none" onclick="cancelBriefEdit()">Cancel</button>' +
          '</div>' : '') +
          '</div>';

        var jobsHtml = '';
        if (jobs.length > 0) {
          jobsHtml = '<div class="quick-jobs"><h3>Active ' + LABELS.l1 + 's</h3>' +
            jobs.map(function(j) {
              return '<a class="quick-job" href="/job/' + j.id + '">' +
                '<div><div class="quick-job-name">' + escHtml(j.job_number) + '</div>' +
                '<div class="quick-job-sub">' + escHtml(j.job_name) + '</div></div></a>';
            }).join('') + '</div>';
        } else {
          jobsHtml = '<div class="empty-msg">No active ' + LABELS.l1.toLowerCase() + 's.' +
            (USER_ROLE === 'admin' ? ' <a href="/jobs/new">Create one</a>' : '') + '</div>';
        }

        splash.innerHTML = briefHtml + jobsHtml;
      });
    }

    function toggleBriefEdit() {
      document.getElementById('brief-display').style.display = 'none';
      document.getElementById('brief-edit').style.display = 'block';
      document.getElementById('brief-edit-btn').style.display = 'none';
      document.getElementById('brief-save-btn').style.display = 'inline-block';
      document.getElementById('brief-cancel-btn').style.display = 'inline-block';
      document.getElementById('brief-edit').focus();
    }
    function cancelBriefEdit() {
      document.getElementById('brief-display').style.display = 'block';
      document.getElementById('brief-edit').style.display = 'none';
      document.getElementById('brief-edit-btn').style.display = 'inline-block';
      document.getElementById('brief-save-btn').style.display = 'none';
      document.getElementById('brief-cancel-btn').style.display = 'none';
    }
    function saveBrief() {
      var content = document.getElementById('brief-edit').value;
      fetch('/api/briefs/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content })
      }).then(function() { loadDashboard(); });
    }

    function showHub(jobs) {
      splash.style.display = 'none';
      hub.style.display = 'flex';

      if (!selectedJobId) selectedJobId = jobs[0].id;
      var found = jobs.find(function(j) { return j.id === selectedJobId; });
      if (!found) selectedJobId = jobs[0].id;

      var weeklyHtml = IS_LEAD ? '<div id="weekly-summary"></div>' : '';

      var selectorHtml = '<div class="job-selector">' +
        '<select id="job-select" onchange="selectJob(this.value)">' +
        jobs.map(function(j) {
          return '<option value="' + j.id + '"' + (j.id === selectedJobId ? ' selected' : '') + '>' +
            escHtml(j.job_number) + ' ' + escHtml(j.job_name) + ' (' + (j.cabinet_count || 0) + ')</option>';
        }).join('') +
        '</select></div>';

      hub.innerHTML = weeklyHtml + selectorHtml + '<div id="job-detail"></div>';
      if (IS_LEAD) loadWeeklySummary();
      loadJobDetail(selectedJobId);

      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(function() { loadJobDetail(selectedJobId); }, 30000);
    }

    function selectJob(id) {
      selectedJobId = parseInt(id);
      loadJobDetail(selectedJobId);
    }

    function loadJobDetail(jobId) {
      Promise.all([
        fetch('/api/jobs/' + jobId).then(function(r) { return r.json(); }),
        fetch('/api/scans/recent?limit=15').then(function(r) { return r.json(); }),
        fetch('/api/briefs/today').then(function(r) { return r.json(); }),
        fetch('/api/notes?context_type=job&context_id=' + jobId).then(function(r) { return r.json(); }),
      ]).then(function(results) {
        var job = results[0];
        var allScans = results[1];
        var brief = results[2];
        var jobNotes = results[3];
        var detail = document.getElementById('job-detail');
        if (!detail) return;

        var total = job.cabinets.length || job.cabinet_count || 1;
        var counts = {};
        L3_STATUSES.forEach(function(st) { counts[st] = 0; });
        job.cabinets.forEach(function(c) { counts[c.status] = (counts[c.status] || 0) + 1; });
        // "Done" = cabinets that have finished assembly or moved past it
        // (the last two L3 stages, e.g. assembled + staged). Counting only the
        // terminal stage made in-progress jobs read 0% before staging.
        var doneStatuses = L3_STATUSES.slice(-2);
        var doneCount = doneStatuses.reduce(function(a, st) { return a + (counts[st] || 0); }, 0);
        var pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        var statsHtml = L3_STATUSES.map(function(st, i) {
          var dotClass = st === 'pending' ? 'dot-pending' : st === TERMINAL ? 'dot-terminal' : 'dot-active';
          return '<div class="stat"><div class="dot ' + dotClass + '"></div>' + (counts[st] || 0) + ' ' + displayStatus(st).toLowerCase() + '</div>';
        }).join('');

        var progressCard = '<div class="hub-card hub-card-full">' +
          '<h4>Progress — ' + pct + '%</h4>' +
          '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="stats-row">' + statsHtml + '</div></div>';

        var bucketCard = '';

        var detailsCard = '<div class="hub-card"><h4>Details</h4>';
        detailsCard += '<div class="detail-row"><span class="detail-label">' + LABELS.l3 + ' Count</span><span class="detail-value">' + total + '</span></div>';
        if (job.finish_details) {
          detailsCard += '<div class="detail-row"><span class="detail-label">Finish</span><span class="detail-value">' + escHtml(job.finish_details) + '</span></div>';
        }
        detailsCard += '</div>';

        var engNotesCard = '';
        if (job.engineering_notes) {
          engNotesCard = '<div class="hub-card hub-card-full"><h4>Engineering Notes</h4>' +
            '<div class="notes-preview">' + escHtml(job.engineering_notes) + '</div></div>';
        }

        var notesPanel = '<div class="notes-panel"><h4>Notes <button onclick="showJobNoteForm()">+ Add</button></h4>' +
          '<div class="note-form" id="job-note-form">' +
          '<input type="text" id="job-note-title" placeholder="Title (optional)">' +
          '<textarea id="job-note-content" placeholder="Write a note..."></textarea>' +
          '<div class="note-form-actions"><button class="btn-save" onclick="saveJobNote()">Save</button>' +
          '<button class="btn-cancel" onclick="hideJobNoteForm()">Cancel</button></div></div>' +
          '<div id="job-notes-list">' +
          (jobNotes.length === 0 ? '<div class="notes-empty">No notes yet</div>' :
          jobNotes.map(function(n) {
            var ago = timeAgo(new Date(n.created_at + 'Z'));
            return '<div class="note-item">' +
              (n.title ? '<div class="note-title">' + escHtml(n.title) + '</div>' : '') +
              '<div class="note-body">' + escHtml(n.content) + '</div>' +
              '<div class="note-meta"><span>' + escHtml(n.author_name) + ' — ' + ago + '</span>' +
              '<button onclick="deleteJobNote(' + n.id + ')">delete</button></div></div>';
          }).join('')) +
          '</div></div>';

        var linksCard = '';
        var links = [];
        try { links = JSON.parse(job.external_links || '[]'); } catch(e) {}
        if (links.length > 0) {
          linksCard = '<div class="hub-card"><h4>Links</h4><div class="link-list">' +
            links.map(function(l) { return '<a href="' + escHtml(l.url) + '" target="_blank">' + escHtml(l.title || l.url) + '</a>'; }).join('') +
            '</div></div>';
        }

        var jobScans = allScans.filter(function(s) { return s.job_number === job.job_number; });
        var feedItems = jobScans.length === 0 ? '<div style="color:var(--muted);font-size:0.78rem;padding:12px">No activity yet</div>' :
          jobScans.map(function(s) {
            var t = new Date(s.scanned_at + 'Z');
            return '<div class="feed-item"><span class="feed-station">' + (STATION_NAMES[s.station] || s.station) + '</span>' +
              (s.bucket_name ? ' — ' + escHtml(s.bucket_name) : '') +
              (s.cabinet_number ? ' #' + s.cabinet_number : '') +
              '<div class="feed-meta">' + escHtml(s.scanned_by || '?') + ' — ' + timeAgo(t) + '</div></div>';
          }).join('');
        var feedCard = '<div class="feed-panel"><h4>Activity</h4>' +
          '<div class="feed-scroll-wrap"><div class="feed-scroll-inner" id="feed-scroll">' +
          feedItems + feedItems +
          '</div></div></div>';

        var briefCard = '';
        if (brief.content) {
          briefCard = '<div class="hub-card hub-card-full">' +
            '<h4>Daily Brief</h4>' +
            '<div class="brief-content">' + escHtml(brief.content) + '</div>' +
            (brief.author_name ? '<div class="brief-meta" style="margin-top:6px">by ' + escHtml(brief.author_name) + '</div>' : '') +
            '</div>';
        }

        var refreshBar = '<div class="refresh-bar"><span id="hub-updated">Updated ' + new Date().toLocaleTimeString() + '</span>' +
          '<button onclick="loadJobDetail(' + jobId + ')">Refresh</button></div>';

        detail.innerHTML = briefCard + progressCard +
          '<div class="hub-grid">' + detailsCard + linksCard + '</div>' +
          engNotesCard + feedCard + notesPanel + refreshBar;

        var scrollEl = document.getElementById('feed-scroll');
        if (scrollEl && jobScans.length > 3) {
          var h = scrollEl.scrollHeight / 2;
          var dur = Math.max(10, h / 15);
          scrollEl.style.animationDuration = dur + 's';
        } else if (scrollEl) {
          scrollEl.style.animation = 'none';
        }
      });
    }

    function showJobNoteForm() {
      document.getElementById('job-note-form').style.display = 'block';
      document.getElementById('job-note-content').focus();
    }
    function hideJobNoteForm() {
      document.getElementById('job-note-form').style.display = 'none';
      document.getElementById('job-note-title').value = '';
      document.getElementById('job-note-content').value = '';
    }
    function saveJobNote() {
      var title = document.getElementById('job-note-title').value.trim();
      var content = document.getElementById('job-note-content').value.trim();
      if (!content) return;
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_type: 'job', context_id: String(selectedJobId), title: title || undefined, content: content })
      }).then(function() {
        hideJobNoteForm();
        loadJobDetail(selectedJobId);
      });
    }
    function deleteJobNote(id) {
      if (!confirm('Delete this note?')) return;
      fetch('/api/notes/' + id, { method: 'DELETE' }).then(function() { loadJobDetail(selectedJobId); });
    }

    function loadWeeklySummary() {
      fetch('/api/reports/weekly-summary').then(function(r) { return r.json(); }).then(function(d) {
        var el = document.getElementById('weekly-summary');
        if (!el) return;
        el.innerHTML = '<div class="hub-card hub-card-full" style="margin-bottom:4px">' +
          '<h4>This Week</h4>' +
          '<div class="stats-row" style="gap:20px">' +
          '<div class="stat" style="flex-direction:column;align-items:center"><strong style="font-size:1.2rem;color:var(--accent)">' + d.jobs_completed + '</strong><span style="font-size:0.65rem;text-transform:uppercase">Jobs Done</span></div>' +
          '<div class="stat" style="flex-direction:column;align-items:center"><strong style="font-size:1.2rem;color:var(--accent)">' + d.cabinets_built + '</strong><span style="font-size:0.65rem;text-transform:uppercase">' + LABELS.l3 + 's Built</span></div>' +
          '<div class="stat" style="flex-direction:column;align-items:center"><strong style="font-size:1.2rem;color:var(--accent)">' + (d.avg_build_minutes != null ? fmtMin(d.avg_build_minutes) : '—') + '</strong><span style="font-size:0.65rem;text-transform:uppercase">Avg Build</span></div>' +
          '<div class="stat" style="flex-direction:column;align-items:center"><strong style="font-size:1.2rem;color:' + (d.fixit_count > 0 ? 'var(--warning)' : 'var(--accent)') + '">' + d.fixit_count + '</strong><span style="font-size:0.65rem;text-transform:uppercase">FixIts</span></div>' +
          '</div></div>';
      }).catch(function() {});
    }

    loadDashboard();
  `, user, "/dashboard", [], config);
}
