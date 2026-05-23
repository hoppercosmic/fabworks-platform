import type { TenantConfig, SessionUser, UserRole } from "./index";

// ─── Inline SVG Icons (24x24, outlined) ──────────────────
const IC = (d: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SVG_SCAN = IC('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>');
const SVG_PLUS = IC('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>');
const SVG_CHART = IC('<rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>');
const SVG_GRID = IC('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>');
const SVG_TREND = IC('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>');
const SVG_CLOCK = IC('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 14.5"/>');
const SVG_GEAR = IC('<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>');
const SVG_WRENCH = IC('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94L6.73 20.15a2.12 2.12 0 0 1-3-3l6.79-6.79A6 6 0 0 1 18.5 2.5z"/>');
const SVG_ALERT = IC('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>');

// ─── Nav Items ───────────────────────────────────────────
const ROLE_LEVELS: Record<UserRole, number> = { user: 0, lead: 1, supervisor: 2, admin: 3 };

type NavItem = { path: string; label: string; icon: string; minRole: UserRole };
const NAV_ITEMS: NavItem[] = [
  { path: "/",           label: "Home",      icon: IC('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'), minRole: "user" },
  { path: "/scan",       label: "Scan",      icon: SVG_SCAN,  minRole: "user" },
  { path: "/workbench",  label: "Build",     icon: SVG_WRENCH, minRole: "user" },
  { path: "/jobs/new",   label: "New Job",   icon: SVG_PLUS,  minRole: "admin" },
  { path: "/dashboard",  label: "Dash",      icon: SVG_CHART, minRole: "user" },
  { path: "/stations",   label: "Stations",  icon: SVG_GRID,  minRole: "user" },
  { path: "/fixit",      label: "FixIt",     icon: SVG_ALERT, minRole: "user" },
  { path: "/kpi",        label: "KPI",       icon: SVG_TREND, minRole: "lead" },
  { path: "/takt",       label: "Takt",      icon: SVG_CLOCK, minRole: "lead" },
  { path: "/admin",      label: "Admin",     icon: SVG_GEAR,  minRole: "admin" },
];

function renderNav(currentPath: string, user: SessionUser): string {
  const userLevel = ROLE_LEVELS[user.role];
  return NAV_ITEMS
    .filter((item) => userLevel >= ROLE_LEVELS[item.minRole])
    .map((item) => {
      const active = item.path === currentPath;
      return `<a href="${item.path}" class="nav-item${active ? " active" : ""}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span></a>`;
    }).join("");
}

// ─── Shared Styles ───────────────────────────────────────
const SHARED_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --border: #334155;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #3b82f6;
      --success: #22c55e;
      --error: #ef4444;
      --warning: #f59e0b;
      --purple: #a855f7;
      --nav-h: 62px;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding-top: calc(var(--nav-h) + 44px);
    }
    .top-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 0 4px;
      padding-top: env(safe-area-inset-top);
      height: var(--nav-h);
    }
    .top-nav::-webkit-scrollbar { display: none; }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-width: 64px; padding: 6px 12px 4px;
      color: var(--muted); text-decoration: none; flex-shrink: 0;
      -webkit-tap-highlight-color: transparent; transition: color 0.15s;
    }
    .nav-item.active { color: var(--accent); }
    .nav-icon { width: 24px; height: 24px; }
    .nav-icon svg { width: 24px; height: 24px; }
    .nav-label { font-size: 0.6rem; font-weight: 600; margin-top: 2px; letter-spacing: 0.02em; }
    .page-header {
      position: fixed; top: var(--nav-h); left: 0; right: 0; z-index: 99;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 8px 16px;
      display: flex; align-items: center; justify-content: space-between;
      height: 44px;
    }
    .page-header h1 { font-size: 1.1rem; font-weight: 700; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--accent); color: white;
      font-weight: 700; font-size: 0.9rem; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .user-menu { position: relative; }
    .user-dropdown {
      display: none; position: absolute; right: 0; top: 100%; margin-top: 4px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      min-width: 160px; z-index: 150; overflow: hidden;
    }
    .user-dropdown.open { display: block; }
    .user-dropdown .ud-info { padding: 12px 14px; border-bottom: 1px solid var(--border); }
    .user-dropdown .ud-name { font-weight: 700; font-size: 0.9rem; }
    .user-dropdown .ud-role { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .user-dropdown a { display: block; padding: 12px 14px; color: var(--text); text-decoration: none; font-size: 0.85rem; }
    .user-dropdown a:hover { background: var(--bg); }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    input[type="text"], input[type="number"], select {
      width: 100%;
      padding: 12px;
      font-size: 1.125rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      outline: none;
    }
    input:focus, select:focus { border-color: var(--accent); }
    input::placeholder { color: #475569; }
    .btn {
      padding: 12px 20px;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--accent); color: white; width: 100%; padding: 16px; font-size: 1.25rem; border-radius: 12px; }
    .btn-success { background: var(--success); color: white; width: 100%; padding: 16px; font-size: 1.25rem; border-radius: 12px; }
    .btn-sm { padding: 8px 14px; font-size: 0.8rem; border-radius: 8px; }
    .result {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      display: none;
    }
    .result.success { display: block; background: rgba(34,197,94,0.15); border: 1px solid var(--success); color: var(--success); }
    .result.error { display: block; background: rgba(239,68,68,0.15); border: 1px solid var(--error); color: var(--error); }
    .result .detail { font-weight: 400; font-size: 0.875rem; margin-top: 4px; color: var(--muted); }
    .pill {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .pill-blue { background: rgba(59,130,246,0.15); color: var(--accent); }
    .pill-green { background: rgba(34,197,94,0.15); color: var(--success); }
    .pill-yellow { background: rgba(245,158,11,0.15); color: var(--warning); }
    .pill-purple { background: rgba(168,85,247,0.15); color: var(--purple); }
    .qr-fab {
      position: fixed; z-index: 180;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--accent); color: white; border: none; cursor: grab;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .qr-fab:active { transform: scale(0.95); }
    .qr-fab.dragging { cursor: grabbing; box-shadow: 0 8px 24px rgba(0,0,0,0.5); transform: scale(1.08); }
    .qr-fab svg { width: 28px; height: 28px; }
    .scanner-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 200;
      display: none; flex-direction: column; align-items: center; justify-content: center;
    }
    .scanner-overlay.active { display: flex; }
    .scanner-close {
      position: absolute; top: 16px; right: 16px; background: none; border: none;
      color: white; font-size: 2rem; cursor: pointer; z-index: 201;
    }
    #qr-reader { width: 100%; max-width: 400px; }
    .scanner-status { color: var(--muted); font-size: 0.85rem; margin-top: 12px; }
`;

// ─── Page Layout ─────────────────────────────────────────
const USER_MENU_JS = `
    var _avatarBtn = document.getElementById('user-avatar-btn');
    var _userDrop = document.getElementById('user-dropdown');
    if (_avatarBtn) {
      _avatarBtn.addEventListener('click', function(e) { e.stopPropagation(); _userDrop.classList.toggle('open'); });
      document.addEventListener('click', function() { _userDrop.classList.remove('open'); });
      document.getElementById('logout-link').addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/login'; });
      });
      var _setHome = document.getElementById('set-home-link');
      if (_setHome) {
        var _pathMap = { '/scan': 'scan', '/': 'scan', '/workbench': 'workbench', '/fixit': 'fixit', '/stations': 'staging', '/dashboard': 'dashboard' };
        var _homePage = _pathMap[window.location.pathname];
        if (!_homePage) _setHome.style.display = 'none';
        _setHome.addEventListener('click', function(e) {
          e.preventDefault();
          if (!_homePage) return;
          fetch('/api/auth/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home_page: _homePage }) })
            .then(function(r) { return r.json(); })
            .then(function(d) { if (d.ok) { _setHome.textContent = 'Home set \\u2713'; setTimeout(function() { _setHome.textContent = 'Set as Home'; _userDrop.classList.remove('open'); }, 1200); } });
        });
      }
    }

    // --- Floating QR FAB ---
    (function() {
      var fab = document.getElementById('qr-fab');
      if (!fab) return;
      var saved = localStorage.getItem('fw_fab_pos');
      var pos = saved ? JSON.parse(saved) : { right: 20, bottom: 80 };
      fab.style.right = pos.right + 'px';
      fab.style.bottom = pos.bottom + 'px';

      var dragging = false, startX = 0, startY = 0, startRight = 0, startBottom = 0, moved = false;

      function onStart(cx, cy) {
        dragging = true; moved = false;
        startX = cx; startY = cy;
        startRight = parseInt(fab.style.right) || pos.right;
        startBottom = parseInt(fab.style.bottom) || pos.bottom;
        fab.classList.add('dragging');
      }
      function onMove(cx, cy) {
        if (!dragging) return;
        var dx = startX - cx, dy = startY - cy;
        if (!moved && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        moved = true;
        var r = Math.max(0, Math.min(window.innerWidth - 56, startRight + dx));
        var b = Math.max(0, Math.min(window.innerHeight - 56, startBottom + dy));
        fab.style.right = r + 'px'; fab.style.bottom = b + 'px';
      }
      function onEnd() {
        if (!dragging) return;
        dragging = false; fab.classList.remove('dragging');
        if (moved) {
          pos = { right: parseInt(fab.style.right), bottom: parseInt(fab.style.bottom) };
          localStorage.setItem('fw_fab_pos', JSON.stringify(pos));
        } else {
          openGlobalScanner();
        }
      }

      fab.addEventListener('touchstart', function(e) { e.preventDefault(); var t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: false });
      document.addEventListener('touchmove', function(e) { if (dragging) { e.preventDefault(); var t = e.touches[0]; onMove(t.clientX, t.clientY); } }, { passive: false });
      document.addEventListener('touchend', onEnd);
      fab.addEventListener('mousedown', function(e) { e.preventDefault(); onStart(e.clientX, e.clientY); });
      document.addEventListener('mousemove', function(e) { onMove(e.clientX, e.clientY); });
      document.addEventListener('mouseup', onEnd);

      // --- Global Scanner ---
      var overlay = document.getElementById('scanner-overlay');
      var status = document.getElementById('scanner-status');
      var qrScanner = null, scannerActive = false, libLoaded = typeof Html5Qrcode !== 'undefined';

      function loadLib(cb) {
        if (libLoaded) return cb();
        var s = document.createElement('script');
        s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        s.onload = function() { libLoaded = true; cb(); };
        s.onerror = function() { status.textContent = 'Failed to load scanner'; };
        document.head.appendChild(s);
      }

      function openGlobalScanner() {
        overlay.classList.add('active');
        status.textContent = 'Loading scanner...';
        loadLib(function() {
          status.textContent = 'Starting camera...';
          if (!qrScanner) qrScanner = new Html5Qrcode('qr-reader');
          qrScanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            function(decoded) { onGlobalQR(decoded); },
            function() {}
          ).then(function() {
            scannerActive = true;
            status.textContent = 'Point camera at a FabWorks QR code';
          }).catch(function(err) { status.textContent = 'Camera error: ' + err; });
        });
      }

      function stopGlobalScanner() {
        if (qrScanner && scannerActive) {
          qrScanner.stop().then(function() { scannerActive = false; });
        }
        overlay.classList.remove('active');
      }

      document.getElementById('scanner-close').addEventListener('click', stopGlobalScanner);

      window._fabworksStopScanner = stopGlobalScanner;

      function onGlobalQR(text) {
        stopGlobalScanner();
        if (typeof window._fabworksHandleQR === 'function') {
          window._fabworksHandleQR(text);
        } else {
          window.location.href = '/scan?qr=' + encodeURIComponent(text);
        }
      }
    })();
