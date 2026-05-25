import type { TenantConfig, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS, SHARED_JS, ROLE_LEVELS } from "./layout";

export function cabinetDetailPage(config: TenantConfig, user: SessionUser): string {
  const L3 = config.entity_labels.l3;
  const isLead = ROLE_LEVELS[user.role] >= ROLE_LEVELS.lead;
  const propsConfig = JSON.stringify(config.part_properties || []);

  return page(`${L3} Detail`, `
    main { gap: 12px; }
    .detail-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { color: var(--accent); text-decoration: none; font-size: 1.2rem; font-weight: 700; flex-shrink: 0; }
    .cab-title { font-size: 1.1rem; font-weight: 700; flex: 1; }
    .cab-job { font-size: 0.75rem; color: var(--muted); }
    .status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-pill.pending { background: rgba(250,204,21,0.15); color: #facc15; }
    .status-pill.in_progress, .status-pill.assembling { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-pill.staged, .status-pill.complete, .status-pill.assembled, .status-pill.inspected, .status-pill.packed, .status-pill.shipped { background: rgba(34,197,94,0.15); color: #22c55e; }
    .flag-badge { padding: 3px 8px; border-radius: 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: rgba(239,68,68,0.12); color: var(--error); }
    .flag-badge.priority { background: rgba(168,85,247,0.12); color: var(--purple); }

    .prop-group { margin-top: 4px; }
    .prop-group-title { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .prop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
    .prop-item { display: flex; flex-direction: column; }
    .prop-label { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
    .prop-value { font-size: 0.9rem; font-weight: 600; }
    .prop-value.empty { color: var(--muted); font-style: italic; font-weight: 400; }

    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: var(--muted); font-size: 0.75rem; }
    .info-value { font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }
    .info-value a { color: var(--accent); text-decoration: none; }

    .history-section h3 { font-size: 0.75rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
    .timeline { display: flex; flex-direction: column; gap: 4px; }
    .timeline-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; padding: 4px 0; }
    .timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    .timeline-dot.build { background: var(--success); }
    .timeline-dot.fixit { background: var(--error); }
    .timeline-meta { color: var(--muted); font-size: 0.7rem; margin-left: auto; white-space: nowrap; }

    .edit-btn { background: none; border: 1px solid var(--border); color: var(--accent); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; cursor: pointer; }
    .edit-btn:active { background: rgba(59,130,246,0.1); }
    .edit-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; align-items: center; justify-content: center; padding: 16px; }
    .edit-overlay.open { display: flex; }
    .edit-panel { background: var(--surface); border-radius: 12px; padding: 20px; width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto; }
    .edit-panel h3 { font-size: 0.9rem; margin-bottom: 12px; }
    .edit-field { margin-bottom: 12px; }
    .edit-field label { font-size: 0.7rem; margin-bottom: 4px; }
    .edit-field input, .edit-field select, .edit-field textarea { width: 100%; padding: 10px; font-size: 0.9rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); }
    .edit-field textarea { min-height: 60px; resize: vertical; }
    .edit-actions { display: flex; gap: 8px; margin-top: 14px; }
    .edit-actions button { flex: 1; padding: 10px; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; }
    .edit-save { background: var(--accent); color: white; }
    .edit-cancel { background: var(--bg); color: var(--text); border: 1px solid var(--border) !important; }
  `, `
  <main>
    <div id="loading" class="card" style="text-align:center;padding:2rem;color:var(--muted)">Loading...</div>
    <div id="detail" style="display:none"></div>
    <div class="edit-overlay" id="edit-overlay">
      <div class="edit-panel" id="edit-panel"></div>
    </div>
  </main>
  `, `
    ${SHARED_JS}
    ${stationNamesJS(config)}
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}
    var PART_PROPS = ${propsConfig};
    var IS_LEAD = ${isLead};
    var cabinetId = parseInt(location.pathname.split('/').pop());
    var cabData = null;

    fetch('/api/cabinets/' + cabinetId).then(function(r) { return r.json(); }).then(function(data) {
      if (data.error) {
        document.getElementById('loading').innerHTML = data.error;
        return;
      }
      cabData = data;
      try { render(data); } catch(e) {
        document.getElementById('loading').innerHTML = 'Error: ' + e.message;
        console.error('Cabinet render error:', e);
      }
    }).catch(function(e) {
      document.getElementById('loading').innerHTML = 'Load failed: ' + e.message;
    });

    function render(data) {
      var cab = data.cabinet;
      var props = {};
      try { props = JSON.parse(cab.properties || '{}'); } catch(e) {}
      var flags = [];
      try { flags = JSON.parse(cab.flags || '[]'); } catch(e) {}

      var html = '';

      // Header
      html += '<div class="detail-header">';
      html += '<a class="back-btn" href="/job/' + cab.job_id + '">←</a>';
      html += '<div><div class="cab-title">${L3} #' + cab.cabinet_number + (cab.label ? ' — ' + escHtml(cab.label) : '') + '</div>';
      html += '<div class="cab-job">' + escHtml(data.job.job_number) + ' ' + escHtml(data.job.job_name) + (data.bucket ? ' / ' + escHtml(data.bucket.name) : '') + '</div></div>';
      html += '</div>';

      // Status + flags
      html += '<div class="status-row">';
      html += '<span class="status-pill ' + cab.status + '">' + displayStatus(cab.status) + '</span>';
      flags.forEach(function(f) {
        html += '<span class="flag-badge' + (f === 'priority' ? ' priority' : '') + '">' + f.replace(/_/g, ' ') + '</span>';
      });
      if (IS_LEAD) html += '<button class="edit-btn" onclick="openEdit(\\'flags\\')">Edit</button>';
      html += '</div>';

      // Properties grouped
      var groups = {};
      PART_PROPS.forEach(function(p) {
        var g = p.group || 'Other';
        if (!groups[g]) groups[g] = [];
        groups[g].push(p);
      });
      var hasProps = Object.keys(props).length > 0 || PART_PROPS.length > 0;
      if (hasProps) {
        Object.keys(groups).forEach(function(gName) {
          html += '<div class="card prop-group">';
          html += '<div class="prop-group-title">' + escHtml(gName);
          if (IS_LEAD) html += ' <button class="edit-btn" onclick="openEdit(\\'props\\', \\'' + gName + '\\')">Edit</button>';
          html += '</div>';
          html += '<div class="prop-grid">';
          groups[gName].forEach(function(p) {
            var val = props[p.key];
            var display = val != null && val !== '' ? escHtml(String(val)) + (p.unit ? ' ' + p.unit : '') : '';
            html += '<div class="prop-item"><span class="prop-label">' + escHtml(p.label) + '</span>';
            html += '<span class="prop-value' + (display ? '' : ' empty') + '">' + (display || '—') + '</span></div>';
          });
          html += '</div></div>';
        });
      }

      // Info section (existing metadata)
      html += '<div class="card">';
      if (cab.assembly_sheet_url) {
        html += '<div class="info-row"><span class="info-label">Assembly Sheet</span><span class="info-value"><a href="' + escHtml(cab.assembly_sheet_url) + '" target="_blank">View →</a></span></div>';
      }
      if (cab.accessories) {
        html += '<div class="info-row"><span class="info-label">Accessories</span><span class="info-value">' + escHtml(cab.accessories) + '</span></div>';
      }
      if (cab.notes) {
        html += '<div class="info-row"><span class="info-label">Notes</span><span class="info-value">' + escHtml(cab.notes) + '</span></div>';
      }
      if (cab.staging_location) {
        html += '<div class="info-row"><span class="info-label">Staging Location</span><span class="info-value">' + escHtml(cab.staging_location) + '</span></div>';
      }
      if (!cab.assembly_sheet_url && !cab.accessories && !cab.notes && !cab.staging_location) {
        html += '<div style="color:var(--muted);font-size:0.8rem;font-style:italic">No metadata yet</div>';
      }
      if (IS_LEAD) html += '<div style="margin-top:8px"><button class="edit-btn" onclick="openEdit(\\'metadata\\')">Edit Metadata</button></div>';
      html += '</div>';

      // QR Code
      var qrLabel = '${L3} #' + cab.cabinet_number + (cab.label ? ' — ' + escHtml(cab.label) : '');
      var qrSub = data.job.job_number + ' ' + escHtml(data.job.job_name);
      html += '<div class="card" style="text-align:center">';
      html += '<h3 style="font-size:0.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">Quick QR</h3>';
      html += '<canvas id="cab-qr-canvas"></canvas>';
      html += '<div style="font-size:0.8rem;font-weight:600;margin-top:6px">' + qrLabel + '</div>';
      html += '<div style="font-size:0.7rem;color:var(--muted)">' + qrSub + '</div>';
      html += '<button class="edit-btn" style="margin-top:10px" onclick="window.print()">Print</button>';
      html += '</div>';

      // History
      html += '<div class="card history-section">';
      html += '<h3>History</h3><div class="timeline">';
      if (data.build_sessions && data.build_sessions.length > 0) {
        data.build_sessions.forEach(function(bs) {
          var dur = bs.completed_at ? fmtMin(Math.round(((new Date(bs.completed_at + 'Z') - new Date(bs.started_at + 'Z')) / 60000) - (bs.total_paused_seconds || 0) / 60)) : 'in progress';
          html += '<div class="timeline-item"><span class="timeline-dot build"></span>';
          html += '<span>Build' + (bs.user_name ? ' by ' + escHtml(bs.user_name) : '') + ' — ' + dur + '</span>';
          html += '<span class="timeline-meta">' + timeAgo(new Date(bs.started_at + 'Z')) + '</span></div>';
        });
      }
      if (data.fixit_requests && data.fixit_requests.length > 0) {
        data.fixit_requests.forEach(function(fr) {
          html += '<div class="timeline-item"><span class="timeline-dot fixit"></span>';
          html += '<span>FixIt: ' + escHtml(fr.root_cause.replace(/_/g, ' ')) + (fr.status === 'resolved' ? ' ✓' : '') + '</span>';
          html += '<span class="timeline-meta">' + timeAgo(new Date(fr.created_at + 'Z')) + '</span></div>';
        });
      }
      if (data.scans && data.scans.length > 0) {
        data.scans.forEach(function(s) {
          var sName = STATION_NAMES[s.station] || s.station;
          html += '<div class="timeline-item"><span class="timeline-dot"></span>';
          html += '<span>' + escHtml(sName) + (s.scanned_by ? ' — ' + escHtml(s.scanned_by) : '') + '</span>';
          html += '<span class="timeline-meta">' + timeAgo(new Date(s.scanned_at + 'Z')) + '</span></div>';
        });
      }
      if ((!data.scans || !data.scans.length) && (!data.build_sessions || !data.build_sessions.length)) {
        html += '<div style="color:var(--muted);font-size:0.8rem;font-style:italic">No history yet</div>';
      }
      html += '</div></div>';

      document.getElementById('loading').style.display = 'none';
      document.getElementById('detail').style.display = 'block';
      document.getElementById('detail').innerHTML = html;

      // Render QR code (fw:build command for quick-start scanning)
      var qrCode = 'fw:build:' + data.job.job_number + '-' + cab.cabinet_number;
      function renderCabQR() {
        var canvas = document.getElementById('cab-qr-canvas');
        if (!canvas) return;
        if (typeof QRCode !== 'undefined') {
          QRCode.toCanvas(canvas, qrCode, { width: 160, margin: 1 });
        } else {
          var s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
          s.onload = function() { QRCode.toCanvas(canvas, qrCode, { width: 160, margin: 1 }); };
          document.head.appendChild(s);
        }
      }
      renderCabQR();
    }

    function openEdit(section, group) {
      var panel = document.getElementById('edit-panel');
      var cab = cabData.cabinet;
      var props = {};
      try { props = JSON.parse(cab.properties || '{}'); } catch(e) {}
      var html = '';

      if (section === 'props') {
        var groupProps = PART_PROPS.filter(function(p) { return (p.group || 'Other') === group; });
        html += '<h3>Edit ' + escHtml(group) + '</h3>';
        groupProps.forEach(function(p) {
          html += '<div class="edit-field"><label>' + escHtml(p.label) + (p.unit ? ' (' + p.unit + ')' : '') + '</label>';
          var val = props[p.key] != null ? props[p.key] : '';
          if (p.type === 'select' && p.options) {
            html += '<select data-key="' + p.key + '">';
            html += '<option value="">—</option>';
            p.options.forEach(function(o) {
              html += '<option' + (val == o ? ' selected' : '') + '>' + escHtml(o) + '</option>';
            });
            html += '</select>';
          } else if (p.type === 'number') {
            html += '<input type="number" step="any" data-key="' + p.key + '" value="' + escHtml(String(val)) + '">';
          } else {
            html += '<input type="text" data-key="' + p.key + '" value="' + escHtml(String(val)) + '">';
          }
          html += '</div>';
        });
        html += '<div class="edit-actions"><button class="edit-cancel" onclick="closeEdit()">Cancel</button><button class="edit-save" onclick="saveProps()">Save</button></div>';
      } else if (section === 'metadata') {
        html += '<h3>Edit Metadata</h3>';
        html += '<div class="edit-field"><label>Accessories</label><textarea id="ed-acc">' + escHtml(cab.accessories || '') + '</textarea></div>';
        html += '<div class="edit-field"><label>Notes</label><textarea id="ed-notes">' + escHtml(cab.notes || '') + '</textarea></div>';
        html += '<div class="edit-field"><label>Assembly Sheet URL</label><input type="text" id="ed-sheet" value="' + escHtml(cab.assembly_sheet_url || '') + '"></div>';
        html += '<div class="edit-field"><label>Staging Location</label><input type="text" id="ed-loc" value="' + escHtml(cab.staging_location || '') + '"></div>';
        html += '<div class="edit-actions"><button class="edit-cancel" onclick="closeEdit()">Cancel</button><button class="edit-save" onclick="saveMeta()">Save</button></div>';
      } else if (section === 'flags') {
        var flags = [];
        try { flags = JSON.parse(cab.flags || '[]'); } catch(e) {}
        var allFlags = ['hold', 'remake', 'missing_part', 'priority'];
        html += '<h3>Edit Flags</h3>';
        allFlags.forEach(function(f) {
          var checked = flags.indexOf(f) >= 0 ? ' checked' : '';
          html += '<label style="display:flex;align-items:center;gap:8px;padding:8px 0;font-size:0.9rem;text-transform:capitalize;cursor:pointer"><input type="checkbox" data-flag="' + f + '"' + checked + '> ' + f.replace(/_/g, ' ') + '</label>';
        });
        html += '<div class="edit-actions"><button class="edit-cancel" onclick="closeEdit()">Cancel</button><button class="edit-save" onclick="saveFlags()">Save</button></div>';
      }

      panel.innerHTML = html;
      document.getElementById('edit-overlay').classList.add('open');
    }

    function closeEdit() {
      document.getElementById('edit-overlay').classList.remove('open');
    }

    function saveProps() {
      var updates = {};
      document.querySelectorAll('#edit-panel [data-key]').forEach(function(el) {
        var key = el.dataset.key;
        var val = el.value.trim();
        var propDef = PART_PROPS.find(function(p) { return p.key === key; });
        if (propDef && propDef.type === 'number' && val !== '') val = parseFloat(val);
        if (val === '' || val === null) val = null;
        updates[key] = val;
      });
      fetch('/api/cabinets/' + cabinetId + '/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: updates }),
      }).then(function(r) { return r.json(); }).then(function(d) {
        if (d.ok) {
          cabData.cabinet.properties = JSON.stringify(d.properties);
          closeEdit();
          render(cabData);
        }
      });
    }

    function saveMeta() {
      var acc = document.getElementById('ed-acc').value.trim();
      var notes = document.getElementById('ed-notes').value.trim();
      var sheet = document.getElementById('ed-sheet').value.trim();
      var loc = document.getElementById('ed-loc').value.trim();
      Promise.all([
        fetch('/api/cabinets/' + cabinetId + '/metadata', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessories: acc, notes: notes, assembly_sheet_url: sheet }),
        }),
        fetch('/api/cabinets/' + cabinetId + '/location', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: loc }),
        }),
      ]).then(function() {
        cabData.cabinet.accessories = acc;
        cabData.cabinet.notes = notes;
        cabData.cabinet.assembly_sheet_url = sheet;
        cabData.cabinet.staging_location = loc;
        closeEdit();
        render(cabData);
      });
    }

    function saveFlags() {
      var newFlags = [];
      document.querySelectorAll('#edit-panel [data-flag]').forEach(function(el) {
        if (el.checked) newFlags.push(el.dataset.flag);
      });
      var currentFlags = [];
      try { currentFlags = JSON.parse(cabData.cabinet.flags || '[]'); } catch(e) {}
      var promises = [];
      var allFlags = ['hold', 'remake', 'missing_part', 'priority'];
      allFlags.forEach(function(f) {
        var had = currentFlags.indexOf(f) >= 0;
        var has = newFlags.indexOf(f) >= 0;
        if (has && !had) {
          promises.push(fetch('/api/cabinets/' + cabinetId + '/flag', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flag: f, action: 'add' }),
          }));
        } else if (!has && had) {
          promises.push(fetch('/api/cabinets/' + cabinetId + '/flag', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flag: f, action: 'remove' }),
          }));
        }
      });
      Promise.all(promises).then(function() {
        cabData.cabinet.flags = JSON.stringify(newFlags);
        closeEdit();
        render(cabData);
      });
    }

    document.getElementById('edit-overlay').addEventListener('click', function(e) {
      if (e.target === this) closeEdit();
    });
  `, user, "/cabinet", ['https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'], config);
}
