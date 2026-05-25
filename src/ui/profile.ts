import type { TenantConfig, SessionUser } from "../index";
import { page } from "./layout";

export function profilePage(config: TenantConfig, user: SessionUser): string {
  const stationOptions = config.stations.map(s =>
    `<option value="${s.slug}">${s.name}</option>`
  ).join('');

  return page("Profile", `
    main { gap: 14px; }
    .profile-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .profile-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .profile-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; flex-shrink: 0; }
    .profile-info h2 { font-size: 1.1rem; font-weight: 700; }
    .profile-info .role-badge { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(59,130,246,0.15); color: var(--accent); text-transform: capitalize; }
    .profile-info .member-since { font-size: 0.7rem; color: var(--muted); margin-top: 4px; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    .form-group input, .form-group select { width: 100%; padding: 10px 12px; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-family: inherit; box-sizing: border-box; }
    .form-group .hint { font-size: 0.68rem; color: var(--muted); margin-top: 3px; }
    .form-actions { display: flex; gap: 8px; margin-top: 18px; }
    .form-actions button { padding: 10px 20px; font-size: 0.85rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; }
    .btn-save { background: var(--accent); color: #fff; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100; }
    .toast.show { opacity: 1; }
    .toast-success { background: var(--success); color: #fff; }
    .toast-error { background: var(--danger, #e53e3e); color: #fff; }

    .qr-section { margin-top: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
    .qr-section h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; }
    .qr-section canvas { margin: 0 auto; }
    .qr-section .qr-hint { font-size: 0.7rem; color: var(--muted); margin-top: 8px; }
    .qr-print-btn { margin-top: 10px; padding: 8px 16px; font-size: 0.78rem; font-weight: 600; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); cursor: pointer; }
  `, `
  <main>
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar" id="avatar-circle"></div>
        <div class="profile-info">
          <h2 id="display-name"></h2>
          <span class="role-badge">${user.role}</span>
          <div class="member-since" id="member-since"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="field-name" value="">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="field-email" value="">
      </div>
      <div class="form-group">
        <label>New PIN</label>
        <input type="password" id="field-pin" placeholder="Leave blank to keep current">
        <div class="hint">Minimum 4 characters</div>
      </div>
      <div class="form-group">
        <label>Team</label>
        <input type="text" id="field-team" placeholder="e.g. Assembly Team A">
      </div>
      <div class="form-group">
        <label>Current Station</label>
        <select id="field-station">
          <option value="">None</option>
          ${stationOptions}
        </select>
      </div>
      <div class="form-actions">
        <button class="btn-save" id="save-btn" onclick="saveProfile()">Save Changes</button>
      </div>
    </div>

    <div class="qr-section">
      <h3>Quick Login QR</h3>
      <canvas id="qr-canvas"></canvas>
      <div class="qr-hint">Scan this at the login screen to auto-fill your email</div>
      <button class="qr-print-btn" onclick="window.print()">Print QR Badge</button>
    </div>

    <div class="profile-card" id="notif-section" style="display:none;margin-top:16px">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:8px">Push Notifications</h3>
      <p style="font-size:0.78rem;color:var(--muted);margin-bottom:12px" id="notif-status"></p>
      <button class="btn-save" id="notif-btn" onclick="toggleNotifications()" style="width:100%"></button>
    </div>

    <div class="toast" id="toast"></div>
  </main>
  `, `
    function showToast(msg, type) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show toast-' + type;
      setTimeout(function() { t.className = 'toast'; }, 2500);
    }

    function initials(name) {
      if (!name) return '?';
      return name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
    }

    fetch('/api/profile').then(function(r) { return r.json(); }).then(function(p) {
      document.getElementById('avatar-circle').textContent = initials(p.name);
      document.getElementById('display-name').textContent = p.name;
      document.getElementById('member-since').textContent = 'Member since ' + new Date(p.created_at + 'Z').toLocaleDateString();
      document.getElementById('field-name').value = p.name || '';
      document.getElementById('field-email').value = p.email || '';
      document.getElementById('field-team').value = p.team || '';
      var stationSel = document.getElementById('field-station');
      if (p.current_station) stationSel.value = p.current_station;

      if (typeof QRCode !== 'undefined' && p.email) {
        QRCode.toCanvas(document.getElementById('qr-canvas'), p.email, { width: 160, margin: 2 });
      }
    });

    function saveProfile() {
      var btn = document.getElementById('save-btn');
      btn.disabled = true;
      var body = {
        name: document.getElementById('field-name').value.trim(),
        email: document.getElementById('field-email').value.trim(),
        team: document.getElementById('field-team').value.trim(),
        current_station: document.getElementById('field-station').value,
      };
      var pin = document.getElementById('field-pin').value;
      if (pin) body.pin = pin;

      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(r) {
        btn.disabled = false;
        if (r.ok) {
          showToast('Profile updated', 'success');
          document.getElementById('field-pin').value = '';
          return r.json().then(function(p) {
            document.getElementById('avatar-circle').textContent = initials(p.name);
            document.getElementById('display-name').textContent = p.name;
          });
        } else {
          return r.json().then(function(e) { showToast(e.error || 'Save failed', 'error'); });
        }
      });
    }
    // --- Push Notifications ---
    var _pushSub = null;

    function urlBase64ToUint8Array(base64String) {
      var padding = '='.repeat((4 - base64String.length % 4) % 4);
      var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      var rawData = atob(base64);
      var outputArray = new Uint8Array(rawData.length);
      for (var i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
      return outputArray;
    }

    function initNotifUI() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      document.getElementById('notif-section').style.display = 'block';
      navigator.serviceWorker.ready.then(function(reg) {
        return reg.pushManager.getSubscription();
      }).then(function(sub) {
        _pushSub = sub;
        updateNotifUI();
      });
    }

    function updateNotifUI() {
      var btn = document.getElementById('notif-btn');
      var status = document.getElementById('notif-status');
      if (_pushSub) {
        btn.textContent = 'Disable Notifications';
        btn.style.background = 'var(--danger, #e53e3e)';
        status.textContent = 'Notifications are enabled on this device.';
      } else {
        btn.textContent = 'Enable Notifications';
        btn.style.background = 'var(--accent)';
        status.textContent = 'Get alerts for builds, FixIts, and flags.';
      }
    }

    function toggleNotifications() {
      if (_pushSub) {
        var endpoint = _pushSub.endpoint;
        _pushSub.unsubscribe().then(function() {
          fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: endpoint })
          });
          _pushSub = null;
          updateNotifUI();
          showToast('Notifications disabled', 'success');
        });
      } else {
        fetch('/api/push/vapid-key').then(function(r) { return r.json(); }).then(function(d) {
          return navigator.serviceWorker.ready.then(function(reg) {
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(d.publicKey)
            });
          });
        }).then(function(sub) {
          _pushSub = sub;
          var json = sub.toJSON();
          return fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
            })
          });
        }).then(function() {
          updateNotifUI();
          showToast('Notifications enabled!', 'success');
        }).catch(function(err) {
          if (Notification.permission === 'denied') {
            showToast('Notifications blocked by browser', 'error');
          } else {
            showToast('Could not enable notifications', 'error');
          }
        });
      }
    }

    initNotifUI();
  `, user, "/profile", ['https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js'], config);
}