`;

function page(title: string, extraStyles: string, body: string, script: string, user: SessionUser | null, currentPath: string, cdnScripts: string[] = []): string {
  const cdnTags = cdnScripts.map((src) => `<script src="${src}"></script>`).join("\n  ");
  const scannerHtml = user ? `
  <button class="qr-fab" id="qr-fab" title="Scan QR code">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="12" x2="17" y2="12"/><line x1="12" y1="7" x2="12" y2="17"/>
    </svg>
  </button>
  <div class="scanner-overlay" id="scanner-overlay">
    <button class="scanner-close" id="scanner-close">&times;</button>
    <div id="qr-reader"></div>
    <div class="scanner-status" id="scanner-status">Point camera at a FabWorks QR code</div>
  </div>` : "";
  const navHtml = user ? `
  <nav class="top-nav">${renderNav(currentPath, user)}</nav>
  <div class="page-header">
    <h1>${title}</h1>
    <div class="user-menu">
      <button class="user-avatar" id="user-avatar-btn">${user.name.charAt(0).toUpperCase()}</button>
      <div class="user-dropdown" id="user-dropdown">
        <div class="ud-info"><div class="ud-name">${user.name}</div><div class="ud-role">${user.role}</div></div>
        <a href="#" id="set-home-link">Set as Home</a>
        <a href="#" id="logout-link">Log out</a>
      </div>
    </div>
  </div>` : `<div style="padding:0"></div>`;
  const bodyPadding = user ? '' : 'body{padding-top:0;}';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>FabWorks — ${title}</title>
  <style>${SHARED_STYLES}${bodyPadding}${extraStyles}</style>
</head>
<body>
  ${navHtml}
  ${scannerHtml}
  ${body}
  ${cdnTags}
  <script>${user ? USER_MENU_JS : ""}${script}</script>
</body>
</html>`;
}

function stationNamesJS(config: TenantConfig): string {
  const map: Record<string, string> = {};
  config.stations.forEach((s) => { map[s.slug] = s.name; });
  return `var STATION_NAMES = ${JSON.stringify(map)};`;
}

function displayStatusJS(config: TenantConfig): string {
  const map: Record<string, string> = { pending: "Pending", in_progress: "In Progress", complete: "Complete" };
  config.l3_statuses.forEach((s) => {
    if (!map[s]) map[s] = s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
  });
  return `function displayStatus(s) { var m = ${JSON.stringify(map)}; return m[s] || s; }`;
}

const STATUS_COLOR_JS = `
    function statusColor(s) {
      if (s === 'pending') return 'yellow';
      if (s === 'in_progress') return 'blue';
      if (s === 'complete') return 'green';
      return 'blue';
    }
    function pillColor(s) {
      if (s === 'pending') return 'yellow';
      if (s === 'in_progress') return 'blue';
      if (s === 'complete' || s === 'assembled' || s === 'inspected' || s === 'shipped' || s === 'packed') return 'green';
      if (s === 'staged') return 'purple';
      return 'blue';
    }`;

// ─── LOGIN PAGE ────────────────────────────────────────────
export function loginPage(): string {
  return page("Login", `
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .login-card { width: 100%; max-width: 360px; }
    .login-card h2 { font-size: 1.4rem; margin-bottom: 20px; text-align: center; }
    .login-card .field { margin-bottom: 16px; }
    .login-error { color: var(--error); font-size: 0.85rem; text-align: center; margin-top: 8px; display: none; }
  `, `
  <main>
    <div class="card login-card">
      <h2>FabWorks</h2>
      <div class="field">
        <label>Email</label>
        <input type="text" id="email" placeholder="you@example.com" autocomplete="email" autocapitalize="none">
      </div>
      <div class="field">
        <label>PIN</label>
        <input type="text" id="pin" placeholder="Your PIN" inputmode="numeric" autocomplete="current-password">
      </div>
      <button class="btn btn-primary" id="login-btn">Log In</button>
      <div class="login-error" id="error"></div>
    </div>
  </main>
  `, `
    var emailInput = document.getElementById('email');
    var pinInput = document.getElementById('pin');
    var loginBtn = document.getElementById('login-btn');
    var errorDiv = document.getElementById('error');

    var savedEmail = localStorage.getItem('fw_email');
    if (savedEmail) emailInput.value = savedEmail;

    function doLogin() {
      errorDiv.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim(), pin: pinInput.value.trim() }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          localStorage.setItem('fw_email', emailInput.value.trim());
          localStorage.setItem('fw_name', r.data.user.name);
          window.location.href = '/';
        } else {
          errorDiv.textContent = r.data.error;
          errorDiv.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.textContent = 'Log In';
        }
      }).catch(function() {
        errorDiv.textContent = 'Network error';
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      });
    }

    loginBtn.addEventListener('click', doLogin);
    pinInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
  `, null, "/login");
}

