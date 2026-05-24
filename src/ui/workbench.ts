import type { TenantConfig, SessionUser } from "../index";
import { page, displayStatusJS, SHARED_JS } from "./layout";

export function workbenchPage(config: TenantConfig, user: SessionUser): string {
  return page("Build", `
    .wb-start { display: flex; flex-direction: column; gap: 12px; }
    .wb-start h3 { font-size: 1rem; font-weight: 700; margin: 0; }
    .wb-start .section-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .wb-cab-list { display: flex; flex-direction: column; gap: 6px; }
    .wb-cab-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px; background: var(--surface); border: 2px solid var(--border);
      border-radius: 8px; cursor: pointer; transition: all 0.15s;
    }
    .wb-cab-row:active { transform: scale(0.98); }
    .wb-cab-row.selected { border-color: var(--accent); background: rgba(59,130,246,0.1); }
    .wb-cab-row .cab-name { font-weight: 600; font-size: 0.9rem; }
    .wb-cab-row .cab-sub { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
    .wb-start-btn { width: 100%; padding: 14px; font-size: 1rem; font-weight: 600; border: none; border-radius: var(--radius); background: var(--accent); color: #fff; cursor: pointer; }
    .wb-start-btn:disabled { opacity: 0.4; cursor: default; }
    .wb-empty-msg { text-align: center; padding: 1.5rem; color: var(--muted); font-size: 0.85rem; }
    .timer-card { text-align: center; padding: 1.5rem; }
    .timer-display { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 3rem; font-weight: 700; letter-spacing: 2px; color: #fff; transition: color 0.3s; }
    .timer-display.paused { color: var(--warning, #f59e0b); }
    .timer-status { font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 1px; }
    .cab-info { margin-top: 1rem; }
    .cab-info .cab-number { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .cab-info .cab-label { font-size: 0.9rem; color: var(--muted); margin-top: 0.15rem; }
    .cab-info .job-line { font-size: 0.85rem; color: var(--accent); margin-top: 0.5rem; }
    .meta-section { margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem; }
    .meta-section .meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px; margin-top: 0.5rem; }
    .meta-section .meta-value { font-size: 0.85rem; color: var(--text); margin-top: 0.15rem; white-space: pre-line; }
    .meta-section a { color: var(--accent); text-decoration: none; }
    .build-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
    .build-actions button { flex: 1; padding: 1rem; font-size: 1rem; font-weight: 600; border: none; border-radius: var(--radius); cursor: pointer; }
    .btn-pause { background: var(--warning, #f59e0b); color: #000; }
    .btn-pause.is-paused { background: var(--accent); color: #fff; }
    .btn-complete { background: var(--success); color: #fff; }
    .complete-summary { text-align: center; padding: 2rem 1rem; }
    .complete-summary .done-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .complete-summary .done-time { font-size: 1.5rem; font-weight: 700; color: #fff; }
    .complete-summary .done-detail { font-size: 0.85rem; color: var(--muted); margin-top: 0.5rem; }
    .complete-summary a { display: inline-block; margin-top: 1.5rem; color: var(--accent); font-weight: 600; text-decoration: none; }
    .btn-fixit { background: var(--error); color: #fff; }
    .fixit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: none; flex-direction: column; align-items: center; padding: 1rem; overflow-y: auto; }
    .fixit-overlay.active { display: flex; }
    .fixit-form { width: 100%; margin-top: 60px; display: flex; flex-direction: column; gap: 1rem; }
    .fixit-form h2 { color: var(--error); font-size: 1.3rem; text-align: center; }
    .fixit-form .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer; }
    .cause-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .cause-btn { padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); font-size: 0.85rem; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s; }
    .cause-btn.selected { border-color: var(--error); background: rgba(239,68,68,0.15); color: var(--error); }
    .fixit-form textarea { min-height: 80px; resize: vertical; }
    .photo-row { display: flex; gap: 0.5rem; align-items: center; }
    .photo-row label { flex: 1; padding: 12px; border: 2px dashed var(--border); border-radius: 8px; text-align: center; cursor: pointer; color: var(--muted); font-size: 0.85rem; }
    .photo-row label.has-file { border-color: var(--success); color: var(--success); border-style: solid; }
    .photo-row input { display: none; }
    .fixit-submit { padding: 1rem; font-size: 1rem; font-weight: 600; border: none; border-radius: var(--radius); background: var(--error); color: #fff; cursor: pointer; }
    .fixit-submit:disabled { opacity: 0.5; cursor: default; }
    .fixit-sent { text-align: center; color: var(--success); font-weight: 600; font-size: 1.1rem; padding: 1rem; }
  `, `
    <div id="loading" style="text-align:center;padding:3rem;color:var(--muted);">Loading...</div>
    <div id="no-session" style="display:none">
      <div class="wb-start">
        <h3>Start a Build</h3>
        <div class="card">
          <label>${config.entity_labels.l1}</label>
          <input type="text" id="wb-job-input" placeholder="${config.entity_labels.l1} number" inputmode="numeric" autocomplete="off">
          <div id="wb-job-info" style="margin-top:8px;font-size:0.85rem;color:var(--muted)"></div>
        </div>
        <div id="wb-cab-section" style="display:none">
          <div class="section-label">Select ${config.entity_labels.l3}</div>
          <div class="wb-cab-list" id="wb-cab-list"></div>
        </div>
        <button class="wb-start-btn" id="wb-start-btn" disabled>Start Build</button>
        <div id="wb-error" style="display:none;color:var(--error);font-size:0.85rem;text-align:center"></div>
      </div>
    </div>
    <div id="workbench" style="display:none">
      <div class="card timer-card">
        <div class="timer-display" id="timer-display">00:00:00</div>
        <div class="timer-status" id="timer-status">Working</div>
      </div>
      <div class="card cab-info" id="cab-info">
        <div class="cab-number" id="cab-number"></div>
        <div class="cab-label" id="cab-label"></div>
        <div class="job-line" id="job-line"></div>
        <div class="meta-section" id="meta-section"></div>
      </div>
      <div class="build-actions">
        <button class="btn-pause" id="pause-btn">Pause</button>
        <button class="btn-fixit" id="fixit-btn">FixIt</button>
        <button class="btn-complete" id="complete-btn">Complete</button>
      </div>
    </div>
    <div id="complete-view" class="card complete-summary" style="display:none"></div>
    <div class="fixit-overlay" id="fixit-overlay">
      <button class="close-btn" id="fixit-close">×</button>
      <div class="fixit-form" id="fixit-form">
        <h2>Report a Problem</h2>
        <div class="section-label">Root Cause</div>
        <div class="cause-grid">
          <button class="cause-btn" data-cause="cnc_error">CNC Error</button>
          <button class="cause-btn" data-cause="material_defect">Material Defect</button>
          <button class="cause-btn" data-cause="transit_damage">Transit Damage</button>
          <button class="cause-btn" data-cause="other">Other</button>
        </div>
        <div class="section-label">Description (optional)</div>
        <textarea class="input" id="fixit-desc" placeholder="What's wrong?"></textarea>
        <div class="section-label">Photo (optional)</div>
        <div class="photo-row">
          <label id="photo-label" for="fixit-photo">📷 Tap to take photo</label>
          <input type="file" id="fixit-photo" accept="image/*" capture="environment">
        </div>
        <button class="fixit-submit" id="fixit-submit" disabled>Submit FixIt</button>
        <div id="fixit-result"></div>
      </div>
    </div>
  `, `
    ${SHARED_JS}
    ${displayStatusJS(config)}

    var sessionId = null;
    var currentCabinetId = null;
    var startedAtMs = 0;
    var totalPausedMs = 0;
    var pausedAtMs = 0;
    var isPaused = false;
    var timerInterval = null;

    function updateTimer() {
      var now = Date.now();
      var elapsed = (now - startedAtMs) / 1000 - totalPausedMs / 1000;
      if (isPaused) elapsed -= (now - pausedAtMs) / 1000;
      if (elapsed < 0) elapsed = 0;
      document.getElementById('timer-display').textContent = fmtTime(elapsed);
    }

    function renderSession(s) {
      sessionId = s.id;
      currentCabinetId = s.cabinet_id;
      startedAtMs = new Date(s.started_at + 'Z').getTime();
      totalPausedMs = (s.total_paused_seconds || 0) * 1000;
      isPaused = !!s.paused_at;
      pausedAtMs = isPaused ? new Date(s.paused_at + 'Z').getTime() : 0;

      var cabEl = document.getElementById('cab-number');
      cabEl.innerHTML = '<a href="/cabinet/' + s.cabinet_id + '" style="color:inherit;text-decoration:none">${config.entity_labels.l3} #' + s.cabinet_number + '</a>';
      document.getElementById('cab-label').textContent = s.label || '';
      document.getElementById('job-line').textContent = s.job_number + ' — ' + s.job_name;

      var meta = '';
      if (s.accessories) meta += '<div class="meta-label">Accessories</div><div class="meta-value">' + escHtml(s.accessories) + '</div>';
      if (s.notes) meta += '<div class="meta-label">Notes</div><div class="meta-value">' + escHtml(s.notes) + '</div>';
      if (s.assembly_sheet_url) meta += '<div class="meta-label">Assembly Sheet</div><div class="meta-value"><a href="' + escHtml(s.assembly_sheet_url) + '" target="_blank" rel="noopener">Open Assembly Sheet ↗</a></div>';
      document.getElementById('meta-section').innerHTML = meta;

      var pauseBtn = document.getElementById('pause-btn');
      if (isPaused) {
        pauseBtn.textContent = 'Resume';
        pauseBtn.classList.add('is-paused');
        document.getElementById('timer-display').classList.add('paused');
        document.getElementById('timer-status').textContent = 'Paused';
      } else {
        pauseBtn.textContent = 'Pause';
        pauseBtn.classList.remove('is-paused');
        document.getElementById('timer-display').classList.remove('paused');
        document.getElementById('timer-status').textContent = 'Working';
      }

      document.getElementById('loading').style.display = 'none';
      document.getElementById('workbench').style.display = 'block';

      if (timerInterval) clearInterval(timerInterval);
      updateTimer();
      timerInterval = setInterval(updateTimer, 1000);
    }

    var wbJobInput = document.getElementById('wb-job-input');
    var wbJobInfo = document.getElementById('wb-job-info');
    var wbCabSection = document.getElementById('wb-cab-section');
    var wbCabList = document.getElementById('wb-cab-list');
    var wbStartBtn = document.getElementById('wb-start-btn');
    var wbError = document.getElementById('wb-error');
    var wbSelectedCabId = null;
    var wbDebounce = null;

    wbJobInput.addEventListener('input', function() {
      clearTimeout(wbDebounce);
      wbSelectedCabId = null;
      wbJobInfo.textContent = '';
      wbCabSection.style.display = 'none';
      wbStartBtn.disabled = true;
      wbError.style.display = 'none';
      var val = wbJobInput.value.trim();
      if (val.length >= 3) {
        wbDebounce = setTimeout(function() { wbLookup(val); }, 300);
      }
    });

    function wbLookup(num) {
      wbJobInfo.textContent = 'Looking up...';
      fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
        var job = jobs.find(function(j) { return j.job_number === num; });
        if (!job) {
          wbJobInfo.textContent = 'No active ${config.entity_labels.l1.toLowerCase()} found';
          return;
        }
        fetch('/api/jobs/' + job.id).then(function(r) { return r.json(); }).then(function(detail) {
          wbJobInfo.innerHTML = '<strong>' + escHtml(detail.job_name) + '</strong>';
          var cabs = detail.cabinets || [];
          if (cabs.length === 0) {
            wbCabSection.style.display = 'block';
            wbCabList.innerHTML = '<div class="wb-empty-msg">No ${config.entity_labels.l3.toLowerCase()}s in this ${config.entity_labels.l1.toLowerCase()}</div>';
            return;
          }
          wbCabSection.style.display = 'block';
          wbCabList.innerHTML = cabs.map(function(c) {
            var sub = c.label || '';
            if (c.status) sub += (sub ? ' — ' : '') + displayStatus(c.status);
            return '<div class="wb-cab-row" data-id="' + c.id + '">'
              + '<div><div class="cab-name">${config.entity_labels.l3} #' + c.cabinet_number + '</div>'
              + (sub ? '<div class="cab-sub">' + escHtml(sub) + '</div>' : '')
              + '</div><span style="color:var(--accent);font-weight:700">→</span></div>';
          }).join('');

          wbCabList.querySelectorAll('.wb-cab-row').forEach(function(row) {
            row.addEventListener('click', function() {
              wbSelectedCabId = parseInt(row.dataset.id);
              wbCabList.querySelectorAll('.wb-cab-row').forEach(function(r) {
                r.classList.toggle('selected', r.dataset.id == wbSelectedCabId);
              });
              wbStartBtn.disabled = false;
              wbError.style.display = 'none';
            });
          });
        });
      });
    }

    wbStartBtn.addEventListener('click', function() {
      if (!wbSelectedCabId || wbStartBtn.disabled) return;
      wbStartBtn.disabled = true;
      wbStartBtn.textContent = 'Starting...';
      wbError.style.display = 'none';
      fetch('/api/build/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinet_id: wbSelectedCabId }),
      }).then(function(r) {
        return r.json().then(function(d) { return { ok: r.ok, data: d }; });
      }).then(function(r) {
        if (r.ok) {
          document.getElementById('no-session').style.display = 'none';
          fetch('/api/build/active').then(function(r2) { return r2.json(); }).then(function(d) {
            if (d.session) renderSession(d.session);
          });
        } else {
          wbError.textContent = r.data.error || 'Failed to start build';
          wbError.style.display = 'block';
          wbStartBtn.disabled = false;
          wbStartBtn.textContent = 'Start Build';
        }
      });
    });

    fetch('/api/build/active').then(function(r) { return r.json(); }).then(function(data) {
      if (data.session) {
        renderSession(data.session);
      } else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('no-session').style.display = 'block';
        wbJobInput.focus();
      }
    });

    document.getElementById('pause-btn').addEventListener('click', function() {
      if (!sessionId) return;
      var action = isPaused ? 'resume' : 'pause';
      var ts = new Date().toISOString();
      fetch('/api/build/' + sessionId + '/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_timestamp: ts }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, status: r.status, data: d }; }); })
        .then(function(r) {
          if (!r.ok && r.status !== 202) return;
          if (action === 'pause') {
            isPaused = true;
            pausedAtMs = Date.now();
            document.getElementById('pause-btn').textContent = 'Resume';
            document.getElementById('pause-btn').classList.add('is-paused');
            document.getElementById('timer-display').classList.add('paused');
            document.getElementById('timer-status').textContent = r.status === 202 ? 'Paused (offline)' : 'Paused';
          } else {
            if (r.data.total_paused_seconds != null) totalPausedMs = r.data.total_paused_seconds * 1000;
            else totalPausedMs += (Date.now() - pausedAtMs);
            isPaused = false;
            pausedAtMs = 0;
            document.getElementById('pause-btn').textContent = 'Pause';
            document.getElementById('pause-btn').classList.remove('is-paused');
            document.getElementById('timer-display').classList.remove('paused');
            document.getElementById('timer-status').textContent = 'Working';
          }
        });
    });

    document.getElementById('complete-btn').addEventListener('click', function() {
      if (!sessionId) return;
      if (!confirm('Complete this build?')) return;
      var ts = new Date().toISOString();
      fetch('/api/build/' + sessionId + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_timestamp: ts }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, status: r.status, data: d }; }); })
        .then(function(r) {
          if (!r.ok && r.status !== 202) return;
          if (timerInterval) clearInterval(timerInterval);
          document.getElementById('workbench').style.display = 'none';
          var cv = document.getElementById('complete-view');
          cv.style.display = 'block';
          if (r.status === 202) {
            cv.innerHTML = '<div class="done-icon">✓</div>'
              + '<div class="done-time">Build Complete</div>'
              + '<div class="done-detail">Will sync when back online</div>'
              + '<a href="/">Start Next Build →</a>';
          } else {
            cv.innerHTML = '<div class="done-icon">✓</div>'
              + '<div class="done-time">' + r.data.working_minutes + ' min</div>'
              + '<div class="done-detail">Total elapsed: ' + r.data.total_minutes + ' min'
              + (r.data.total_paused_seconds > 0 ? ' (paused ' + Math.round(r.data.total_paused_seconds / 60 * 10) / 10 + ' min)' : '')
              + '</div>'
              + '<a href="/">Start Next Build →</a>';
          }
        });
    });

    var fixitOverlay = document.getElementById('fixit-overlay');
    var fixitSelectedCause = null;
    var fixitCabinetId = null;

    document.querySelectorAll('.cause-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.cause-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        fixitSelectedCause = btn.dataset.cause;
        document.getElementById('fixit-submit').disabled = false;
      });
    });

    document.getElementById('fixit-photo').addEventListener('change', function(e) {
      var label = document.getElementById('photo-label');
      if (e.target.files && e.target.files.length > 0) {
        label.textContent = '✓ ' + e.target.files[0].name;
        label.classList.add('has-file');
      } else {
        label.textContent = '📷 Tap to take photo';
        label.classList.remove('has-file');
      }
    });

    document.getElementById('fixit-btn').addEventListener('click', function() {
      if (!sessionId) return;
      fixitCabinetId = currentCabinetId;
      if (!isPaused) {
        fetch('/api/build/' + sessionId + '/pause', { method: 'POST' })
          .then(function(r) { return r.json(); })
          .then(function() {
            isPaused = true;
            pausedAtMs = Date.now();
            document.getElementById('pause-btn').textContent = 'Resume';
            document.getElementById('pause-btn').classList.add('is-paused');
            document.getElementById('timer-display').classList.add('paused');
            document.getElementById('timer-status').textContent = 'Paused — FixIt';
          });
      } else {
        document.getElementById('timer-status').textContent = 'Paused — FixIt';
      }
      fixitOverlay.classList.add('active');
    });

    document.getElementById('fixit-close').addEventListener('click', function() {
      fixitOverlay.classList.remove('active');
    });

    document.getElementById('fixit-submit').addEventListener('click', function() {
      var btn = document.getElementById('fixit-submit');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      var formData = new FormData();
      formData.append('cabinet_id', fixitCabinetId);
      formData.append('build_session_id', sessionId);
      formData.append('root_cause', fixitSelectedCause);
      formData.append('description', document.getElementById('fixit-desc').value);
      var photoFile = document.getElementById('fixit-photo').files[0];
      if (photoFile) formData.append('photo', photoFile);

      fetch('/api/fixit', { method: 'POST', body: formData })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(r) {
          if (r.ok) {
            document.getElementById('fixit-result').innerHTML = '<div class="fixit-sent">FixIt submitted ✓</div>';
            setTimeout(function() { fixitOverlay.classList.remove('active'); }, 1500);
            fixitSelectedCause = null;
            document.querySelectorAll('.cause-btn').forEach(function(b) { b.classList.remove('selected'); });
            document.getElementById('fixit-desc').value = '';
            document.getElementById('fixit-photo').value = '';
            document.getElementById('photo-label').textContent = '📷 Tap to take photo';
            document.getElementById('photo-label').classList.remove('has-file');
            document.getElementById('fixit-result').innerHTML = '';
            btn.textContent = 'Submit FixIt';
          } else {
            document.getElementById('fixit-result').innerHTML = '<div style="color:var(--error)">' + (r.data.error || 'Failed') + '</div>';
            btn.disabled = false;
            btn.textContent = 'Submit FixIt';
          }
        });
    });
  `, user, "/workbench", [], config);
}

