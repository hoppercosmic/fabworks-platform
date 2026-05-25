import type { TenantConfig, SessionUser } from "../index";
import { page, displayStatusJS, STATUS_COLOR_JS, SHARED_JS, ROLE_LEVELS } from "./layout";

export function jobsManagerPage(config: TenantConfig, user: SessionUser): string {
  const L1 = config.entity_labels.l1;
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  const stationOptions = config.stations.map(s =>
    `<option value="${s.slug}">${s.name}</option>`
  ).join('');

  return page("Jobs Manager", `

    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 14px; }
    .tab-btn { padding: 10px 16px; font-size: 0.82rem; font-weight: 600; background: none; border: none; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .job-list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }
    .job-list-item:hover { border-color: var(--accent); }
    .job-list-item .left { display: flex; flex-direction: column; gap: 2px; }
    .job-list-item .job-num { font-weight: 700; font-size: 0.9rem; }
    .job-list-item .job-name { font-size: 0.78rem; color: var(--muted); }
    .job-list-item .right { display: flex; align-items: center; gap: 8px; }
    .job-list-item .cab-count { font-size: 0.72rem; color: var(--muted); }
    .job-list-item .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .job-list-item .status-dot.active { background: var(--success); }
    .job-list-item .status-dot.complete { background: var(--accent); }
    .job-list-item .status-dot.archived { background: var(--muted); }
    .search-bar { width: 100%; padding: 10px 14px; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-family: inherit; box-sizing: border-box; margin-bottom: 10px; }
    #create-panel, #edit-panel { display: none; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    .panel h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 12px; }
    .panel-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .panel-row label { display: block; font-size: 0.72rem; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 3px; }
    .panel-row .field { flex: 1; min-width: 120px; }
    .panel-row input, .panel-row select, .panel-row textarea { width: 100%; padding: 8px 10px; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); font-family: inherit; box-sizing: border-box; }
    .panel-row textarea { min-height: 60px; resize: vertical; }
    .panel-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .panel-actions button { padding: 8px 16px; font-size: 0.8rem; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-danger { background: var(--danger, #e53e3e); color: #fff; }
    .btn-secondary { background: var(--surface); border: 1px solid var(--border); color: var(--text); }
    .btn-success { background: var(--success); color: #fff; }
    .btn-warning { background: var(--warning, #f59e0b); color: #fff; }
    .cab-mgmt { margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px; }
    .cab-mgmt h4 { font-size: 0.8rem; font-weight: 700; margin-bottom: 8px; }
    .bulk-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
    .bulk-bar select, .bulk-bar button { padding: 6px 10px; font-size: 0.78rem; border-radius: 6px; }
    .cab-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    .cab-table th, .cab-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--border); }
    .cab-table th { color: var(--muted); font-weight: 600; text-transform: uppercase; font-size: 0.68rem; }
    .cab-table input[type="checkbox"] { width: 16px; height: 16px; }
    .cab-table .status-pill { font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100; }
    .toast.show { opacity: 1; }
    .toast-success { background: var(--success); color: #fff; }
    .toast-error { background: var(--danger, #e53e3e); color: #fff; }
    .empty-state { text-align: center; padding: 32px; color: var(--muted); font-size: 0.85rem; }
    .back-link { font-size: 0.8rem; color: var(--accent); cursor: pointer; margin-bottom: 10px; display: inline-block; }
  `, `
  <main>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h2 style="font-size:1.1rem;font-weight:700">${L1}s Manager</h2>
      <button class="btn-primary" style="padding:8px 14px;font-size:0.8rem;font-weight:600;border:none;border-radius:6px;cursor:pointer" onclick="showCreate()">+ New ${L1}</button>
    </div>

    <div id="create-panel" class="panel">
      <h3>Create ${L1}</h3>
      <div class="panel-row">
        <div class="field"><label>${L1} Number</label><input type="text" id="new-number" placeholder="3480" inputmode="numeric"></div>
        <div class="field"><label>${L1} Name</label><input type="text" id="new-name" placeholder="Muirfield Lot 10"></div>
        <div class="field"><label>${L3} Count</label><input type="number" id="new-count" placeholder="24" min="0"></div>
      </div>
      <div class="panel-actions">
        <button class="btn-primary" onclick="createJob()">Create</button>
        <button class="btn-secondary" onclick="hideCreate()">Cancel</button>
      </div>
    </div>

    <div id="list-view">
      <div class="tabs">
        <button class="tab-btn active" data-tab="active">Active</button>
        <button class="tab-btn" data-tab="complete">Complete</button>
        <button class="tab-btn" data-tab="archived">Archived</button>
      </div>
      <input type="text" class="search-bar" id="search" placeholder="Search ${L1.toLowerCase()}s...">
      <div id="job-list"></div>
    </div>

    <div id="edit-panel" style="display:none">
      <span class="back-link" onclick="backToList()">&larr; Back to list</span>
      <div class="panel">
        <h3 id="edit-title"></h3>
        <div class="panel-row">
          <div class="field"><label>${L1} Number</label><input type="text" id="edit-number"></div>
          <div class="field"><label>${L1} Name</label><input type="text" id="edit-name"></div>
          <div class="field"><label>Status</label>
            <select id="edit-status">
              <option value="active">Active</option>
              <option value="complete">Complete</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div class="panel-row">
          <div class="field"><label>${L3} Count (expected)</label><input type="number" id="edit-cab-count" min="0"></div>
        </div>
        <div class="panel-row">
          <div class="field" style="flex:2"><label>Finish Details</label><textarea id="edit-finish"></textarea></div>
        </div>
        <div class="panel-row">
          <div class="field" style="flex:2"><label>Engineering Notes</label><textarea id="edit-notes"></textarea></div>
        </div>
        <div class="panel-actions">
          <button class="btn-primary" onclick="saveJob()">Save Changes</button>
          <button class="btn-success" onclick="window.location.href='/job/'+editingJobId">Full Detail View</button>
          <button class="btn-danger" onclick="archiveJob()" id="archive-btn">Archive</button>
        </div>

        <div class="cab-mgmt">
          <h4>${L3} Management</h4>
          <div class="bulk-bar">
            <select id="bulk-action">
              <option value="">Bulk action...</option>
              <option value="status">Change status</option>
              <option value="reassign">Reassign ${L2.toLowerCase()}</option>
              <option value="delete">Delete selected</option>
            </select>
            <select id="bulk-status" style="display:none">
              ${config.l3_statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <select id="bulk-bucket" style="display:none"></select>
            <button class="btn-warning" onclick="applyBulk()" id="bulk-apply" style="display:none">Apply</button>
            <span style="margin-left:auto;font-size:0.72rem;color:var(--muted)" id="selected-count">0 selected</span>
          </div>
          <div style="overflow-x:auto">
            <table class="cab-table">
              <thead><tr><th><input type="checkbox" id="select-all"></th><th>#</th><th>Label</th><th>${L2}</th><th>Status</th></tr></thead>
              <tbody id="cab-tbody"></tbody>
            </table>
          </div>
          <div class="panel-actions" style="margin-top:10px">
            <button class="btn-secondary" onclick="showAddCabinets()">+ Add ${L3}s</button>
            <button class="btn-secondary" onclick="importCutList()">Import Cut List</button>
          </div>
          <div id="add-cabs-ui" style="display:none;margin-top:10px">
            <div class="panel-row">
              <div class="field"><label>Start #</label><input type="number" id="add-start" min="1" value="1"></div>
              <div class="field"><label>Count</label><input type="number" id="add-count" min="1" value="1"></div>
              <div class="field"><label>${L2} (optional)</label><select id="add-bucket"><option value="">None</option></select></div>
            </div>
            <button class="btn-primary" onclick="addCabinets()" style="font-size:0.78rem">Add</button>
          </div>
          <input type="file" id="import-file" accept=".csv" style="display:none">
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  </main>
  `, `
    ${SHARED_JS}
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var STATUSES = ${JSON.stringify(config.l3_statuses)};
    var USER_ROLE = ${JSON.stringify(user.role)};
    var IS_ADMIN = ${ROLE_LEVELS[user.role]} >= ${ROLE_LEVELS.admin};

    var currentTab = 'active';
    var allJobs = [];
    var editingJobId = null;
    var editingJob = null;
    var selectedCabs = {};

    function showToast(msg, type) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show toast-' + type;
      setTimeout(function() { t.className = 'toast'; }, 2500);
    }

    // --- Tab switching ---
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        renderList();
      });
    });

    // --- Search ---
    document.getElementById('search').addEventListener('input', function() { renderList(); });

    // --- Load jobs ---
    function loadJobs() {
      Promise.all([
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }),
        fetch('/api/jobs?status=complete').then(function(r) { return r.json(); }),
        fetch('/api/jobs?status=archived').then(function(r) { return r.json(); })
      ]).then(function(results) {
        allJobs = results[0].concat(results[1]).concat(results[2]);
        renderList();
      });
    }

    function renderList() {
      var query = document.getElementById('search').value.toLowerCase();
      var filtered = allJobs.filter(function(j) {
        if (j.status !== currentTab) return false;
        if (!query) return true;
        return (j.job_number + ' ' + j.job_name).toLowerCase().indexOf(query) !== -1;
      });

      var container = document.getElementById('job-list');
      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No ' + LABELS.l1.toLowerCase() + 's found</div>';
        return;
      }
      container.innerHTML = filtered.map(function(j) {
        return '<div class="job-list-item" onclick="openJob(' + j.id + ')">' +
          '<div class="left"><span class="job-num">' + escHtml(j.job_number) + '</span><span class="job-name">' + escHtml(j.job_name) + '</span></div>' +
          '<div class="right"><span class="cab-count">' + (j.cabinet_count || 0) + ' ' + LABELS.l3.toLowerCase() + 's</span>' +
          '<span class="status-dot ' + j.status + '"></span></div></div>';
      }).join('');
    }

    // --- Create job ---
    function showCreate() { document.getElementById('create-panel').style.display = 'block'; }
    function hideCreate() { document.getElementById('create-panel').style.display = 'none'; }

    function createJob() {
      var num = document.getElementById('new-number').value.trim();
      var name = document.getElementById('new-name').value.trim();
      var count = parseInt(document.getElementById('new-count').value) || 0;
      if (!num || !name) { showToast('Number and name required', 'error'); return; }

      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_number: num, job_name: name, cabinet_count: count })
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.error) { showToast(data.error, 'error'); return; }
        showToast('Created ' + data.job_number, 'success');
        document.getElementById('new-number').value = '';
        document.getElementById('new-name').value = '';
        document.getElementById('new-count').value = '';
        hideCreate();
        loadJobs();
      });
    }

    // --- Open job for editing ---
    function openJob(id) {
      editingJobId = id;
      document.getElementById('list-view').style.display = 'none';
      document.getElementById('create-panel').style.display = 'none';
      document.getElementById('edit-panel').style.display = 'block';

      fetch('/api/jobs/' + id).then(function(r) { return r.json(); }).then(function(job) {
        editingJob = job;
        document.getElementById('edit-title').textContent = job.job_number + ' ' + job.job_name;
        document.getElementById('edit-number').value = job.job_number;
        document.getElementById('edit-name').value = job.job_name;
        document.getElementById('edit-status').value = job.status;
        document.getElementById('edit-cab-count').value = job.cabinet_count || 0;
        document.getElementById('edit-finish').value = job.finish_details || '';
        document.getElementById('edit-notes').value = job.engineering_notes || '';
        document.getElementById('archive-btn').style.display = job.status === 'archived' ? 'none' : '';
        renderCabTable();
        populateBucketSelects();
      });
    }

    function backToList() {
      document.getElementById('edit-panel').style.display = 'none';
      document.getElementById('list-view').style.display = 'block';
      editingJobId = null;
      editingJob = null;
      loadJobs();
    }

    // --- Save job ---
    function saveJob() {
      var body = {
        job_number: document.getElementById('edit-number').value.trim(),
        job_name: document.getElementById('edit-name').value.trim(),
        cabinet_count: parseInt(document.getElementById('edit-cab-count').value) || 0,
        status: document.getElementById('edit-status').value,
        finish_details: document.getElementById('edit-finish').value,
        engineering_notes: document.getElementById('edit-notes').value
      };
      fetch('/api/jobs/' + editingJobId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.error) { showToast(data.error, 'error'); return; }
        showToast('Saved', 'success');
        document.getElementById('edit-title').textContent = data.job_number + ' ' + data.job_name;
      });
    }

    function archiveJob() {
      if (!confirm('Archive this ' + LABELS.l1.toLowerCase() + '? It can be restored later.')) return;
      fetch('/api/jobs/' + editingJobId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      }).then(function() {
        showToast('Archived', 'success');
        backToList();
      });
    }

    // --- Cabinet table ---
    function renderCabTable() {
      if (!editingJob) return;
      selectedCabs = {};
      updateSelectedCount();
      var tbody = document.getElementById('cab-tbody');
      if (!editingJob.cabinets || editingJob.cabinets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px">No ' + LABELS.l3.toLowerCase() + 's yet</td></tr>';
        return;
      }
      var bucketMap = {};
      (editingJob.buckets || []).forEach(function(b) { bucketMap[b.id] = b.name; });

      tbody.innerHTML = editingJob.cabinets.map(function(c) {
        return '<tr><td><input type="checkbox" data-id="' + c.id + '" class="cab-check"></td>' +
          '<td>' + c.cabinet_number + '</td>' +
          '<td>' + escHtml(c.label || '') + '</td>' +
          '<td>' + escHtml(bucketMap[c.bucket_id] || '—') + '</td>' +
          '<td><span class="status-pill" style="background:rgba(59,130,246,0.12);color:var(--accent)">' + displayStatus(c.status) + '</span></td></tr>';
      }).join('');

      document.querySelectorAll('.cab-check').forEach(function(cb) {
        cb.addEventListener('change', function() {
          var id = cb.dataset.id;
          if (cb.checked) selectedCabs[id] = true;
          else delete selectedCabs[id];
          updateSelectedCount();
        });
      });
    }

    document.getElementById('select-all').addEventListener('change', function() {
      var checked = this.checked;
      document.querySelectorAll('.cab-check').forEach(function(cb) {
        cb.checked = checked;
        var id = cb.dataset.id;
        if (checked) selectedCabs[id] = true;
        else delete selectedCabs[id];
      });
      updateSelectedCount();
    });

    function updateSelectedCount() {
      var count = Object.keys(selectedCabs).length;
      document.getElementById('selected-count').textContent = count + ' selected';
      document.getElementById('bulk-apply').style.display = count > 0 ? '' : 'none';
    }

    // --- Bulk action UI ---
    document.getElementById('bulk-action').addEventListener('change', function() {
      var val = this.value;
      document.getElementById('bulk-status').style.display = val === 'status' ? '' : 'none';
      document.getElementById('bulk-bucket').style.display = val === 'reassign' ? '' : 'none';
      document.getElementById('bulk-apply').style.display = Object.keys(selectedCabs).length > 0 ? '' : 'none';
    });

    function applyBulk() {
      var ids = Object.keys(selectedCabs).map(Number);
      if (ids.length === 0) return;
      var action = document.getElementById('bulk-action').value;

      if (action === 'status') {
        var status = document.getElementById('bulk-status').value;
        fetch('/api/cabinets/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: ids, status: status })
        }).then(function(r) { return r.json(); }).then(function(data) {
          if (data.error) { showToast(data.error, 'error'); return; }
          showToast(data.updated + ' updated', 'success');
          openJob(editingJobId);
        });
      } else if (action === 'reassign') {
        var bucketId = document.getElementById('bulk-bucket').value || null;
        fetch('/api/cabinets/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: ids, bucket_id: bucketId ? parseInt(bucketId) : null })
        }).then(function(r) { return r.json(); }).then(function(data) {
          if (data.error) { showToast(data.error, 'error'); return; }
          showToast(data.updated + ' reassigned', 'success');
          openJob(editingJobId);
        });
      } else if (action === 'delete') {
        if (!confirm('Delete ' + ids.length + ' ' + LABELS.l3.toLowerCase() + '(s)? This cannot be undone.')) return;
        fetch('/api/cabinets/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: ids })
        }).then(function(r) { return r.json(); }).then(function(data) {
          if (data.error) { showToast(data.error, 'error'); return; }
          showToast(data.deleted + ' deleted', 'success');
          openJob(editingJobId);
        });
      }
    }

    // --- Add cabinets ---
    function showAddCabinets() {
      var ui = document.getElementById('add-cabs-ui');
      ui.style.display = ui.style.display === 'none' ? 'block' : 'none';
      if (editingJob && editingJob.cabinets.length > 0) {
        var maxNum = Math.max.apply(null, editingJob.cabinets.map(function(c) { return c.cabinet_number; }));
        document.getElementById('add-start').value = maxNum + 1;
      }
    }

    function addCabinets() {
      var start = parseInt(document.getElementById('add-start').value) || 1;
      var count = parseInt(document.getElementById('add-count').value) || 1;
      var bucketId = document.getElementById('add-bucket').value || null;
      var promises = [];
      for (var i = 0; i < count; i++) {
        promises.push(fetch('/api/jobs/' + editingJobId + '/cabinets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cabinet_number: start + i, bucket_id: bucketId ? parseInt(bucketId) : undefined })
        }));
      }
      Promise.all(promises).then(function() {
        showToast(count + ' added', 'success');
        document.getElementById('add-cabs-ui').style.display = 'none';
        openJob(editingJobId);
      });
    }

    // --- Import cut list ---
    function importCutList() {
      document.getElementById('import-file').click();
    }

    document.getElementById('import-file').addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var fd = new FormData();
      fd.append('file', file);
      fetch('/api/jobs/' + editingJobId + '/import', { method: 'POST', body: fd })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.error) { showToast(data.error, 'error'); return; }
          showToast(data.imported + ' imported (' + data.created + ' new)', 'success');
          openJob(editingJobId);
        });
      this.value = '';
    });

    function populateBucketSelects() {
      var opts = '<option value="">None</option>';
      if (editingJob && editingJob.buckets) {
        opts += editingJob.buckets.map(function(b) { return '<option value="' + b.id + '">' + escHtml(b.name) + '</option>'; }).join('');
      }
      document.getElementById('add-bucket').innerHTML = opts;
      document.getElementById('bulk-bucket').innerHTML = opts;
    }

    loadJobs();
  `, user, "/jobs", [], config);
}