// ─── SCAN PAGE ────────────────────────────────────────────
export function scanPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page("FabWorks", `
    main { flex: 1; padding: 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    #active-build-banner { background: rgba(245,158,11,0.15); border: 1px solid var(--warning, #f59e0b); color: var(--warning, #f59e0b); cursor: pointer; font-weight: 600; font-size: 0.9rem; text-align: center; padding: 10px; }
    .station-carousel { display: flex; align-items: center; justify-content: center; gap: 0; user-select: none; }
    .station-prev, .station-next {
      flex: 1; font-size: 0.8rem; color: var(--muted); opacity: 0.4; cursor: pointer;
      padding: 10px 8px; transition: opacity 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .station-prev { text-align: right; }
    .station-next { text-align: left; }
    .station-prev:hover, .station-next:hover { opacity: 0.7; }
    .station-current {
      flex-shrink: 0; padding: 10px 20px; font-size: 1.1rem; font-weight: 700;
      background: rgba(59,130,246,0.15); border: 2px solid var(--accent);
      border-radius: 10px; color: var(--accent); text-align: center; min-width: 140px;
    }
    .station-seq { font-size: 0.6rem; font-weight: 400; color: var(--muted); display: block; margin-top: 2px; }
    .entity-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .entity-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; background: var(--bg); border: 2px solid var(--border);
      border-radius: 8px; cursor: pointer; transition: all 0.15s;
    }
    .entity-row:active { transform: scale(0.98); }
    .entity-row.selected { border-color: var(--accent); background: rgba(59,130,246,0.1); }
    .entity-row .name { font-weight: 600; font-size: 0.9rem; }
    .entity-row .meta { font-size: 0.75rem; color: var(--muted); }
    .section-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    #context-panel { display: none; }
    .swipe-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface); border: 1px solid var(--accent); border-radius: 12px;
      padding: 12px 24px; font-size: 1rem; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100;
    }
    .swipe-toast.show { opacity: 1; }
    .cab-meta-panel {
      margin: -2px 0 6px; padding: 8px 12px; background: rgba(59,130,246,0.06);
      border: 1px solid var(--border); border-top: none; border-radius: 0 0 8px 8px;
      font-size: 0.8rem;
    }
    .cab-meta-panel .meta-label { font-weight: 600; font-size: 0.7rem; color: var(--muted); text-transform: uppercase; margin-top: 6px; }
    .cab-meta-panel .meta-label:first-child { margin-top: 0; }
    .cab-meta-panel .meta-value { margin-top: 2px; white-space: pre-line; }
    .cab-meta-panel a { color: var(--accent); }
  `, `
  <main>
    <div class="card">
      <div class="station-carousel" id="station-carousel">
        <div class="station-prev" id="station-prev"></div>
        <div class="station-current" id="station-current">Select Station</div>
        <div class="station-next" id="station-next"></div>
      </div>
    </div>
    <div class="card">
      <label>${config.entity_labels.l1}</label>
      <input type="text" id="job-input" placeholder="${config.entity_labels.l1} number" inputmode="numeric" autocomplete="off">
      <div id="job-info" style="margin-top:8px;font-size:0.85rem;color:var(--muted)"></div>
    </div>
    <div class="card" id="context-panel">
      <div id="context-label" class="section-label"></div>
      <div class="entity-list" id="entity-list"></div>
    </div>
    <div id="active-build-banner" style="display:none" class="card" onclick="window.location.href='/workbench'"></div>
    <button class="btn btn-primary" id="scan-btn" disabled>Log Scan</button>
    <div class="result" id="result"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}
    function escHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

    var selectedStation = localStorage.getItem('fw_station') || null;
    var selectedEntityId = null;
    var jobData = null;
    var debounceTimer = null;
    var pendingStation = null;

    var stationPrev = document.getElementById('station-prev');
    var stationCurrent = document.getElementById('station-current');
    var stationNext = document.getElementById('station-next');
    var jobInput = document.getElementById('job-input');
    var jobInfo = document.getElementById('job-info');
    var contextPanel = document.getElementById('context-panel');
    var contextLabel = document.getElementById('context-label');
    var entityList = document.getElementById('entity-list');
    var scanBtn = document.getElementById('scan-btn');
    var resultDiv = document.getElementById('result');
    var USER_NAME = ${JSON.stringify(user.name)};

    function getStation(slug) {
      for (var i = 0; i < STATIONS.length; i++) {
        if (STATIONS[i].slug === slug) return STATIONS[i];
      }
      return null;
    }

    function stationIdx() {
      for (var i = 0; i < STATIONS.length; i++) { if (STATIONS[i].slug === selectedStation) return i; }
      return 0;
    }

    function renderCarousel() {
      var idx = stationIdx();
      var s = STATIONS[idx];
      stationCurrent.innerHTML = s.name + '<span class="station-seq">' + (idx + 1) + ' of ' + STATIONS.length + '</span>';
      stationPrev.textContent = idx > 0 ? STATIONS[idx - 1].name : '';
      stationNext.textContent = idx < STATIONS.length - 1 ? STATIONS[idx + 1].name : '';
    }

    function selectStation(slug) {
      selectedStation = slug;
      localStorage.setItem('fw_station', slug);
      selectedEntityId = null;
      renderCarousel();
      loadJobContext();
      updateScanBtn();
    }

    if (!selectedStation) selectStation(STATIONS[0].slug);
    renderCarousel();

    stationPrev.addEventListener('click', function() { var i = stationIdx(); if (i > 0) selectStation(STATIONS[i - 1].slug); });
    stationNext.addEventListener('click', function() { var i = stationIdx(); if (i < STATIONS.length - 1) selectStation(STATIONS[i + 1].slug); });

    jobInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      jobData = null;
      selectedEntityId = null;
      jobInfo.textContent = '';
      contextPanel.style.display = 'none';
      updateScanBtn();
      var val = jobInput.value.trim();
      if (val.length >= 3) {
        debounceTimer = setTimeout(function() { lookupJob(val); }, 300);
      }
    });

    function lookupJob(num) {
      fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
        var job = jobs.find(function(j) { return j.job_number === num; });
        if (job) {
          fetch('/api/jobs/' + job.id).then(function(r) { return r.json(); }).then(function(detail) {
            jobData = detail;
            jobInfo.innerHTML = '<strong>' + detail.job_name + '</strong> — ' +
              detail.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + detail.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
            loadJobContext();
            updateScanBtn();
          });
        } else {
          jobInfo.textContent = 'No active ' + LABELS.l1.toLowerCase() + ' found';
          updateScanBtn();
        }
      });
    }

    function loadJobContext() {
      if (!jobData || !selectedStation) { contextPanel.style.display = 'none'; return; }
      var station = getStation(selectedStation);
      if (!station || station.level === 'l1') { contextPanel.style.display = 'none'; return; }
      contextPanel.style.display = 'block';

      if (station.level === 'l2') {
        contextLabel.textContent = 'Select ' + LABELS.l2;
        if (jobData.buckets.length === 0) {
          entityList.innerHTML = '<div style="color:var(--muted);font-size:0.85rem">No ' + LABELS.l2.toLowerCase() + 's — <a href="/job/' + jobData.id + '" style="color:var(--accent)">add ' + LABELS.l2.toLowerCase() + 's</a></div>';
          return;
        }
        entityList.innerHTML = jobData.buckets.map(function(b) {
          return '<div class="entity-row' + (selectedEntityId === b.id ? ' selected' : '') + '" data-id="' + b.id + '">' +
            '<div><div class="name">' + b.name + '</div><div class="meta">' + b.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div></div>' +
            '<span class="pill pill-' + pillColor(b.status) + '">' + displayStatus(b.status) + '</span></div>';
        }).join('');
      } else {
        contextLabel.textContent = 'Select ' + LABELS.l3;
        if (jobData.cabinets.length === 0) {
          entityList.innerHTML = '<div style="color:var(--muted);font-size:0.85rem">No ' + LABELS.l3.toLowerCase() + 's — <a href="/job/' + jobData.id + '" style="color:var(--accent)">add ' + LABELS.l3.toLowerCase() + 's</a></div>';
          return;
        }
        entityList.innerHTML = jobData.cabinets.map(function(cab) {
          var row = '<div class="entity-row' + (selectedEntityId === cab.id ? ' selected' : '') + '" data-id="' + cab.id + '">' +
            '<div><div class="name">' + LABELS.l3 + ' ' + cab.cabinet_number + '</div><div class="meta">' + (cab.label || '') + '</div></div>' +
            '<span class="pill pill-' + pillColor(cab.status) + '">' + displayStatus(cab.status) + '</span></div>';
          if (cab.accessories || cab.notes || cab.assembly_sheet_url) {
            row += '<div class="cab-meta-panel">';
            if (cab.accessories) row += '<div class="meta-label">Accessories</div><div class="meta-value">' + escHtml(cab.accessories) + '</div>';
            if (cab.notes) row += '<div class="meta-label">Notes</div><div class="meta-value">' + escHtml(cab.notes) + '</div>';
            if (cab.assembly_sheet_url) row += '<div class="meta-label">Assembly Sheet</div><div class="meta-value"><a href="' + escHtml(cab.assembly_sheet_url) + '" target="_blank" rel="noopener">Open Assembly Sheet ↗</a></div>';
            row += '</div>';
          }
          return row;
        }).join('');
      }

      entityList.querySelectorAll('.entity-row').forEach(function(row) {
        row.addEventListener('click', function() {
          selectedEntityId = parseInt(row.dataset.id);
          entityList.querySelectorAll('.entity-row').forEach(function(r) { r.classList.toggle('selected', r.dataset.id == selectedEntityId); });
          updateScanBtn();
        });
      });
    }

    function updateScanBtn() {
      if (!selectedStation || !jobData) { scanBtn.disabled = true; return; }
      var station = getStation(selectedStation);
      if (!station) { scanBtn.disabled = true; return; }
      var isBuildStation = station.sets_status === 'assembling';
      scanBtn.textContent = isBuildStation ? 'Start Build' : 'Log Scan';
      if (station.level === 'l1') { scanBtn.disabled = false; return; }
      scanBtn.disabled = !selectedEntityId;
    }

    var actionInFlight = false;

    function fireAction() {
      if (!selectedStation || !jobData) return;
      var station = getStation(selectedStation);
      if (!station) return;
      if (station.level !== 'l1' && !selectedEntityId) return;
      if (actionInFlight) return;
      actionInFlight = true;

      if (station.sets_status === 'assembling' && selectedEntityId) {
        scanBtn.disabled = true;
        scanBtn.textContent = 'Starting...';
        fetch('/api/build/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cabinet_id: selectedEntityId }),
        }).then(function(res) {
          return res.json().then(function(d) { return { ok: res.ok, data: d }; });
        }).then(function(r) {
          actionInFlight = false;
          if (r.ok || r.data.active_session_id) {
            window.location.href = '/workbench';
          } else {
            resultDiv.className = 'result error';
            resultDiv.innerHTML = r.data.error;
            resultDiv.style.display = 'block';
            scanBtn.textContent = 'Start Build';
            updateScanBtn();
          }
        });
        return;
      }

      scanBtn.disabled = true;
      scanBtn.textContent = 'Logging...';
      resultDiv.className = 'result';
      resultDiv.style.display = 'none';

      var payload = {
        station: selectedStation,
        job_id: jobData.id,
        scanned_by: USER_NAME,
      };
      if (station.level === 'l2') payload.bucket_id = selectedEntityId;
      if (station.level === 'l3') payload.cabinet_id = selectedEntityId;

      fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(function(res) {
        return res.json().then(function(data) { return { ok: res.ok, data: data }; });
      }).then(function(r) {
        actionInFlight = false;
        if (r.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = r.data.station + '<div class="detail">' +
            r.data.job_number + ' ' + r.data.job_name +
            (r.data.scanned_by ? ' — ' + r.data.scanned_by : '') + '</div>';
          selectedEntityId = null;
          fetch('/api/jobs/' + jobData.id).then(function(r2) { return r2.json(); }).then(function(detail) {
            jobData = detail;
            loadJobContext();
          });
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = r.data.error;
        }
        scanBtn.textContent = 'Log Scan';
        updateScanBtn();
      }).catch(function() {
        actionInFlight = false;
        resultDiv.className = 'result error';
        resultDiv.innerHTML = 'Network error';
        scanBtn.textContent = 'Log Scan';
        updateScanBtn();
      });
    }

    scanBtn.addEventListener('click', function() {
      if (scanBtn.disabled) return;
      fireAction();
    });

    // --- QR handler (fed by global FAB scanner) ---
    function tryAutoFire() {
      if (!pendingStation || !jobData || !selectedEntityId) return;
      selectStation(pendingStation);
      pendingStation = null;
      fireAction();
    }

    function handleQR(text) {
      var parts = text.split(':');
      if (parts[0] !== 'fw' || parts.length < 3) {
        scannerStatus.textContent = 'Not a FabWorks code';
        return;
      }
      var type = parts[1];

      if (type === 'sta') {
        var slug = parts[2];
        var station = getStation(slug);
        if (!station) {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = 'Unknown station: ' + slug;
          resultDiv.style.display = 'block';
          return;
        }
        selectStation(slug);
        if (jobData && (station.level === 'l1' || selectedEntityId)) {
          fireAction();
        } else {
          pendingStation = slug;
          showToast(station.name + ' — scan a ' + LABELS.l3.toLowerCase());
        }
        return;
      }

      var id = parseInt(parts[2]);

      if (type === 'l1' || type === 'job') {
        fetch('/api/jobs/' + id).then(function(r) { return r.json(); }).then(function(detail) {
          if (detail.error) return;
          jobData = detail;
          jobInput.value = detail.job_number;
          jobInfo.innerHTML = '<strong>' + detail.job_name + '</strong> — ' +
            detail.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + detail.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
          loadJobContext();
          updateScanBtn();
        });
      } else if (type === 'l2' || type === 'bucket') {
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
          var found = null;
          var promises = jobs.map(function(j) {
            return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }).then(function(detail) {
              var bucket = detail.buckets.find(function(b) { return b.id === id; });
              if (bucket) found = detail;
            });
          });
          Promise.all(promises).then(function() {
            if (found) {
              jobData = found;
              jobInput.value = found.job_number;
              jobInfo.innerHTML = '<strong>' + found.job_name + '</strong> — ' +
                found.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + found.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
              selectedEntityId = id;
              loadJobContext();
              updateScanBtn();
              tryAutoFire();
            }
          });
        });
      } else if (type === 'l3' || type === 'cabinet') {
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }).then(function(jobs) {
          var found = null;
          var promises = jobs.map(function(j) {
            return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }).then(function(detail) {
              var cab = detail.cabinets.find(function(c) { return c.id === id; });
              if (cab) found = detail;
            });
          });
          Promise.all(promises).then(function() {
            if (found) {
              jobData = found;
              jobInput.value = found.job_number;
              jobInfo.innerHTML = '<strong>' + found.job_name + '</strong> — ' +
                found.buckets.length + ' ' + LABELS.l2.toLowerCase() + 's, ' + found.cabinets.length + ' ' + LABELS.l3.toLowerCase() + 's';
              selectedEntityId = id;
              loadJobContext();
              updateScanBtn();
              tryAutoFire();
            }
          });
        });
      }
    }

    // --- Swipe gestures ---
    var swipeToast = document.getElementById('swipe-toast');
    var toastTimer = null;
    function showToast(msg) {
      swipeToast.textContent = msg;
      swipeToast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { swipeToast.classList.remove('show'); }, 600);
    }

    function cycleStation(dir) {
      if (!STATIONS.length) return;
      var idx = stationIdx();
      idx = (idx + dir + STATIONS.length) % STATIONS.length;
      var s = STATIONS[idx];
      selectStation(s.slug);
      showToast(dir > 0 ? s.name + ' →' : '← ' + s.name);
    }

    var touchStartX = 0, touchStartY = 0, swiping = false;
    document.addEventListener('touchstart', function(e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.target.closest && e.target.closest('.qr-fab')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!swiping) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
      if (!swiping) return;
      swiping = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      var absDx = Math.abs(dx), absDy = Math.abs(dy);
      if (absDx < 50 && absDy < 50) return;

      if (absDx > absDy) {
        cycleStation(dx < 0 ? 1 : -1);
      } else if (dy < -50) {
        scanBtn.click();
      } else if (dy > 50) {
        if (jobData) {
          fetch('/api/jobs/' + jobData.id).then(function(r) { return r.json(); }).then(function(detail) {
            jobData = detail;
            loadJobContext();
            showToast('Refreshed');
          });
        }
      }
    }, { passive: true });

    window._fabworksHandleQR = handleQR;

    var qrParam = new URLSearchParams(window.location.search).get('qr');
    if (qrParam) {
      history.replaceState(null, '', '/scan');
      handleQR(qrParam);
    }

    fetch('/api/build/active').then(function(r) { return r.json(); }).then(function(data) {
      if (data.session) {
        var b = document.getElementById('active-build-banner');
        b.textContent = 'Build in progress — ${config.entity_labels.l3} #' + data.session.cabinet_number + ' →';
        b.style.display = 'block';
      }
    });
`, user, "/scan");
}