// ─── My Workbench (Assembler Home) ───────────────────────


export function myWorkbenchPage(config: TenantConfig, user: SessionUser): string {
  const L3 = config.entity_labels.l3;
  return page("My Workbench", `
    main { gap: 14px; }
    .greeting { font-size: 1.3rem; font-weight: 700; }
    .today-stat { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--muted); }
    .today-stat .count { font-size: 1.4rem; font-weight: 700; color: var(--success); }
    .active-build { border-left: 3px solid var(--accent); cursor: pointer; }
    .active-build .ab-timer { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; font-size: 1.8rem; font-weight: 700; color: #fff; }
    .active-build .ab-timer.paused { color: var(--warning, #f59e0b); }
    .active-build .ab-status { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    .active-build .ab-cab { font-size: 0.9rem; color: var(--accent); margin-top: 0.25rem; }
    .section-title { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .avail-list { display: flex; flex-direction: column; gap: 8px; }
    .avail-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;
      transition: border-color 0.15s;
    }
    .avail-card:active { transform: scale(0.98); }
    .avail-card .ac-main { display: flex; flex-direction: column; gap: 2px; }
    .avail-card .ac-cab { font-weight: 700; font-size: 0.95rem; }
    .avail-card .ac-job { font-size: 0.8rem; color: var(--muted); }
    .avail-card .ac-meta { font-size: 0.7rem; color: var(--muted); }
    .avail-card .start-arrow { color: var(--accent); font-size: 1.2rem; font-weight: 700; }
    .recent-list { display: flex; flex-direction: column; gap: 6px; }
    .recent-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
    .recent-row .rr-cab { font-weight: 600; }
    .recent-row .rr-time { color: var(--success); font-weight: 600; }
    .recent-row .rr-ago { color: var(--muted); font-size: 0.75rem; }
    .empty-msg { text-align: center; padding: 2rem 1rem; color: var(--muted); font-size: 0.9rem; }
    .home-picker { margin-top: 0.5rem; }
    .home-picker select { width: auto; padding: 6px 10px; font-size: 0.8rem; }
    .home-picker .label { font-size: 0.7rem; color: var(--muted); }
  `, `
  <main>
    <div class="greeting">Hey, ${user.name.split(" ")[0]}</div>
    <div class="today-stat"><span class="count" id="today-count">—</span> ${L3}s completed today</div>

    <div id="active-section" style="display:none">
      <div class="section-title">Active Build</div>
      <div class="card active-build" id="active-build" onclick="window.location.href='/workbench'">
        <div class="ab-timer" id="ab-timer">00:00:00</div>
        <div class="ab-status" id="ab-status">Working</div>
        <div class="ab-cab" id="ab-cab"></div>
      </div>
    </div>

    <div id="avail-section">
      <div class="section-title">Ready to Build</div>
      <div class="avail-list" id="avail-list"></div>
      <div id="avail-empty" class="empty-msg" style="display:none">No ${L3.toLowerCase()}s waiting for assembly</div>
    </div>

    <div id="recent-section" style="display:none">
      <div class="section-title">Recent Builds</div>
      <div class="recent-list" id="recent-list"></div>
    </div>

    <div class="home-picker">
      <span class="label">Home screen</span>
      <select id="home-select">
        <option value="scan">Scan</option>
        <option value="workbench" selected>My Workbench</option>
        <option value="fixit">FixIt Queue</option>
        <option value="staging">Staging</option>
        <option value="dashboard">Dashboard</option>
      </select>
    </div>
  </main>
  `, `
    ${SHARED_JS}

    var abTimerEl = document.getElementById('ab-timer');
    var abInterval = null;

    function startAbTimer(session) {
      var startMs = new Date(session.started_at + 'Z').getTime();
      var pausedMs = (session.total_paused_seconds || 0) * 1000;
      var isPaused = !!session.paused_at;
      var pausedAtMs = isPaused ? new Date(session.paused_at + 'Z').getTime() : 0;

      function tick() {
        var elapsed = (Date.now() - startMs) / 1000 - pausedMs / 1000;
        if (isPaused) elapsed -= (Date.now() - pausedAtMs) / 1000;
        abTimerEl.textContent = fmtTime(elapsed);
      }
      tick();
      if (abInterval) clearInterval(abInterval);
      abInterval = setInterval(tick, 1000);

      if (isPaused) {
        abTimerEl.classList.add('paused');
        document.getElementById('ab-status').textContent = 'Paused';
      }
    }

    fetch('/api/my/workbench')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        document.getElementById('today-count').textContent = data.today_completed;

        if (data.active_session) {
          document.getElementById('active-section').style.display = 'block';
          var s = data.active_session;
          document.getElementById('ab-cab').textContent = '${L3} #' + s.cabinet_number + (s.label ? ' — ' + escHtml(s.label) : '') + ' · ' + s.job_number;
          startAbTimer(s);
        }

        var list = document.getElementById('avail-list');
        if (data.available.length === 0) {
          document.getElementById('avail-empty').style.display = 'block';
        } else {
          list.innerHTML = data.available.map(function(c) {
            var meta = [];
            if (c.bucket_name) meta.push(c.bucket_name);
            if (c.accessories) meta.push('Has accessories');
            return '<div class="avail-card" onclick="window.location.href=\\'/scan\\'">'
              + '<div class="ac-main">'
              +   '<div class="ac-cab">${L3} #' + c.cabinet_number + (c.label ? ' — ' + escHtml(c.label) : '') + '</div>'
              +   '<div class="ac-job">' + c.job_number + ' — ' + escHtml(c.job_name) + '</div>'
              +   (meta.length ? '<div class="ac-meta">' + meta.join(' · ') + '</div>' : '')
              + '</div>'
              + '<span class="start-arrow">→</span>'
              + '</div>';
          }).join('');
        }

        if (data.recent.length > 0) {
          document.getElementById('recent-section').style.display = 'block';
          document.getElementById('recent-list').innerHTML = data.recent.map(function(r) {
            return '<div class="recent-row">'
              + '<div><span class="rr-cab">${L3} #' + r.cabinet_number + '</span> · ' + r.job_number + '</div>'
              + '<div><span class="rr-time">' + fmtMin(r.working_minutes) + '</span> <span class="rr-ago">' + timeAgo(new Date(r.completed_at + 'Z')) + '</span></div>'
              + '</div>';
          }).join('');
        }
      });

    document.getElementById('home-select').addEventListener('change', function(e) {
      fetch('/api/auth/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_page: e.target.value }),
      }).then(function() {
        if (e.target.value !== 'workbench') window.location.href = '/';
      });
    });
  `, user, "/", [], config);
}

// ─── FixIt Dashboard ─────────────────────────────────────
