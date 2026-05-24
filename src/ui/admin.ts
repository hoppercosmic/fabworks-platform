import type { TenantConfig, SessionUser } from "../index";
import { page, SHARED_JS } from "./layout";

export function adminPage(config: TenantConfig, user: SessionUser): string {
  const ROLES: string[] = ["user", "lead", "supervisor", "admin"];
  const SHOP_TYPES: string[] = ["cabinet", "metal", "wood"];
  return page("Admin", `
    main { gap: 14px; }
    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); }
    .tab {
      padding: 10px 20px; font-size: 0.9rem; font-weight: 600; color: var(--muted);
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s;
    }
    .tab:hover { color: var(--text); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
    .user-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 14px; background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; margin-bottom: 8px;
    }
    .user-row .name { font-weight: 700; font-size: 0.95rem; }
    .user-row .email { font-size: 0.8rem; color: var(--muted); }
    .user-row .meta { display: flex; gap: 8px; align-items: center; }
    .user-row.inactive { opacity: 0.4; }
    .add-user-form { display: flex; flex-direction: column; gap: 10px; padding: 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; }
    .add-user-form .row { display: flex; gap: 8px; }
    .add-user-form .row input, .add-user-form .row select { flex: 1; padding: 10px; font-size: 0.9rem; }
    .edit-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200;
      display: none; align-items: center; justify-content: center; padding: 16px;
    }
    .edit-overlay.open { display: flex; }
    .edit-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
      padding: 20px; width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 12px;
    }
    .edit-card h3 { font-size: 1.1rem; margin-bottom: 4px; }
    .edit-card .field { display: flex; flex-direction: column; gap: 4px; }
    .edit-card .field input, .edit-card .field select { padding: 10px; font-size: 0.95rem; }
    .edit-card .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
    .config-field { margin-bottom: 14px; }
    .config-field .val { font-size: 1rem; font-weight: 600; color: var(--text); margin-top: 4px; }
    .config-labels { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .config-labels .field input { padding: 10px; font-size: 0.9rem; width: 100%; }
    .station-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .station-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
      font-size: 0.85rem;
    }
    .station-item .seq { color: var(--muted); font-size: 0.7rem; width: 24px; }
    .station-item .sname { font-weight: 600; flex: 1; }
    .station-item .slevel { font-size: 0.65rem; text-transform: uppercase; padding: 1px 5px; border-radius: 3px; }
    .slevel-l1 { background: rgba(59,130,246,0.15); color: var(--accent); }
    .slevel-l2 { background: rgba(34,197,94,0.15); color: var(--success); }
    .slevel-l3 { background: rgba(168,85,247,0.15); color: var(--purple); }
    .reset-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
    .reset-section .warn { font-size: 0.8rem; color: var(--warning); margin-bottom: 8px; }
    .reset-row { display: flex; gap: 8px; align-items: center; }
    .reset-row select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .msg { padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-align: center; display: none; margin-top: 8px; }
    .msg.success { display: block; background: rgba(34,197,94,0.15); border: 1px solid var(--success); color: var(--success); }
    .msg.error { display: block; background: rgba(239,68,68,0.15); border: 1px solid var(--error); color: var(--error); }
  `, `
  <main>
    <div class="tabs">
      <div class="tab active" data-tab="users">Users</div>
      <div class="tab" data-tab="config">Config</div>
    </div>

    <!-- Users Tab -->
    <div class="tab-panel active" id="panel-users">
      <div class="card">
        <label>Add User</label>
        <div class="add-user-form">
          <div class="row">
            <input type="text" id="new-name" placeholder="Name">
            <input type="text" id="new-email" placeholder="Email" autocapitalize="none">
          </div>
          <div class="row">
            <input type="text" id="new-pin" placeholder="PIN" inputmode="numeric">
            <select id="new-role">
              ${ROLES.map((r) => `<option value="${r}">${r}</option>`).join("")}
            </select>
          </div>
          <button class="btn btn-primary" id="add-user-btn" style="padding:12px;font-size:1rem">Add User</button>
          <div class="msg" id="add-msg"></div>
        </div>
      </div>
      <div class="card">
        <label>All Users</label>
        <div id="user-list"></div>
      </div>
    </div>

    <!-- Config Tab -->
    <div class="tab-panel" id="panel-config">
      <div class="card">
        <div class="config-field">
          <label>Shop Type</label>
          <div class="val" id="cfg-shop-type"></div>
        </div>
        <div class="config-field">
          <label>Entity Labels</label>
          <div class="config-labels">
            <div class="field">
              <label style="font-size:0.65rem">L1</label>
              <input type="text" id="cfg-l1">
            </div>
            <div class="field">
              <label style="font-size:0.65rem">L2</label>
              <input type="text" id="cfg-l2">
            </div>
            <div class="field">
              <label style="font-size:0.65rem">L3</label>
              <input type="text" id="cfg-l3">
            </div>
          </div>
        </div>
        <button class="btn btn-primary" id="save-labels-btn" style="padding:12px;font-size:1rem">Save Labels</button>
        <div class="msg" id="labels-msg"></div>

        <div class="config-field" style="margin-top:20px">
          <label>Stations (${config.stations.length})</label>
          <div class="station-list" id="station-list"></div>
        </div>

        <div class="config-field" style="margin-top:16px">
          <label>Terminal Status</label>
          <div class="val" id="cfg-terminal"></div>
        </div>

        <div class="reset-section">
          <label>Reset to Template</label>
          <div class="warn">This replaces all config (stations, labels, statuses) with the selected template.</div>
          <div class="reset-row">
            <select id="reset-type">
              ${SHOP_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("")}
            </select>
            <button class="btn btn-sm" id="reset-btn" style="background:var(--error);color:white">Reset Config</button>
          </div>
          <div class="msg" id="reset-msg"></div>
        </div>
      </div>
    </div>

    <!-- Edit User Overlay -->
    <div class="edit-overlay" id="edit-overlay">
      <div class="edit-card">
        <h3>Edit User</h3>
        <div class="field">
          <label>Name</label>
          <input type="text" id="edit-name">
        </div>
        <div class="field">
          <label>Email</label>
          <input type="text" id="edit-email" autocapitalize="none">
        </div>
        <div class="field">
          <label>New PIN (leave blank to keep)</label>
          <input type="text" id="edit-pin" placeholder="Leave blank to keep current" inputmode="numeric">
        </div>
        <div class="field">
          <label>Role</label>
          <select id="edit-role">
            ${ROLES.map((r) => `<option value="${r}">${r}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Home Screen</label>
          <select id="edit-home">
            <option value="scan">Scan</option>
            <option value="workbench">My Workbench</option>
            <option value="fixit">FixIt Queue</option>
            <option value="staging">Staging</option>
            <option value="dashboard">Dashboard</option>
          </select>
        </div>
        <div class="field">
          <label style="display:flex;align-items:center;gap:6px;text-transform:none;font-size:0.85rem">
            <input type="checkbox" id="edit-active" checked> Active
          </label>
        </div>
        <div class="msg" id="edit-msg"></div>
        <div class="actions">
          <button class="btn btn-sm" id="edit-cancel" style="background:var(--border);color:var(--text)">Cancel</button>
          <button class="btn btn-sm" id="edit-save" style="background:var(--accent);color:white">Save</button>
        </div>
      </div>
    </div>
  </main>
  `, `
    ${SHARED_JS}
    var editUserId = null;

    // --- Tabs ---
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      });
    });

    // --- Users ---
    function loadUsers() {
      fetch('/api/users').then(function(r) { return r.json(); }).then(function(users) {
        var list = document.getElementById('user-list');
        list.innerHTML = users.map(function(u) {
          var cls = u.active ? '' : ' inactive';
          return '<div class="user-row' + cls + '" data-uid="' + u.id + '" data-name="' + escHtml(u.name) + '" data-email="' + escHtml(u.email) + '" data-role="' + u.role + '" data-home="' + (u.home_page || 'scan') + '" data-active="' + u.active + '">' +
            '<div>' +
              '<div class="name">' + escHtml(u.name) + (!u.active ? ' <span style="color:var(--error);font-size:0.7rem">(disabled)</span>' : '') + '</div>' +
              '<div class="email">' + escHtml(u.email) + '</div>' +
            '</div>' +
            '<div class="meta">' +
              '<span class="pill pill-blue">' + u.role + '</span>' +
              '<button class="btn btn-sm edit-user-btn" style="background:var(--surface);border:1px solid var(--border);color:var(--text)">Edit</button>' +
            '</div>' +
          '</div>';
        }).join('') || '<div style="color:var(--muted);font-size:0.85rem">No users yet</div>';

        list.querySelectorAll('.edit-user-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var row = btn.closest('.user-row');
            editUserId = parseInt(row.dataset.uid);
            document.getElementById('edit-name').value = row.dataset.name;
            document.getElementById('edit-email').value = row.dataset.email;
            document.getElementById('edit-pin').value = '';
            document.getElementById('edit-role').value = row.dataset.role;
            document.getElementById('edit-home').value = row.dataset.home || 'scan';
            document.getElementById('edit-active').checked = row.dataset.active === '1';
            document.getElementById('edit-msg').className = 'msg';
            document.getElementById('edit-overlay').classList.add('open');
          });
        });
      });
    }

    document.getElementById('edit-cancel').addEventListener('click', function() {
      document.getElementById('edit-overlay').classList.remove('open');
    });

    document.getElementById('edit-overlay').addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('open');
    });

    document.getElementById('edit-save').addEventListener('click', function() {
      var body = {};
      var name = document.getElementById('edit-name').value.trim();
      var email = document.getElementById('edit-email').value.trim();
      var pin = document.getElementById('edit-pin').value.trim();
      var role = document.getElementById('edit-role').value;
      var active = document.getElementById('edit-active').checked;

      if (name) body.name = name;
      if (email) body.email = email;
      if (pin) body.pin = pin;
      body.role = role;
      body.home_page = document.getElementById('edit-home').value;
      body.active = active;

      var msgDiv = document.getElementById('edit-msg');
      fetch('/api/users/' + editUserId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          document.getElementById('edit-overlay').classList.remove('open');
          loadUsers();
        } else {
          msgDiv.className = 'msg error';
          msgDiv.textContent = r.data.error || 'Update failed';
        }
      });
    });

    document.getElementById('add-user-btn').addEventListener('click', function() {
      var name = document.getElementById('new-name').value.trim();
      var email = document.getElementById('new-email').value.trim();
      var pin = document.getElementById('new-pin').value.trim();
      var role = document.getElementById('new-role').value;
      var msgDiv = document.getElementById('add-msg');
      msgDiv.className = 'msg';

      if (!name || !email || !pin) {
        msgDiv.className = 'msg error';
        msgDiv.textContent = 'Name, email, and PIN are required';
        return;
      }

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, pin: pin, role: role }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          msgDiv.className = 'msg success';
          msgDiv.textContent = 'Created ' + r.data.name;
          document.getElementById('new-name').value = '';
          document.getElementById('new-email').value = '';
          document.getElementById('new-pin').value = '';
          loadUsers();
        } else {
          msgDiv.className = 'msg error';
          msgDiv.textContent = r.data.error || 'Failed to create user';
        }
      });
    });

    loadUsers();

    // --- Config ---
    function loadConfig() {
      fetch('/api/config').then(function(r) { return r.json(); }).then(function(cfg) {
        document.getElementById('cfg-shop-type').textContent = cfg.shop_type;
        document.getElementById('cfg-l1').value = cfg.entity_labels.l1;
        document.getElementById('cfg-l2').value = cfg.entity_labels.l2;
        document.getElementById('cfg-l3').value = cfg.entity_labels.l3;
        document.getElementById('cfg-terminal').textContent = cfg.l3_terminal_status;

        var stationList = document.getElementById('station-list');
        stationList.innerHTML = cfg.stations.map(function(s) {
          return '<div class="station-item">' +
            '<span class="seq">' + s.seq + '</span>' +
            '<span class="sname">' + s.name + '</span>' +
            '<span class="slevel slevel-' + s.level + '">' + s.level + '</span>' +
            (s.sets_status ? '<span style="font-size:0.65rem;color:var(--muted);margin-left:6px">\\u2192 ' + s.sets_status + '</span>' : '') +
          '</div>';
        }).join('');
      });
    }

    document.getElementById('save-labels-btn').addEventListener('click', function() {
      var l1 = document.getElementById('cfg-l1').value.trim();
      var l2 = document.getElementById('cfg-l2').value.trim();
      var l3 = document.getElementById('cfg-l3').value.trim();
      var msgDiv = document.getElementById('labels-msg');
      msgDiv.className = 'msg';

      if (!l1 || !l2 || !l3) {
        msgDiv.className = 'msg error';
        msgDiv.textContent = 'All labels are required';
        return;
      }

      fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_labels: { l1: l1, l2: l2, l3: l3 } }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          msgDiv.className = 'msg success';
          msgDiv.textContent = 'Labels saved';
        } else {
          msgDiv.className = 'msg error';
          msgDiv.textContent = r.data.error || 'Failed to save';
        }
      });
    });

    document.getElementById('reset-btn').addEventListener('click', function() {
      var shopType = document.getElementById('reset-type').value;
      var msgDiv = document.getElementById('reset-msg');
      msgDiv.className = 'msg';

      if (!confirm('Reset all config to "' + shopType + '" template? This replaces stations, labels, and statuses.')) return;

      fetch('/api/config/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_type: shopType }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          msgDiv.className = 'msg success';
          msgDiv.textContent = 'Reset to ' + shopType;
          loadConfig();
        } else {
          msgDiv.className = 'msg error';
          msgDiv.textContent = r.data.error || 'Reset failed';
        }
      });
    });

    loadConfig();
  `, user, "/admin", [], config);
}

// ─── Workbench (Build Timer) ─────────────────────────────