// ─── NEW JOB PAGE ────────────────────────────────────────
export function newJobPage(config: TenantConfig, user: SessionUser): string {
  const L1 = config.entity_labels.l1;
  const L3 = config.entity_labels.l3;
  return page(`New ${L1}`, `
    main { flex: 1; padding: 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
`, user, "/jobs/new");
}

// ─── JOB DETAIL PAGE ────────────────────────────────────
export function jobDetailPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page(`${config.entity_labels.l1} Detail`, `
    main { flex: 1; padding: 16px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
    .qr-label canvas { max-width: 120px; }
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
        var isLead = ROLE_LEVELS[USER_ROLE] >= ROLE_LEVELS['lead'];
        grid.innerHTML = job.cabinets.map(function(c) {
          var hasMeta = c.accessories || c.notes || c.assembly_sheet_url;
          return '<div class="cab-tile ' + c.status + (isLead ? ' clickable' : '') + '"' +
            (isLead ? ' data-cab-id="' + c.id + '"' : '') + '>' +
            LABELS.l3 + ' ' + c.cabinet_number +
            (hasMeta ? '<span class="meta-dot" title="Has metadata"></span>' : '') +
            '<div class="sub">' + (c.label || displayStatus(c.status)) + '</div></div>';
        }).join('') || '<div style="color:var(--muted);font-size:0.8rem">No ' + LABELS.l3.toLowerCase() + 's yet</div>';
        grid.querySelectorAll('.cab-tile[data-cab-id]').forEach(function(tile) {
          tile.addEventListener('click', function() {
            openCabModal(parseInt(tile.getAttribute('data-cab-id')));
          });
        });

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

    // --- Cabinet metadata modal ---
    function escHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

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
        var canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, text, { width: 120, margin: 1 });
        div.appendChild(canvas);
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
        var canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, 'fw:sta:' + s.slug, { width: 120, margin: 1 });
        div.appendChild(canvas);
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
`, user, "/dashboard", ["https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"]);
}

// ─── DASHBOARD ────────────────────────────────────────────
export function dashboardPage(config: TenantConfig, user: SessionUser): string {
  return page("Dashboard", `
    main { padding: 16px; max-width: 1100px; margin: 0 auto; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .top-bar span { font-size: 0.8rem; color: var(--muted); }
    .top-bar-right { display: flex; align-items: center; gap: 10px; }
    .auto-label { font-size: 0.7rem; color: var(--muted); display: flex; align-items: center; gap: 4px; }
    .refresh-btn { padding: 6px 14px; font-size: 0.8rem; font-weight: 600; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); cursor: pointer; }
    .two-col { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }
    .job-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
    .job-header h2 { font-size: 1.1rem; }
    .job-header a { color: var(--accent); text-decoration: none; font-size: 0.75rem; }
    .progress-bar { height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .progress-fill.green { background: var(--success); }
    .stats-row { display: flex; gap: 16px; font-size: 0.8rem; color: var(--muted); flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 4px; }
    .stat .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-pending { background: var(--border); }
    .dot-active { background: var(--accent); }
    .dot-done { background: var(--success); }
    .dot-terminal { background: var(--purple); }
    .bucket-row { font-size: 0.75rem; color: var(--muted); padding: 4px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
    .bucket-row:last-child { border-bottom: none; }
    .feed-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; max-height: 80vh; overflow-y: auto; }
    .feed-panel h3 { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .feed-item { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
    .feed-item:last-child { border-bottom: none; }
    .feed-job { font-weight: 600; color: var(--text); }
    .feed-station { color: var(--accent); }
    .feed-detail { color: var(--muted); font-size: 0.7rem; }
    .feed-meta { color: var(--muted); font-size: 0.7rem; margin-top: 2px; }
    .empty { text-align: center; padding: 48px 16px; color: var(--muted); }
    .empty a { color: var(--accent); text-decoration: none; }
`, `
  <main>
    <div class="top-bar">
      <span id="updated"></span>
      <div class="top-bar-right">
        <label class="auto-label"><input type="checkbox" id="auto-refresh" checked> Auto 30s</label>
        <button class="refresh-btn" id="refresh-btn">Refresh</button>
      </div>
    </div>
    <div class="two-col">
      <div id="jobs"></div>
      <div class="feed-panel">
        <h3>Live Feed</h3>
        <div id="feed"></div>
      </div>
    </div>
  </main>
`, `
    ${stationNamesJS(config)}
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var L3_STATUSES = ${JSON.stringify(config.l3_statuses)};
    var TERMINAL = ${JSON.stringify(config.l3_terminal_status)};
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var jobsDiv = document.getElementById('jobs');
    var feedDiv = document.getElementById('feed');
    var updatedSpan = document.getElementById('updated');
    var refreshBtn = document.getElementById('refresh-btn');
    var autoCheck = document.getElementById('auto-refresh');
    var autoTimer = null;

    function timeAgo(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    function load() {
      Promise.all([
        fetch('/api/jobs?status=active').then(function(r) { return r.json(); }),
        fetch('/api/scans/recent?limit=25').then(function(r) { return r.json(); }),
      ]).then(function(results) {
        var jRes = results[0];
        var feedRes = results[1];

        feedDiv.innerHTML = feedRes.length === 0
          ? '<div style="color:var(--muted);font-size:0.8rem">No scans yet</div>'
          : feedRes.map(function(s) {
            var t = new Date(s.scanned_at + 'Z');
            var detail = s.bucket_name ? s.bucket_name : s.cabinet_number ? LABELS.l3 + ' ' + s.cabinet_number : '';
            return '<div class="feed-item">' +
              '<span class="feed-job">' + s.job_number + '</span> ' +
              '<span class="feed-station">' + (STATION_NAMES[s.station] || s.station) + '</span>' +
              (detail ? '<div class="feed-detail">' + detail + '</div>' : '') +
              '<div class="feed-meta">' + (s.scanned_by || '?') + ' — ' + timeAgo(t) + '</div></div>';
          }).join('');

        if (jRes.length === 0) {
          jobsDiv.innerHTML = '<div class="empty">No active ' + LABELS.l1.toLowerCase() + 's. <a href="/jobs/new">Create one</a></div>';
          updatedSpan.textContent = 'Updated ' + new Date().toLocaleTimeString();
          return;
        }

        Promise.all(jRes.map(function(j) { return fetch('/api/jobs/' + j.id).then(function(r) { return r.json(); }); }))
          .then(function(details) {
            jobsDiv.innerHTML = details.map(function(job) {
              var total = job.cabinets.length || job.cabinet_count || 1;
              var counts = {};
              L3_STATUSES.forEach(function(st) { counts[st] = 0; });
              job.cabinets.forEach(function(c) { counts[c.status] = (counts[c.status] || 0) + 1; });
              var terminalCount = counts[TERMINAL] || 0;
              var pct = total > 0 ? Math.round((terminalCount / total) * 100) : 0;

              var lastScan = job.scans[0];
              var lastInfo = lastScan
                ? (STATION_NAMES[lastScan.station] || lastScan.station) + ' by ' + (lastScan.scanned_by || '?') +
                  ' — ' + timeAgo(new Date(lastScan.scanned_at + 'Z'))
                : 'No scans yet';

              var bucketInfo = job.buckets.map(function(b) {
                return '<div class="bucket-row"><span>' + b.name + '</span><span class="pill pill-' + statusColor(b.status) + '">' + displayStatus(b.status) + '</span></div>';
              }).join('');

              var statsHtml = L3_STATUSES.map(function(st, i) {
                var dotClass = st === 'pending' ? 'dot-pending' : st === TERMINAL ? 'dot-terminal' : i === L3_STATUSES.length - 1 ? 'dot-done' : i > 0 ? 'dot-active' : 'dot-pending';
                return '<div class="stat"><div class="dot ' + dotClass + '"></div>' + (counts[st] || 0) + ' ' + displayStatus(st).toLowerCase() + '</div>';
              }).join('');

              return '<div class="job-card">' +
                '<div class="job-header"><h2>' + job.job_number + ' ' + job.job_name + '</h2>' +
                '<a href="/job/' + job.id + '">Details</a></div>' +
                '<div class="progress-bar"><div class="progress-fill green" style="width:' + pct + '%"></div></div>' +
                '<div class="stats-row">' + statsHtml + '</div>' +
                (bucketInfo ? '<div style="margin-top:10px">' + bucketInfo + '</div>' : '') +
                '<div style="margin-top:8px;font-size:0.75rem;color:var(--muted)">Last: ' + lastInfo + '</div>' +
              '</div>';
            }).join('');

            updatedSpan.textContent = 'Updated ' + new Date().toLocaleTimeString();
          });
      });
    }

    function startAuto() { stopAuto(); if (autoCheck.checked) autoTimer = setInterval(load, 30000); }
    function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    autoCheck.addEventListener('change', startAuto);
    refreshBtn.addEventListener('click', load);
    load();
    startAuto();
`, user, "/dashboard");
}

