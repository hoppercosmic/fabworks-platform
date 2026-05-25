import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS, ROLE_LEVELS, SHARED_JS } from "./layout";

export function newJobPage(config: TenantConfig, user: SessionUser): string {
  const L1 = config.entity_labels.l1;
  const L3 = config.entity_labels.l3;
  return page(`New ${L1}`, `

    .recent-job {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem;
    }
    .recent-job:last-child { border-bottom: none; }
    .recent-job .num { font-weight: 600; }
    .recent-job a { color: var(--accent); text-decoration: none; font-size: 0.8rem; }
`, `
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
`, user, "/jobs/new", [], config);
}


export function jobDetailPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page(`${config.entity_labels.l1} Detail`, `

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
    .cab-tile, a.cab-tile { text-decoration: none; color: var(--text); }
    .cab-tile {
      padding: 10px 6px; text-align: center; background: var(--bg);
      border: 1px solid var(--border); border-radius: 8px; font-size: 0.8rem; font-weight: 600;
    }
    .cab-tile.assembling { border-color: var(--accent); color: var(--accent); }
    .cab-tile.assembled { border-color: var(--success); color: var(--success); }
    .cab-tile.staged { border-color: var(--purple); color: var(--purple); }
    .cab-tile .sub { font-weight: 400; font-size: 0.65rem; color: var(--muted); }
    .cab-tile.clickable { cursor: pointer; }
    .cab-tile.clickable:active { transform: scale(0.97); }
    .cab-tile .meta-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--warning, #f59e0b); margin-left: 4px; vertical-align: middle; }
    .cab-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .cab-modal {
      background: var(--surface); border-radius: 12px; padding: 20px;
      width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto;
    }
    .cab-modal h3 { margin: 0 0 12px; font-size: 1rem; }
    .cab-modal label { font-size: 0.75rem; font-weight: 600; color: var(--muted); display: block; margin: 10px 0 4px; }
    .cab-modal textarea, .cab-modal input[type="url"] {
      width: 100%; padding: 8px 10px; font-size: 0.85rem; border-radius: 6px;
      border: 1px solid var(--border); background: var(--bg); color: var(--text);
      font-family: inherit; resize: vertical; box-sizing: border-box;
    }
    .cab-modal textarea { min-height: 60px; }
    .cab-modal .btn-row { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
    .cab-modal .sheet-link { color: var(--accent); font-size: 0.8rem; word-break: break-all; }
    .label-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
    .qr-label {
      background: white; color: #111; border-radius: 8px; padding: 12px;
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .qr-label canvas, .qr-label img { display: block; width: 120px; height: 120px; }
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
`, `
  <main>
    <div id="loading" style="color:var(--muted);text-align:center;padding:48px">Loading...</div>
    <div id="content" style="display:none">
      <div class="card">
        <div class="job-title" id="job-title"></div>
        <div class="job-meta" id="job-meta"></div>
        <div style="margin-top:8px">
          <button class="btn btn-sm" id="print-labels-btn" style="background:var(--accent);color:white">Print QR Labels</button>
          <button class="btn btn-sm" id="print-station-btn" style="background:var(--success);color:white;margin-left:6px">Print Station Codes</button>
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
      <div class="card" id="import-section" style="display:none">
        <div class="section-title">
          <span>Import Cut List</span>
          <button class="btn btn-sm" id="import-toggle-btn" style="background:var(--accent);color:white">Upload CSV</button>
        </div>
        <div id="import-ui" style="display:none">
          <input type="file" id="import-file" accept=".csv" style="margin-bottom:8px;font-size:0.8rem">
          <div id="import-preview" style="font-size:0.75rem;color:var(--muted);margin-bottom:8px"></div>
          <button class="btn btn-sm" id="import-confirm-btn" style="background:var(--success);color:white;display:none">Confirm Import</button>
          <div id="import-result" style="font-size:0.8rem;margin-top:8px"></div>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Scan History</div>
        <div class="scan-log" id="scan-log"></div>
      </div>
    </div>
    <div id="cab-modal-overlay" class="cab-modal-overlay" style="display:none">
      <div class="cab-modal">
        <h3 id="cab-modal-title"></h3>
        <label>Accessories</label>
        <textarea id="meta-accessories" placeholder="One per line, e.g.&#10;Soft close hinges&#10;Pull-out shelf"></textarea>
        <label>Notes / Special Instructions</label>
        <textarea id="meta-notes" placeholder="Modifications, custom requests..."></textarea>
        <label>Assembly Sheet URL</label>
        <input type="url" id="meta-sheet-url" placeholder="https://drive.google.com/...">
        <div id="meta-sheet-preview" style="margin-top:4px"></div>
        <div class="btn-row">
          <button class="btn btn-sm" id="meta-cancel" style="background:var(--surface);border:1px solid var(--border);color:var(--text)">Cancel</button>
          <button class="btn btn-sm" id="meta-save" style="background:var(--accent);color:white">Save</button>
        </div>
      </div>
    </div>
  </main>
`, `
    ${SHARED_JS}
    ${stationNamesJS(config)}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var STATIONS = ${JSON.stringify(config.stations)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var USER_ROLE = ${JSON.stringify(user.role)};
    var ROLE_LEVELS = { user: 0, lead: 1, supervisor: 2, admin: 3 };
    var editingCabId = null;

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
          var hasMeta = c.accessories || c.notes || c.assembly_sheet_url;
          return '<a class="cab-tile ' + c.status + ' clickable" href="/cabinet/' + c.id + '">' +
            LABELS.l3 + ' ' + c.cabinet_number +
            (hasMeta ? '<span class="meta-dot" title="Has metadata"></span>' : '') +
            '<div class="sub">' + (c.label || displayStatus(c.status)) + '</div></a>';
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

    // --- CSV Import ---
    if (ROLE_LEVELS[USER_ROLE] >= ROLE_LEVELS.lead) {
      document.getElementById('import-section').style.display = '';
      var importFile = document.getElementById('import-file');
      var importPreview = document.getElementById('import-preview');
      var importConfirm = document.getElementById('import-confirm-btn');
      var importResult = document.getElementById('import-result');

      document.getElementById('import-toggle-btn').addEventListener('click', function() {
        var ui = document.getElementById('import-ui');
        ui.style.display = ui.style.display === 'none' ? '' : 'none';
      });

      importFile.addEventListener('change', function() {
        var file = importFile.files[0];
        if (!file) { importPreview.textContent = ''; importConfirm.style.display = 'none'; return; }
        var reader = new FileReader();
        reader.onload = function(e) {
          var lines = e.target.result.split(/\\r?\\n/).filter(function(l) { return l.trim(); });
          if (lines.length < 2) { importPreview.textContent = 'File must have a header + data rows'; return; }
          var headers = lines[0].split(',').map(function(h) { return h.trim().replace(/^"|"$/g, ''); });
          importPreview.innerHTML = '<strong>' + (lines.length - 1) + ' rows</strong> — Columns: ' + headers.map(function(h) { return escHtml(h); }).join(', ');
          importConfirm.style.display = '';
        };
        reader.readAsText(file);
      });

      importConfirm.addEventListener('click', function() {
        var file = importFile.files[0];
        if (!file) return;
        importConfirm.disabled = true;
        importConfirm.textContent = 'Importing...';
        var fd = new FormData();
        fd.append('file', file);
        fetch('/api/jobs/' + jobId + '/import', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            importConfirm.disabled = false;
            importConfirm.textContent = 'Confirm Import';
            if (data.error) { importResult.innerHTML = '<span style="color:var(--danger)">' + escHtml(data.error) + '</span>'; return; }
            var msg = '<span style="color:var(--success)">' + data.imported + ' imported (' + data.created + ' new, ' + data.updated + ' updated)</span>';
            if (data.unmapped && data.unmapped.length) msg += '<br><span style="color:var(--warning)">Unmapped columns: ' + data.unmapped.join(', ') + '</span>';
            if (data.errors && data.errors.length) msg += '<br><span style="color:var(--danger)">' + data.errors.slice(0, 5).join('<br>') + '</span>';
            importResult.innerHTML = msg;
            load();
          });
      });
    }

    // --- Cabinet metadata modal ---
    function openCabModal(cabId) {
      var cab = job.cabinets.find(function(c) { return c.id === cabId; });
      if (!cab) return;
      editingCabId = cabId;
      document.getElementById('cab-modal-title').textContent = LABELS.l3 + ' ' + cab.cabinet_number + (cab.label ? ' — ' + cab.label : '');
      document.getElementById('meta-accessories').value = cab.accessories || '';
      document.getElementById('meta-notes').value = cab.notes || '';
      document.getElementById('meta-sheet-url').value = cab.assembly_sheet_url || '';
      updateSheetPreview();
      document.getElementById('cab-modal-overlay').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('cab-modal-overlay').style.display = 'none';
      editingCabId = null;
    }

    function updateSheetPreview() {
      var url = (document.getElementById('meta-sheet-url').value || '').trim();
      var el = document.getElementById('meta-sheet-preview');
      el.innerHTML = url ? '<a class="sheet-link" href="' + escHtml(url) + '" target="_blank" rel="noopener">Open sheet ↗</a>' : '';
    }

    document.getElementById('meta-sheet-url').addEventListener('input', updateSheetPreview);
    document.getElementById('cab-modal-overlay').addEventListener('click', function(e) {
      if (e.target.id === 'cab-modal-overlay') closeModal();
    });
    document.getElementById('meta-cancel').addEventListener('click', closeModal);
    document.getElementById('meta-save').addEventListener('click', function() {
      if (!editingCabId) return;
      var btn = document.getElementById('meta-save');
      btn.disabled = true; btn.textContent = 'Saving...';
      fetch('/api/cabinets/' + editingCabId + '/metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessories: document.getElementById('meta-accessories').value,
          notes: document.getElementById('meta-notes').value,
          assembly_sheet_url: document.getElementById('meta-sheet-url').value.trim()
        })
      }).then(function(r) { return r.json(); }).then(function(data) {
        btn.disabled = false; btn.textContent = 'Save';
        if (data.error) { alert(data.error); return; }
        closeModal();
        load();
      });
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
        QRCode.toDataURL(text, { width: 240, margin: 1 }, function(err, url) {
          var img = document.createElement('img');
          img.src = url; img.width = 120; img.height = 120;
          div.insertBefore(img, div.firstChild);
        });
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

    document.getElementById('print-station-btn').addEventListener('click', function() {
      if (typeof QRCode === 'undefined') return;
      var grid = document.getElementById('label-grid');
      var panel = document.getElementById('labels-panel');
      grid.innerHTML = '';
      panel.style.display = 'block';

      STATIONS.forEach(function(s) {
        var div = document.createElement('div');
        div.className = 'qr-label';
        QRCode.toDataURL('fw:sta:' + s.slug, { width: 240, margin: 1 }, function(err, url) {
          var img = document.createElement('img');
          img.src = url; img.width = 120; img.height = 120;
          div.insertBefore(img, div.firstChild);
        });
        var t = document.createElement('div');
        t.className = 'qr-title';
        t.textContent = s.name;
        div.appendChild(t);
        var sub = document.createElement('div');
        sub.className = 'qr-sub';
        sub.textContent = s.level.toUpperCase() + ' Station — ' + s.slug;
        div.appendChild(sub);
        grid.appendChild(div);
      });

      setTimeout(function() { window.print(); }, 300);
    });
`, user, "/dashboard", ["https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"], config);
}


export function progressPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page(`${config.entity_labels.l1} Progress`, `

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
  `, `
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
  `, user, "/dashboard", [], config);
}