// ─── STATION VIEW PAGE ──────────────────────────────────────
export function stationViewPage(config: TenantConfig, user: SessionUser): string {
  return page("Station View", `
    main { flex: 1; padding: 16px; max-width: 600px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .station-carousel { display: flex; align-items: center; justify-content: center; gap: 0; user-select: none; }
    .station-prev, .station-next {
      flex: 1; font-size: 0.8rem; color: var(--muted); opacity: 0.4; cursor: pointer;
      padding: 10px 8px; transition: opacity 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .station-prev { text-align: right; }
    .station-next { text-align: left; }
    .station-prev:hover, .station-next:hover { opacity: 0.7; }
    .station-current {
      flex-shrink: 0; padding: 10px 20px; font-size: 1.1rem; font-weight: 700;
      background: rgba(59,130,246,0.15); border: 2px solid var(--accent);
      border-radius: 10px; color: var(--accent); text-align: center; min-width: 140px;
    }
    .station-seq { font-size: 0.6rem; font-weight: 400; color: var(--muted); display: block; margin-top: 2px; }
    .date-picker-row { display: flex; align-items: center; gap: 8px; }
    .date-picker-row button {
      padding: 6px 14px; font-size: 0.8rem; font-weight: 600; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface); color: var(--muted); cursor: pointer;
    }
    .date-picker-row button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .date-picker-row input[type="date"] {
      padding: 6px 10px; font-size: 0.8rem; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      color-scheme: dark;
    }
    .date-label { font-size: 0.7rem; color: var(--warning); font-weight: 600; }
    .level-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 8px 0 2px; }
    .item-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;
    }
    .item-card .primary { font-weight: 700; font-size: 1rem; }
    .item-card .secondary { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .item-card .right { text-align: right; font-size: 0.75rem; color: var(--muted); }
    .item-card a { color: var(--accent); text-decoration: none; font-size: 0.75rem; }
    .count-badge { font-size: 0.7rem; font-weight: 700; background: rgba(59,130,246,0.15); color: var(--accent); padding: 2px 8px; border-radius: 10px; margin-left: 6px; }
    .empty-state { text-align: center; padding: 48px 16px; color: var(--muted); font-size: 0.9rem; }
    .swipe-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: var(--surface); border: 1px solid var(--accent); border-radius: 12px;
      padding: 12px 24px; font-size: 1rem; font-weight: 700; color: var(--accent);
      opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 100;
    }
    .swipe-toast.show { opacity: 1; }
    .staging-job { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .staging-job-header { padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .staging-job-header:active { background: rgba(59,130,246,0.08); }
    .staging-job-title { font-weight: 700; font-size: 1rem; }
    .staging-job-sub { font-size: 0.8rem; color: var(--muted); margin-top: 2px; }
    .staging-progress { display: flex; align-items: center; gap: 8px; }
    .staging-progress-bar { width: 60px; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .staging-progress-fill { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.3s; }
    .staging-progress-fill.full { background: var(--success); }
    .staging-progress-text { font-size: 0.75rem; font-weight: 600; color: var(--muted); min-width: 36px; text-align: right; }
    .staging-badge { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(34,197,94,0.15); color: var(--success); }
    .staging-cabs { border-top: 1px solid var(--border); display: none; }
    .staging-cabs.open { display: block; }
    .staging-cab { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); gap: 8px; }
    .staging-cab:last-child { border-bottom: none; }
    .staging-cab-info { flex: 1; min-width: 0; }
    .staging-cab-label { font-weight: 600; font-size: 0.85rem; }
    .staging-cab-bucket { font-size: 0.7rem; color: var(--muted); }
    .staging-loc { flex-shrink: 0; max-width: 140px; }
    .staging-loc-text { font-size: 0.8rem; color: var(--accent); cursor: pointer; padding: 4px 8px; border-radius: 6px; background: rgba(59,130,246,0.08); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .staging-loc-empty { font-size: 0.8rem; color: var(--muted); cursor: pointer; font-style: italic; padding: 4px 8px; }
    .staging-loc input {
      width: 130px; padding: 6px 8px; font-size: 0.8rem; border-radius: 6px;
      border: 1px solid var(--accent); background: var(--bg); color: var(--text);
      outline: none;
    }
    .staging-toggle { display: flex; gap: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    .staging-toggle button {
      flex: 1; padding: 8px 16px; font-size: 0.8rem; font-weight: 600; border: none;
      background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.2s;
    }
    .staging-toggle button.active { background: var(--accent); color: #fff; }
    .staging-loc-group { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); padding: 8px 0 4px; }
    .staging-flat-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px;
    }
    .staging-flat-job { font-size: 0.7rem; color: var(--muted); }
    .staging-flat-label { font-weight: 600; font-size: 0.85rem; }
`, `
  <main>
    <div class="card">
      <div class="station-carousel" id="station-carousel">
        <div class="station-prev" id="station-prev"></div>
        <div class="station-current" id="station-current">Select Station</div>
        <div class="station-next" id="station-next"></div>
      </div>
    </div>
    <div class="date-picker-row">
      <button id="btn-live" class="active">Live</button>
      <input type="date" id="date-pick" />
      <span id="date-label" class="date-label" style="display:none"></span>
    </div>
    <div id="staging-controls" style="display:none">
      <div class="staging-toggle">
        <button id="btn-by-job" class="active">By Job</button>
        <button id="btn-by-loc">By Location</button>
      </div>
    </div>
    <div id="item-count" style="font-size:0.8rem;color:var(--muted)"></div>
    <div id="items"></div>
    <div class="swipe-toast" id="swipe-toast"></div>
  </main>
`, `
    var STATIONS = ${JSON.stringify(config.stations)};
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var TERMINAL_STATUS = ${JSON.stringify(config.l3_terminal_status)};

    var selected = localStorage.getItem('stationView') || STATIONS[0].slug;
    var svPrev = document.getElementById('station-prev');
    var svCurrent = document.getElementById('station-current');
    var svNext = document.getElementById('station-next');
    var itemsDiv = document.getElementById('items');
    var countDiv = document.getElementById('item-count');

    var viewDate = null;
    var btnLive = document.getElementById('btn-live');
    var datePick = document.getElementById('date-pick');
    var dateLabel = document.getElementById('date-label');

    btnLive.addEventListener('click', function() {
      viewDate = null;
      datePick.value = '';
      btnLive.classList.add('active');
      dateLabel.style.display = 'none';
      load();
    });
    datePick.addEventListener('change', function() {
      if (datePick.value) {
        viewDate = datePick.value;
        btnLive.classList.remove('active');
        dateLabel.textContent = 'Viewing ' + viewDate;
        dateLabel.style.display = '';
      } else {
        viewDate = null;
        btnLive.classList.add('active');
        dateLabel.style.display = 'none';
      }
      load();
    });

    var stagingMode = localStorage.getItem('stagingMode') || 'job';
    var stagingControls = document.getElementById('staging-controls');
    var btnByJob = document.getElementById('btn-by-job');
    var btnByLoc = document.getElementById('btn-by-loc');
    var lastStagingData = null;

    btnByJob.addEventListener('click', function() { stagingMode = 'job'; localStorage.setItem('stagingMode', 'job'); btnByJob.classList.add('active'); btnByLoc.classList.remove('active'); if (lastStagingData) renderStagingView(lastStagingData); });
    btnByLoc.addEventListener('click', function() { stagingMode = 'loc'; localStorage.setItem('stagingMode', 'loc'); btnByLoc.classList.add('active'); btnByJob.classList.remove('active'); if (lastStagingData) renderStagingView(lastStagingData); });
    if (stagingMode === 'loc') { btnByLoc.classList.add('active'); btnByJob.classList.remove('active'); }

    function isTerminal(slug) {
      var s = STATIONS.find(function(st) { return st.slug === slug; });
      return s && s.sets_status === TERMINAL_STATUS;
    }

    function svIdx() {
      for (var i = 0; i < STATIONS.length; i++) { if (STATIONS[i].slug === selected) return i; }
      return 0;
    }

    function renderCarousel() {
      var idx = svIdx();
      var s = STATIONS[idx];
      svCurrent.innerHTML = s.name + '<span class="station-seq">' + (idx + 1) + ' of ' + STATIONS.length + '</span>';
      svPrev.textContent = idx > 0 ? STATIONS[idx - 1].name : '';
      svNext.textContent = idx < STATIONS.length - 1 ? STATIONS[idx + 1].name : '';
    }

    function selectStation(slug) {
      selected = slug;
      localStorage.setItem('stationView', slug);
      renderCarousel();
      load();
    }

    svPrev.addEventListener('click', function() { var i = svIdx(); if (i > 0) selectStation(STATIONS[i - 1].slug); });
    svNext.addEventListener('click', function() { var i = svIdx(); if (i < STATIONS.length - 1) selectStation(STATIONS[i + 1].slug); });

    function timeAgo(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    function levelLabel(level) {
      if (level === 'l1') return LABELS.l1.toLowerCase() + 's';
      if (level === 'l2') return LABELS.l2.toLowerCase() + 's';
      return LABELS.l3.toLowerCase() + 's';
    }

    function saveLocation(cabId, value) {
      fetch('/api/cabinets/' + cabId + '/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: value })
      });
    }

    function renderStagingView(jobs) {
      lastStagingData = jobs;
      if (jobs.length === 0) {
        countDiv.textContent = '0 jobs in staging';
        itemsDiv.innerHTML = '<div class="empty-state">Nothing staged right now</div>';
        return;
      }
      if (stagingMode === 'loc') {
        renderByLocation(jobs);
      } else {
        renderByJob(jobs);
      }
      wireLocationEditing();
    }

    function renderByJob(jobs) {
      countDiv.textContent = jobs.length + ' job' + (jobs.length !== 1 ? 's' : '') + ' in staging';
      itemsDiv.innerHTML = jobs.map(function(job, ji) {
        var pct = job.cabinet_count > 0 ? Math.round((job.staged_count / job.cabinet_count) * 100) : 0;
        var isFull = job.staged_count >= job.cabinet_count;
        var cabsHtml = job.cabinets.map(function(cab) {
          var lbl = cab.label || (LABELS.l3 + ' ' + cab.cabinet_number);
          var bucket = cab.bucket_name ? cab.bucket_name : '';
          var locHtml = cab.staging_location
            ? '<div class="staging-loc-text" data-cab="' + cab.id + '">' + cab.staging_location.replace(/</g,'&lt;') + '</div>'
            : '<div class="staging-loc-empty" data-cab="' + cab.id + '">+ Location</div>';
          return '<div class="staging-cab">' +
            '<div class="staging-cab-info">' +
              '<div class="staging-cab-label">' + lbl + '</div>' +
              (bucket ? '<div class="staging-cab-bucket">' + bucket + '</div>' : '') +
            '</div>' +
            '<div class="staging-loc">' + locHtml + '</div>' +
          '</div>';
        }).join('');
        return '<div class="staging-job" style="display:flex;flex-direction:column;gap:0">' +
          '<div class="staging-job-header" data-job-idx="' + ji + '">' +
            '<div>' +
              '<div class="staging-job-title">' + job.job_number + '</div>' +
              '<div class="staging-job-sub">' + job.job_name + '</div>' +
            '</div>' +
            '<div class="staging-progress">' +
              (isFull ? '<span class="staging-badge">Fully Staged</span>' : '') +
              '<div class="staging-progress-bar"><div class="staging-progress-fill' + (isFull ? ' full' : '') + '" style="width:' + pct + '%"></div></div>' +
              '<span class="staging-progress-text">' + job.staged_count + '/' + job.cabinet_count + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="staging-cabs" data-cabs="' + ji + '">' + cabsHtml + '</div>' +
        '</div>';
      }).join('');

      itemsDiv.querySelectorAll('.staging-job-header').forEach(function(hdr) {
        hdr.addEventListener('click', function() {
          var idx = hdr.getAttribute('data-job-idx');
          var cabs = itemsDiv.querySelector('[data-cabs="' + idx + '"]');
          cabs.classList.toggle('open');
        });
      });
    }

    function renderByLocation(jobs) {
      var allCabs = [];
      jobs.forEach(function(job) {
        job.cabinets.forEach(function(cab) {
          allCabs.push({ cab: cab, job_number: job.job_number, job_name: job.job_name, job_id: job.id });
        });
      });
      allCabs.sort(function(a, b) {
        var locA = (a.cab.staging_location || '').toLowerCase();
        var locB = (b.cab.staging_location || '').toLowerCase();
        if (!locA && !locB) return a.job_number.localeCompare(b.job_number) || a.cab.cabinet_number - b.cab.cabinet_number;
        if (!locA) return 1;
        if (!locB) return -1;
        if (locA !== locB) return locA.localeCompare(locB);
        return a.job_number.localeCompare(b.job_number) || a.cab.cabinet_number - b.cab.cabinet_number;
      });

      var totalWithLoc = allCabs.filter(function(c) { return c.cab.staging_location; }).length;
      countDiv.textContent = allCabs.length + ' ' + LABELS.l3.toLowerCase() + 's — ' + totalWithLoc + ' with locations';

      var html = '';
      var currentLoc = null;
      allCabs.forEach(function(item) {
        var loc = item.cab.staging_location || null;
        if (loc !== currentLoc) {
          currentLoc = loc;
          html += '<div class="staging-loc-group">' + (loc ? loc.replace(/</g,'&lt;') : 'No Location') + '</div>';
        }
        var lbl = item.cab.label || (LABELS.l3 + ' ' + item.cab.cabinet_number);
        var locHtml = item.cab.staging_location
          ? '<div class="staging-loc-text" data-cab="' + item.cab.id + '">' + item.cab.staging_location.replace(/</g,'&lt;') + '</div>'
          : '<div class="staging-loc-empty" data-cab="' + item.cab.id + '">+ Location</div>';
        var metaLine = '';
        if (item.cab.accessories || item.cab.notes || item.cab.assembly_sheet_url) {
          var parts = [];
          if (item.cab.accessories) parts.push(item.cab.accessories.replace(/\n/g, ', ').replace(/</g,'&lt;'));
          if (item.cab.notes) parts.push(item.cab.notes.replace(/\n/g, ', ').replace(/</g,'&lt;'));
          if (item.cab.assembly_sheet_url) parts.push('<a href="' + item.cab.assembly_sheet_url.replace(/"/g,'&quot;') + '" target="_blank" rel="noopener" style="color:var(--accent);font-size:0.7rem">Sheet ↗</a>');
          metaLine = '<div style="font-size:0.7rem;color:var(--muted);margin-top:2px">' + parts.join(' · ') + '</div>';
        }
        html += '<div class="staging-flat-card">' +
          '<div>' +
            '<div class="staging-flat-label">' + lbl + '</div>' +
            '<div class="staging-flat-job">' + item.job_number + ' ' + item.job_name + (item.cab.bucket_name ? ' / ' + item.cab.bucket_name : '') + '</div>' +
            metaLine +
          '</div>' +
          '<div class="staging-loc">' + locHtml + '</div>' +
        '</div>';
      });
      itemsDiv.innerHTML = html;
    }

    function wireLocationEditing() {
      itemsDiv.addEventListener('click', function(e) {
        var tgt = e.target;
        if (!tgt.classList.contains('staging-loc-text') && !tgt.classList.contains('staging-loc-empty')) return;
        var cabId = tgt.getAttribute('data-cab');
        var current = tgt.classList.contains('staging-loc-text') ? tgt.textContent : '';
        var input = document.createElement('input');
        input.type = 'text';
        input.value = current;
        input.placeholder = 'e.g. Bay 3 left';
        var parent = tgt.parentNode;
        parent.replaceChild(input, tgt);
        input.focus();
        input.select();
        function commit() {
          var val = input.value.trim();
          saveLocation(cabId, val);
          var newEl = document.createElement('div');
          if (val) {
            newEl.className = 'staging-loc-text';
            newEl.textContent = val;
          } else {
            newEl.className = 'staging-loc-empty';
            newEl.textContent = '+ Location';
          }
          newEl.setAttribute('data-cab', cabId);
          parent.replaceChild(newEl, input);
        }
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') input.blur(); });
      });
    }

    function load() {
      var qs = viewDate ? '?date=' + viewDate : '';
      if (isTerminal(selected)) {
        stagingControls.style.display = '';
        fetch('/api/stations/' + selected + '/staging' + qs)
          .then(function(r) { return r.json(); })
          .then(function(data) { renderStagingView(data.jobs || []); });
        return;
      }
      stagingControls.style.display = 'none';
      lastStagingData = null;
      fetch('/api/stations/' + selected + '/items' + qs)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var items = data.items || [];
          var level = data.level;
          var suffix = viewDate ? ' on ' + viewDate : ' at this station';
          countDiv.textContent = items.length + ' ' + levelLabel(level) + suffix;

          if (items.length === 0) {
            itemsDiv.innerHTML = '<div class="empty-state">' + (viewDate ? 'No activity on ' + viewDate : 'Nothing here right now') + '</div>';
            return;
          }

          if (level === 'l1') {
            itemsDiv.innerHTML = items.map(function(j) {
              return '<div class="item-card"><div>' +
                '<div class="primary">' + j.job_number + '</div>' +
                '<div class="secondary">' + j.job_name + '</div>' +
                '</div><div class="right">' +
                '<div>' + j.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div>' +
                '<div>' + timeAgo(new Date(j.scanned_at + 'Z')) + '</div>' +
                '<a href="/job/' + j.id + '">Details</a>' +
                '</div></div>';
            }).join('');
          } else if (level === 'l2') {
            itemsDiv.innerHTML = items.map(function(b) {
              return '<div class="item-card"><div>' +
                '<div class="primary">' + b.name + '</div>' +
                '<div class="secondary">' + b.job_number + ' ' + b.job_name + '</div>' +
                '</div><div class="right">' +
                '<div>' + b.cabinet_count + ' ' + LABELS.l3.toLowerCase() + 's</div>' +
                '<div>' + timeAgo(new Date(b.scanned_at + 'Z')) + '</div>' +
                '<a href="/job/' + b.job_id + '">Details</a>' +
                '</div></div>';
            }).join('');
          } else {
            itemsDiv.innerHTML = items.map(function(cab) {
              var lbl = cab.label || (LABELS.l3 + ' ' + cab.cabinet_number);
              var bucket = cab.bucket_name ? ' / ' + cab.bucket_name : '';
              var meta = '';
              if (cab.accessories || cab.notes || cab.assembly_sheet_url) {
                meta = '<div style="padding:4px 14px 10px;font-size:0.75rem;color:var(--muted)">';
                if (cab.accessories) meta += '<div><strong>Accessories:</strong> ' + cab.accessories.replace(/\n/g, ', ').replace(/</g,'&lt;') + '</div>';
                if (cab.notes) meta += '<div><strong>Notes:</strong> ' + cab.notes.replace(/\n/g, ', ').replace(/</g,'&lt;') + '</div>';
                if (cab.assembly_sheet_url) meta += '<div><a href="' + cab.assembly_sheet_url.replace(/"/g,'&quot;') + '" target="_blank" rel="noopener" style="color:var(--accent)">Assembly Sheet ↗</a></div>';
                meta += '</div>';
              }
              return '<div class="item-card"><div>' +
                '<div class="primary">' + lbl + '</div>' +
                '<div class="secondary">' + cab.job_number + ' ' + cab.job_name + bucket + '</div>' +
                '</div><div class="right">' +
                '<div>' + timeAgo(new Date(cab.scanned_at + 'Z')) + '</div>' +
                '<a href="/job/' + cab.job_id + '">Details</a>' +
                '</div></div>' + meta;
            }).join('');
          }
        });
    }

    renderCarousel();
    load();

    // --- Swipe gestures ---
    var swipeToast = document.getElementById('swipe-toast');
    var toastTimer = null;
    function showToast(msg) {
      swipeToast.textContent = msg;
      swipeToast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { swipeToast.classList.remove('show'); }, 600);
    }

    function cycleStation(dir) {
      var idx = svIdx();
      idx = (idx + dir + STATIONS.length) % STATIONS.length;
      var s = STATIONS[idx];
      selectStation(s.slug);
      showToast(dir > 0 ? s.name + ' →' : '← ' + s.name);
    }

    var touchStartX = 0, touchStartY = 0, swiping = false;
    document.addEventListener('touchstart', function(e) {
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.target.closest && e.target.closest('.qr-fab')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!swiping) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
      if (!swiping) return;
      swiping = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      var absDx = Math.abs(dx), absDy = Math.abs(dy);
      if (absDx < 50 && absDy < 50) return;

      if (absDx > absDy) {
        cycleStation(dx < 0 ? 1 : -1);
      } else if (dy > 50 && window.scrollY < 10) {
        load();
        showToast('Refreshed');
      }
    }, { passive: true });
`, user, "/stations");
}

// ─── PROGRESS MATRIX PAGE ──────────────────────────────────
export function progressPage(config: TenantConfig, user: SessionUser): string {
  const L2 = config.entity_labels.l2;
  const L3 = config.entity_labels.l3;
  return page(`${config.entity_labels.l1} Progress`, `
    main { flex: 1; padding: 16px; max-width: 1200px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
  `, user, "/dashboard");
}

// ─── KPI DASHBOARD ──────────────────────────────────────
export function kpiPage(config: TenantConfig, user: SessionUser): string {
  return page("Assembler KPI", `
    main { flex: 1; padding: 16px; max-width: 1100px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
    <div id="kpi-grid" class="kpi-grid"></div>
    <div id="empty" class="empty-state" style="display:none">No assembly data in this time range</div>
  </main>
  `, `
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var daysSelect = document.getElementById('days-select');
    var gridDiv = document.getElementById('kpi-grid');
    var summaryDiv = document.getElementById('summary');
    var emptyDiv = document.getElementById('empty');
    var stationInfo = document.getElementById('station-info');

    function fmtMin(m) {
      if (m == null) return '—';
      if (m < 60) return m + 'm';
      var h = Math.floor(m / 60);
      var rm = Math.round(m % 60);
      return h + 'h ' + rm + 'm';
    }

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
              '<div class="summary-stat"><div class="val">' + fmtMin(teamAvg) + '</div><div class="lbl">Team Avg Cycle</div></div>' +
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

            var src = a.source || 'estimated';
            var badge = '<span class="source-badge ' + src + '">' + src + '</span>';
            var cycleLabel = src === 'timer' ? 'Avg Work' : 'Avg Cycle';
            var cycleVal = src === 'timer' && a.avg_working_minutes != null ? a.avg_working_minutes : a.avg_minutes;
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

            var causeBar = '';
            if (a.fixit_breakdown && fixitCount > 0) {
              var b = a.fixit_breakdown;
              var causeBarInner =
                (b.cnc_error > 0 ? '<span class="cnc" style="width:' + (b.cnc_error / fixitCount * 100) + '%"></span>' : '') +
                (b.material_defect > 0 ? '<span class="material" style="width:' + (b.material_defect / fixitCount * 100) + '%"></span>' : '') +
                (b.transit_damage > 0 ? '<span class="transit" style="width:' + (b.transit_damage / fixitCount * 100) + '%"></span>' : '') +
                (b.other_cause > 0 ? '<span class="other-cause" style="width:' + (b.other_cause / fixitCount * 100) + '%"></span>' : '');
              causeBar = '<div class="cause-bar">' + causeBarInner + '</div>' +
                '<div class="cause-legend">' +
                  (b.cnc_error > 0 ? '<span class="cnc">CNC ' + b.cnc_error + '</span>' : '') +
                  (b.material_defect > 0 ? '<span class="material">Material ' + b.material_defect + '</span>' : '') +
                  (b.transit_damage > 0 ? '<span class="transit">Transit ' + b.transit_damage + '</span>' : '') +
                  (b.other_cause > 0 ? '<span class="other-cause">Other ' + b.other_cause + '</span>' : '') +
                '</div>';
            }

            return '<div class="kpi-card">' +
              '<div><span class="name">' + a.assembler + '</span> <span class="rank">#' + (idx + 1) + '</span>' + badge + '</div>' +
              '<div class="kpi-stats">' +
                '<div class="kpi-stat"><div class="val success">' + a.total_completed + '</div><div class="lbl">Completed</div></div>' +
                '<div class="kpi-stat"><div class="val accent">' + a.per_day + '</div><div class="lbl">Per Day</div></div>' +
                '<div class="kpi-stat"><div class="val purple">' + fmtMin(cycleVal) + '</div><div class="lbl">' + cycleLabel + '</div></div>' +
                (effRow || '') +
                (pauseRow || '<div class="kpi-stat"><div class="val">' + a.active_days + '</div><div class="lbl">Active Days</div></div>') +
                fixitStat +
              '</div>' +
              causeBar +
              '<div class="kpi-timing">' +
                '<span class="fast">Best: ' + fmtMin(a.min_minutes) + '</span>' +
                '<span class="slow">Slowest: ' + fmtMin(a.max_minutes) + '</span>' +
              '</div>' +
              (barsHtml ? '<div>' + barsHtml + '</div>' : '') +
            '</div>';
          }).join('');
        });
    }

    daysSelect.addEventListener('change', load);
    load();
  `, user, "/kpi");
}

// ─── TAKT TIME / DWELL TIME ──────────────────────────────
export function taktPage(config: TenantConfig, user: SessionUser): string {
  return page("Takt Time", `
    main { flex: 1; padding: 16px; max-width: 900px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
    var LABELS = ${JSON.stringify(config.entity_labels)};
    var daysSelect = document.getElementById('days-select');
    var chartDiv = document.getElementById('takt-chart');
    var outlierCard = document.getElementById('outlier-card');
    var outlierList = document.getElementById('outlier-list');
    var emptyDiv = document.getElementById('empty');

    function fmtMin(m) {
      if (m == null || m === 0) return '—';
      if (m < 60) return Math.round(m) + 'm';
      var h = Math.floor(m / 60);
      var rm = Math.round(m % 60);
      return h + 'h ' + rm + 'm';
    }

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
  `, user, "/takt");
}

// ─── ADMIN PANEL ──────────────────────────────────────
export function adminPage(config: TenantConfig, user: SessionUser): string {
  const ROLES: string[] = ["user", "lead", "supervisor", "admin"];
  const SHOP_TYPES: string[] = ["cabinet", "metal", "wood"];
  return page("Admin", `
    main { flex: 1; padding: 16px; max-width: 700px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
          return '<div class="user-row' + cls + '" data-uid="' + u.id + '" data-name="' + esc(u.name) + '" data-email="' + esc(u.email) + '" data-role="' + u.role + '" data-home="' + (u.home_page || 'scan') + '" data-active="' + u.active + '">' +
            '<div>' +
              '<div class="name">' + esc(u.name) + (!u.active ? ' <span style="color:var(--error);font-size:0.7rem">(disabled)</span>' : '') + '</div>' +
              '<div class="email">' + esc(u.email) + '</div>' +
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

    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

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
  `, user, "/admin");
}

// ─── Workbench (Build Timer) ─────────────────────────────

export function workbenchPage(config: TenantConfig, user: SessionUser): string {
  return page("Build", `
    .wb-empty { text-align: center; padding: 3rem 1rem; color: var(--muted); }
    .wb-empty a { color: var(--accent); }
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
    .fixit-form { width: 100%; max-width: 440px; margin-top: 60px; display: flex; flex-direction: column; gap: 1rem; }
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
    <div id="no-session" class="wb-empty" style="display:none">
      <p>No active build session.</p>
      <p style="margin-top:0.75rem"><a href="/">Go to Scan to start a build</a></p>
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
    function escHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
    function fmtTime(totalSec) {
      var h = Math.floor(totalSec / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      var s = Math.floor(totalSec % 60);
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

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

      document.getElementById('cab-number').textContent = '${config.entity_labels.l3} #' + s.cabinet_number;
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

    fetch('/api/build/active').then(function(r) { return r.json(); }).then(function(data) {
      if (data.session) {
        renderSession(data.session);
      } else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('no-session').style.display = 'block';
      }
    });

    document.getElementById('pause-btn').addEventListener('click', function() {
      if (!sessionId) return;
      var action = isPaused ? 'resume' : 'pause';
      fetch('/api/build/' + sessionId + '/' + action, { method: 'POST' })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(r) {
          if (!r.ok) return;
          if (action === 'pause') {
            isPaused = true;
            pausedAtMs = Date.now();
            document.getElementById('pause-btn').textContent = 'Resume';
            document.getElementById('pause-btn').classList.add('is-paused');
            document.getElementById('timer-display').classList.add('paused');
            document.getElementById('timer-status').textContent = 'Paused';
          } else {
            totalPausedMs = (r.data.total_paused_seconds || 0) * 1000;
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
      fetch('/api/build/' + sessionId + '/complete', { method: 'POST' })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(r) {
          if (!r.ok) return;
          if (timerInterval) clearInterval(timerInterval);
          document.getElementById('workbench').style.display = 'none';
          var cv = document.getElementById('complete-view');
          cv.style.display = 'block';
          cv.innerHTML = '<div class="done-icon">✓</div>'
            + '<div class="done-time">' + r.data.working_minutes + ' min</div>'
            + '<div class="done-detail">Total elapsed: ' + r.data.total_minutes + ' min'
            + (r.data.total_paused_seconds > 0 ? ' (paused ' + Math.round(r.data.total_paused_seconds / 60 * 10) / 10 + ' min)' : '')
            + '</div>'
            + '<a href="/">Start Next Build →</a>';
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
  `, user, "/workbench");
}

// ─── My Workbench (Assembler Home) ───────────────────────

export function myWorkbenchPage(config: TenantConfig, user: SessionUser): string {
  const L3 = config.entity_labels.l3;
  return page("My Workbench", `
    main { flex: 1; padding: 16px; max-width: 480px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
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
    function escHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
    function fmtTime(totalSec) {
      if (totalSec < 0) totalSec = 0;
      var h = Math.floor(totalSec / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      var s = Math.floor(totalSec % 60);
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function fmtMin(m) {
      if (m == null) return '—';
      if (m < 60) return m + 'm';
      var h = Math.floor(m / 60);
      var rm = Math.round(m % 60);
      return h + 'h ' + rm + 'm';
    }
    function timeAgo(dateStr) {
      var ms = Date.now() - new Date(dateStr + 'Z').getTime();
      var min = Math.floor(ms / 60000);
      if (min < 60) return min + 'm ago';
      var hr = Math.floor(min / 60);
      if (hr < 24) return hr + 'h ago';
      return Math.floor(hr / 24) + 'd ago';
    }

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
              + '<div><span class="rr-time">' + fmtMin(r.working_minutes) + '</span> <span class="rr-ago">' + timeAgo(r.completed_at) + '</span></div>'
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
  `, user, "/");
}

// ─── FixIt Dashboard ─────────────────────────────────────

export function fixitPage(config: TenantConfig, user: SessionUser): string {
  const isLead = (["lead", "supervisor", "admin"] as UserRole[]).includes(user.role);
  return page("FixIt", `
    main { flex: 1; padding: 16px; max-width: 900px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .controls select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .controls .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .fixit-count { font-size: 0.85rem; color: var(--muted); }
    .fixit-list { display: flex; flex-direction: column; gap: 12px; }
    .fixit-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 14px; display: flex; flex-direction: column; gap: 10px;
    }
    .fixit-card.has-photo { border-left: 3px solid var(--accent); }
    .fixit-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .fixit-cause { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .cause-cnc_error { background: rgba(239,68,68,0.2); color: var(--error); }
    .cause-material_defect { background: rgba(245,158,11,0.2); color: var(--warning, #f59e0b); }
    .cause-transit_damage { background: rgba(59,130,246,0.2); color: var(--accent); }
    .cause-other { background: rgba(148,163,184,0.2); color: var(--muted); }
    .fixit-cab { font-weight: 700; font-size: 1rem; }
    .fixit-job { font-size: 0.8rem; color: var(--muted); }
    .fixit-desc { font-size: 0.85rem; color: var(--text); white-space: pre-line; }
    .fixit-photo-thumb { max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; }
    .fixit-meta { font-size: 0.75rem; color: var(--muted); display: flex; justify-content: space-between; }
    .fixit-resolve-btn { padding: 8px 16px; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--radius); background: var(--success); color: #fff; cursor: pointer; align-self: flex-start; }
    .fixit-resolve-btn:disabled { opacity: 0.5; }
    .resolve-form { display: flex; gap: 8px; align-items: center; }
    .resolve-form input { flex: 1; padding: 8px; font-size: 0.85rem; }
    .resolved-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(34,197,94,0.2); color: var(--success); }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--muted); }
    .photo-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 300; display: none; align-items: center; justify-content: center; cursor: pointer; }
    .photo-modal.active { display: flex; }
    .photo-modal img { max-width: 95vw; max-height: 90vh; border-radius: 4px; }
  `, `
  <main>
    <div class="controls">
      <span class="label">Status</span>
      <select id="status-select">
        <option value="open">Open</option>
        <option value="resolved">Resolved</option>
      </select>
      <span class="fixit-count" id="count"></span>
    </div>
    <div id="fixit-list" class="fixit-list"></div>
    <div id="empty" class="empty-state" style="display:none">No FixIt requests</div>
  </main>
  <div class="photo-modal" id="photo-modal"><img id="photo-modal-img" src=""></div>
  `, `
    var IS_LEAD = ${isLead};
    var ROOT_CAUSE_LABELS = {};
    var listDiv = document.getElementById('fixit-list');
    var emptyDiv = document.getElementById('empty');
    var countSpan = document.getElementById('count');
    var statusSelect = document.getElementById('status-select');
    var photoModal = document.getElementById('photo-modal');
    var photoModalImg = document.getElementById('photo-modal-img');

    function escHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

    function fmtDate(d) {
      if (!d) return '';
      var dt = new Date(d + 'Z');
      return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function load() {
      var status = statusSelect.value;
      fetch('/api/fixit?status=' + status)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          ROOT_CAUSE_LABELS = data.root_cause_labels || {};
          var reqs = data.requests || [];
          countSpan.textContent = reqs.length + ' request' + (reqs.length !== 1 ? 's' : '');

          if (reqs.length === 0) {
            listDiv.innerHTML = '';
            emptyDiv.style.display = 'block';
            return;
          }
          emptyDiv.style.display = 'none';

          listDiv.innerHTML = reqs.map(function(r) {
            var causeLabel = ROOT_CAUSE_LABELS[r.root_cause] || r.root_cause;
            var causeClass = 'cause-' + r.root_cause;
            var photoHtml = r.photo_key
              ? '<img class="fixit-photo-thumb" data-id="' + r.id + '" src="/api/fixit/' + r.id + '/photo" alt="Photo">'
              : '';
            var descHtml = r.description ? '<div class="fixit-desc">' + escHtml(r.description) + '</div>' : '';

            var actionHtml = '';
            if (r.status === 'open' && IS_LEAD) {
              actionHtml = '<div class="resolve-form">'
                + '<input type="text" class="input resolve-note" data-id="' + r.id + '" placeholder="Resolution note (optional)">'
                + '<button class="fixit-resolve-btn" data-id="' + r.id + '">Resolve</button>'
                + '</div>';
            }
            if (r.status === 'resolved') {
              actionHtml = '<div><span class="resolved-badge">Resolved</span> '
                + '<span style="font-size:0.75rem;color:var(--muted)">'
                + (r.resolved_by_name || '') + ' — ' + fmtDate(r.resolved_at)
                + (r.resolution_note ? ' — ' + escHtml(r.resolution_note) : '')
                + '</span></div>';
            }

            return '<div class="fixit-card' + (r.photo_key ? ' has-photo' : '') + '">'
              + '<div class="fixit-header">'
              +   '<div><span class="fixit-cab">${config.entity_labels.l3} #' + r.cabinet_number + (r.cabinet_label ? ' — ' + escHtml(r.cabinet_label) : '') + '</span></div>'
              +   '<span class="fixit-cause ' + causeClass + '">' + causeLabel + '</span>'
              + '</div>'
              + '<div class="fixit-job">' + r.job_number + ' — ' + escHtml(r.job_name) + '</div>'
              + descHtml
              + photoHtml
              + '<div class="fixit-meta"><span>By ' + escHtml(r.requested_by_name) + '</span><span>' + fmtDate(r.created_at) + '</span></div>'
              + actionHtml
              + '</div>';
          }).join('');

          listDiv.querySelectorAll('.fixit-resolve-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var id = btn.dataset.id;
              var noteInput = listDiv.querySelector('.resolve-note[data-id="' + id + '"]');
              btn.disabled = true;
              btn.textContent = 'Resolving...';
              fetch('/api/fixit/' + id + '/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolution_note: noteInput ? noteInput.value : '' }),
              }).then(function(r) { return r.json(); }).then(function(d) {
                if (d.ok) load();
                else { btn.disabled = false; btn.textContent = 'Resolve'; }
              });
            });
          });

          listDiv.querySelectorAll('.fixit-photo-thumb').forEach(function(img) {
            img.addEventListener('click', function() {
              photoModalImg.src = img.src;
              photoModal.classList.add('active');
            });
          });
        });
    }

    photoModal.addEventListener('click', function() { photoModal.classList.remove('active'); });
    statusSelect.addEventListener('change', load);
    load();
  `, user, "/fixit");
}
