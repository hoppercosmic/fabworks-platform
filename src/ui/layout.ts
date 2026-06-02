import type { TenantConfig, StationMenu, SessionUser, UserRole } from "../index";
import { OFFLINE_CLIENT_JS, OFFLINE_STYLES, OFFLINE_BANNER_HTML } from "../offline";

// ─── Inline SVG Icons (24x24, outlined) ──────────────────
const IC = (d: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const SVG_SCAN = IC('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>');
export const SVG_PLUS = IC('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>');
export const SVG_CHART = IC('<rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>');
export const SVG_TREND = IC('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>');
export const SVG_CLOCK = IC('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 14.5"/>');
export const SVG_GEAR = IC('<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>');
export const SVG_WRENCH = IC('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94L6.73 20.15a2.12 2.12 0 0 1-3-3l6.79-6.79A6 6 0 0 1 18.5 2.5z"/>');
export const SVG_ALERT = IC('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>');
export const SVG_QRCODE = IC('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="17" width="4" height="4"/><line x1="14" y1="14" x2="21" y2="14"/><line x1="21" y1="14" x2="21" y2="21"/>');

// Station menu icon library
const MENU_ICONS: Record<string, string> = {
  cpu: IC('<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/>'),
  wrench: IC('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94L6.73 20.15a2.12 2.12 0 0 1-3-3l6.79-6.79A6 6 0 0 1 18.5 2.5z"/>'),
  paint: IC('<path d="M19 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M12 11v6a2 2 0 0 0 4 0v-6"/>'),
  tool: IC('<path d="M15.7 4.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 0-1.4l8-8a1 1 0 0 1 1.4 0z"/><path d="M18 2l4 4-3 3-4-4z"/><line x1="2" y1="22" x2="8" y2="16"/>'),
  flow: IC('<polyline points="14 2 14 8 20 8"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M2 15h6"/><path d="M5 12l-3 3 3 3"/>'),
  box: IC('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  scan: IC('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>'),
};

function getMenuIcon(iconKey: string): string {
  return MENU_ICONS[iconKey] || MENU_ICONS.wrench;
}

// ─── Nav Items ───────────────────────────────────────────
export const ROLE_LEVELS: Record<UserRole, number> = { user: 0, lead: 1, supervisor: 2, admin: 3 };

type NavItem = { path: string; label: string; minRole: UserRole };

const TOOLS_NAV: NavItem[] = [
  { path: "/monitor",    label: "Monitor",   minRole: "lead" },
  { path: "/kpi",        label: "KPI",       minRole: "lead" },
  { path: "/takt",       label: "Takt",      minRole: "lead" },
  { path: "/reports",    label: "Reports",   minRole: "lead" },
  { path: "/fixit",      label: "FixIt",     minRole: "lead" },
  { path: "/jobs",       label: "Jobs",      minRole: "lead" },
  { path: "/qr",         label: "QR Codes",  minRole: "lead" },
];

function renderTopBar(currentPath: string, user: SessionUser, config: TenantConfig | null): string {
  const userLevel = ROLE_LEVELS[user.role];
  const isLead = userLevel >= ROLE_LEVELS.lead;

  const dashActive = currentPath === "/dashboard" ? " active" : "";
  const buildActive = currentPath === "/workbench" ? " active" : "";

  // Stations dropdown
  let stationsHtml = "";
  if (config && config.station_menus && config.station_menus.length > 0) {
    const visibleMenus = config.station_menus.filter((m: StationMenu) => userLevel >= ROLE_LEVELS[m.minRole]);
    if (visibleMenus.length > 0) {
      const isStationActive = visibleMenus.some((m: StationMenu) => currentPath === `/menu/${m.slug}`) || currentPath === "/stations";
      const menuLinks = visibleMenus.map((m: StationMenu) => {
        const active = currentPath === `/menu/${m.slug}`;
        return `<a href="/menu/${m.slug}" class="dd-item${active ? " active" : ""}">${m.name}</a>`;
      }).join("");
      const stagingActive = currentPath === "/staging";
      stationsHtml = `<div class="nav-dd"><button class="nav-btn${isStationActive || stagingActive ? " active" : ""}" id="stations-trigger"><span class="nav-icon">${SVG_SCAN}</span><span class="nav-label">Stations</span></button><div class="nav-dropdown" id="stations-dropdown">${menuLinks}<div class="dd-divider"></div><a href="/staging" class="dd-item${stagingActive ? " active" : ""}">Staging</a><a href="/stations" class="dd-item${currentPath === "/stations" ? " active" : ""}">Station View</a></div></div>`;
    }
  }

  // Tools dropdown (role-gated)
  const toolItems = TOOLS_NAV.filter(i => userLevel >= ROLE_LEVELS[i.minRole]);
  let toolsHtml = "";
  if (toolItems.length > 0) {
    const isToolActive = toolItems.some(i => currentPath === i.path);
    const toolLinks = toolItems.map(i => {
      const active = currentPath === i.path;
      return `<a href="${i.path}" class="dd-item${active ? " active" : ""}">${i.label}</a>`;
    }).join("");
    toolsHtml = `<div class="nav-dd"><button class="nav-btn${isToolActive ? " active" : ""}" id="tools-trigger"><span class="nav-icon">${SVG_TREND}</span><span class="nav-label">Tools</span></button><div class="nav-dropdown" id="tools-dropdown">${toolLinks}</div></div>`;
  }

  // User dropdown (expanded with role sections)
  const userLinks: string[] = [];
  userLinks.push(`<div class="dd-info"><div class="dd-name">${user.name}</div><div class="dd-role">${user.role}</div></div>`);
  userLinks.push(`<a href="/profile" class="dd-item${currentPath === "/profile" ? " active" : ""}">Profile</a>`);
  userLinks.push(`<a href="#" class="dd-item" id="set-home-link">Set as Home</a>`);
  if (userLevel >= ROLE_LEVELS.admin) {
    userLinks.push(`<div class="dd-divider"></div>`);
    userLinks.push(`<div class="dd-section">Admin</div>`);
    userLinks.push(`<a href="/admin" class="dd-item${currentPath === "/admin" ? " active" : ""}">System Settings</a>`);
  }
  if (userLevel >= ROLE_LEVELS.supervisor) {
    if (userLevel < ROLE_LEVELS.admin) userLinks.push(`<div class="dd-divider"></div>`);
    if (userLevel < ROLE_LEVELS.admin) userLinks.push(`<div class="dd-section">Supervisor</div>`);
  }
  userLinks.push(`<div class="dd-divider"></div>`);
  userLinks.push(`<a href="#" class="dd-item dd-logout" id="logout-link">Log out</a>`);

  return `<div class="top-bar">
    <div class="top-bar-title">FabWorks</div>
    <nav class="top-nav">
      <a href="/dashboard" class="nav-btn${dashActive}"><span class="nav-icon">${SVG_CHART}</span><span class="nav-label">Dash</span></a>
      <a href="/workbench" class="nav-btn${buildActive}"><span class="nav-icon">${SVG_WRENCH}</span><span class="nav-label">Build</span></a>
      ${stationsHtml}
      ${toolsHtml}
    </nav>
    <div class="nav-dd nav-dd-right">
      <button class="user-avatar" id="user-avatar-btn">${user.name.charAt(0).toUpperCase()}</button>
      <div class="nav-dropdown nav-dropdown-right" id="user-dropdown">${userLinks.join("")}</div>
    </div>
  </div>`;
}

// ─── Shared Styles ───────────────────────────────────────
export const SHARED_STYLES = `
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
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f1f5f9;
        --surface: #ffffff;
        --border: #cbd5e1;
        --text: #0f172a;
        --muted: #64748b;
        --accent: #2563eb;
        --success: #16a34a;
        --error: #dc2626;
        --warning: #d97706;
        --purple: #9333ea;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding-top: var(--nav-h);
    }
    .top-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center;
      padding-top: env(safe-area-inset-top);
      height: var(--nav-h);
    }
    .top-bar-title {
      flex-shrink: 0; padding: 0 12px; font-size: 0.85rem; font-weight: 700;
      color: var(--text); white-space: nowrap;
    }
    .top-nav {
      flex: 1; display: flex; align-items: center; gap: 2px; padding: 0 4px;
    }
    .nav-btn {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-width: 48px; padding: 6px 8px 4px;
      color: var(--muted); text-decoration: none; flex-shrink: 0;
      background: none; border: none; font-family: inherit; cursor: pointer;
      -webkit-tap-highlight-color: transparent; transition: color 0.15s;
    }
    .nav-btn.active { color: var(--accent); }
    .nav-icon { width: 22px; height: 22px; }
    .nav-icon svg { width: 22px; height: 22px; }
    .nav-label { font-size: 0.55rem; font-weight: 600; margin-top: 1px; letter-spacing: 0.02em; }
    .nav-dd { position: relative; flex-shrink: 0; }
    .nav-dd-right { padding: 0 10px; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--accent); color: white;
      font-weight: 700; font-size: 0.8rem; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .nav-dropdown {
      display: none; position: absolute; left: 0; top: 100%; margin-top: 4px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      min-width: 180px; z-index: 150; overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .nav-dropdown-right { left: auto; right: 0; }
    .nav-dropdown.open { display: block; }
    .dd-item { display: block; padding: 11px 14px; color: var(--text); text-decoration: none; font-size: 0.85rem; }
    .dd-item:hover { background: var(--bg); }
    .dd-item.active { color: var(--accent); font-weight: 600; }
    .dd-item.dd-logout { color: var(--error); }
    .dd-divider { height: 1px; background: var(--border); }
    .dd-info { padding: 12px 14px; border-bottom: 1px solid var(--border); }
    .dd-name { font-weight: 700; font-size: 0.9rem; }
    .dd-role { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .dd-section { padding: 8px 14px 4px; font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
    main {
      flex: 1; width: 100%; padding: 16px; margin: 0 auto;
      display: flex; flex-direction: column; gap: 16px;
      max-width: 100%;
    }
    @media (min-width: 768px) { main { padding: 24px 32px; max-width: 960px; } }
    @media (min-width: 1200px) { main { max-width: 1100px; } }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .card + .card { margin-top: 0; }
    #content { display: flex; flex-direction: column; gap: 16px; }
    .scroll-list {
      flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch;
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
      position: fixed; z-index: 180; right: 20px; bottom: 80px;
      border-radius: 28px; background: var(--surface); border: 1px solid var(--border);
      display: flex; flex-direction: column; overflow: hidden; cursor: grab;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
      transition: box-shadow 0.15s;
    }
    .qr-fab.dragging { cursor: grabbing; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .fab-btn {
      width: 52px; height: 48px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: white; -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    }
    .fab-btn:active { opacity: 0.8; }
    .fab-btn svg { width: 24px; height: 24px; }
    .fab-scan { background: var(--accent); }
    .fab-show { background: var(--purple); border-top: 1px solid rgba(255,255,255,0.15); }
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
    .fw-toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:var(--surface); color:var(--text); padding:10px 20px; border-radius:8px; font-size:0.85rem; font-weight:600; z-index:300; opacity:0; transition:opacity 0.3s; pointer-events:none; border:1px solid var(--border); max-width:90vw; text-align:center; }
    .fw-toast.show { opacity:1; }
    .fw-toast-success { background:#16a34a; border-color:#16a34a; }
    .fw-toast-error { background:#dc2626; border-color:#dc2626; }
    .fw-modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; align-items:center; justify-content:center; padding:16px; }
    .fw-modal.open { display:flex; }
    .fw-modal-panel { background:var(--surface); border-radius:12px; padding:20px; width:100%; max-width:400px; }
    .fw-modal-panel h3 { font-size:0.9rem; margin-bottom:12px; color:var(--text); }
    .fw-modal-panel textarea { width:100%; padding:10px; font-size:0.9rem; background:var(--bg); border:1px solid var(--border); border-radius:6px; color:var(--text); resize:vertical; box-sizing:border-box; font-family:inherit; }
    .fw-modal-actions { display:flex; gap:8px; margin-top:12px; }
    .fw-modal-actions button { flex:1; padding:10px; font-size:0.85rem; font-weight:600; border:none; border-radius:8px; cursor:pointer; }
    .fw-modal-save { background:var(--accent); color:white; }
    .fw-modal-cancel { background:var(--bg); color:var(--text); border:1px solid var(--border) !important; }
    .fw-status-row { font-size:0.8rem; padding:6px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
    .fw-status-row:last-child { border-bottom:none; }
    .fw-status-label { font-weight:600; font-size:0.8rem; margin-bottom:4px; color:var(--muted); }
    .fw-status-value { font-size:0.9rem; margin-bottom:12px; }
    .fw-flag-badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:600; background:var(--warning); color:#000; margin-right:4px; }
`;

// ─── Page Layout ─────────────────────────────────────────
const USER_MENU_JS = `
    // --- Dropdown toggle system ---
    (function() {
      var dropdowns = document.querySelectorAll('.nav-dropdown');
      var triggers = [
        { btn: document.getElementById('stations-trigger'), dd: document.getElementById('stations-dropdown') },
        { btn: document.getElementById('tools-trigger'), dd: document.getElementById('tools-dropdown') },
        { btn: document.getElementById('user-avatar-btn'), dd: document.getElementById('user-dropdown') }
      ];
      function closeAll(except) {
        dropdowns.forEach(function(d) { if (d !== except) d.classList.remove('open'); });
      }
      triggers.forEach(function(t) {
        if (t.btn && t.dd) {
          t.btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var opening = !t.dd.classList.contains('open');
            closeAll(t.dd);
            t.dd.classList.toggle('open');
          });
        }
      });
      document.addEventListener('click', function() { closeAll(); });
    })();

    // --- Logout ---
    document.getElementById('logout-link').addEventListener('click', function(e) {
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST' }).then(function() { window.location.href = '/login'; });
    });

    // --- Set as Home ---
    (function() {
      var _setHome = document.getElementById('set-home-link');
      if (!_setHome) return;
      var _pathMap = { '/scan': 'scan', '/': 'scan', '/workbench': 'workbench', '/fixit': 'fixit', '/stations': 'staging', '/dashboard': 'dashboard' };
      var _homePage = _pathMap[window.location.pathname];
      if (!_homePage) { _setHome.style.display = 'none'; return; }
      _setHome.addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/api/auth/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home_page: _homePage }) })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d.ok) {
              _setHome.textContent = 'Home set \\u2713';
              setTimeout(function() { _setHome.textContent = 'Set as Home'; }, 1200);
            }
          });
      });
    })();

    // --- Floating QR FAB ---
    (function() {
      var fab = document.getElementById('qr-fab');
      if (!fab) return;
      var saved = localStorage.getItem('fw_fab_pos');
      var pos = saved ? JSON.parse(saved) : { right: 20, bottom: 80 };
      fab.style.right = pos.right + 'px';
      fab.style.bottom = pos.bottom + 'px';

      var dragging = false, startX = 0, startY = 0, startRight = 0, startBottom = 0, moved = false, tapTarget = null;

      function onStart(cx, cy, target) {
        dragging = true; moved = false; tapTarget = target;
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
        var r = Math.max(0, Math.min(window.innerWidth - 52, startRight + dx));
        var b = Math.max(0, Math.min(window.innerHeight - 96, startBottom + dy));
        fab.style.right = r + 'px'; fab.style.bottom = b + 'px';
      }
      function onEnd() {
        if (!dragging) return;
        dragging = false; fab.classList.remove('dragging');
        if (moved) {
          pos = { right: parseInt(fab.style.right), bottom: parseInt(fab.style.bottom) };
          localStorage.setItem('fw_fab_pos', JSON.stringify(pos));
        } else {
          var btn = tapTarget && tapTarget.closest ? tapTarget.closest('.fab-btn') : null;
          if (btn && btn.id === 'fab-show-btn') { showPageQR(); }
          else { openGlobalScanner(); }
        }
      }

      fab.addEventListener('touchstart', function(e) { e.preventDefault(); var t = e.touches[0]; onStart(t.clientX, t.clientY, e.target); }, { passive: false });
      document.addEventListener('touchmove', function(e) { if (dragging) { e.preventDefault(); var t = e.touches[0]; onMove(t.clientX, t.clientY); } }, { passive: false });
      document.addEventListener('touchend', onEnd);
      fab.addEventListener('mousedown', function(e) { e.preventDefault(); onStart(e.clientX, e.clientY, e.target); });
      document.addEventListener('mousemove', function(e) { onMove(e.clientX, e.clientY); });
      document.addEventListener('mouseup', onEnd);

      // --- Show QR for current page ---
      var fabSpot = document.getElementById('fab-spotlight');
      var fabSpotCanvas = document.getElementById('fab-spot-canvas');
      var fabSpotTitle = document.getElementById('fab-spot-title');
      var fabSpotSub = document.getElementById('fab-spot-sub');
      fabSpot.addEventListener('click', function() { fabSpot.style.display = 'none'; });

      function showPageQR() {
        var path = window.location.pathname;
        var code = 'fw:page:' + path;
        var title = document.title.replace('FabWorks — ', '');
        var pathParts = path.split('/').filter(Boolean);
        if (pathParts[0] === 'stations' && pathParts[1]) code = 'fw:sta:' + pathParts[1];
        else if (pathParts[0] === 'jobs' && pathParts[1]) code = 'fw:l1:' + pathParts[1] + ':' + title;

        var s = document.createElement('script');
        function doRender() {
          fabSpotTitle.textContent = title;
          fabSpotSub.textContent = code;
          QRCode.toDataURL(code, { width: 600, margin: 2 }, function(err, url) {
            fabSpotCanvas.src = url;
            fabSpotCanvas.style.width = 'min(80vw, 300px)';
            fabSpotCanvas.style.height = 'min(80vw, 300px)';
            fabSpot.style.display = 'flex';
          });
        }
        if (typeof QRCode !== 'undefined') { doRender(); return; }
        s.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
        s.onload = doRender;
        document.head.appendChild(s);
      }

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

      function showGlobalToast(msg, type) {
        var t = document.getElementById('fw-global-toast');
        if (!t) {
          t = document.createElement('div');
          t.id = 'fw-global-toast';
          t.className = 'fw-toast';
          document.body.appendChild(t);
        }
        t.textContent = msg;
        t.className = 'fw-toast' + (type ? ' fw-toast-' + type : '');
        t.classList.add('show');
        clearTimeout(t._timer);
        t._timer = setTimeout(function() { t.classList.remove('show'); }, 3000);
      }

      function resolveJobCab(jobCabStr, callback) {
        var bp = jobCabStr.split('-');
        var jobNum = bp[0];
        var cabNum = bp.length > 1 ? bp[1] : null;
        fetch('/api/jobs?status=active')
          .then(function(r) { return r.json(); })
          .then(function(jobs) {
            var job = jobs.find(function(j) { return j.job_number === jobNum; });
            if (!job) { showGlobalToast('Job ' + jobNum + ' not found', 'error'); return; }
            return fetch('/api/jobs/' + job.id).then(function(r) { return r.json(); });
          })
          .then(function(detail) {
            if (!detail || detail.error) return;
            var cab = cabNum
              ? detail.cabinets.find(function(c) { return String(c.cabinet_number) === cabNum; })
              : detail.cabinets[0];
            if (!cab) { showGlobalToast('Cabinet not found in job ' + jobNum, 'error'); return; }
            callback(detail, cab);
          });
      }

      // --- Note modal wiring ---
      var noteModal = document.getElementById('fw-note-modal');
      var noteInput = document.getElementById('fw-note-input');
      var noteTitle = document.getElementById('fw-note-title');
      var notePendingCabId = null;
      if (noteModal) {
        document.getElementById('fw-note-cancel').addEventListener('click', function() {
          noteModal.classList.remove('open');
          noteInput.value = '';
          notePendingCabId = null;
        });
        document.getElementById('fw-note-save').addEventListener('click', function() {
          var content = noteInput.value.trim();
          if (!content || !notePendingCabId) return;
          fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context_type: 'cabinet', context_id: String(notePendingCabId), content: content })
          }).then(function(r) {
            if (r.ok) {
              noteModal.classList.remove('open');
              noteInput.value = '';
              notePendingCabId = null;
              showGlobalToast('Note saved', 'success');
            } else {
              showGlobalToast('Failed to save note', 'error');
            }
          }).catch(function() {
            showGlobalToast('Failed to save note', 'error');
          });
        });
        noteModal.addEventListener('click', function(e) { if (e.target === noteModal) { noteModal.classList.remove('open'); noteInput.value = ''; notePendingCabId = null; } });
      }

      // --- Status modal wiring ---
      var statusModal = document.getElementById('fw-status-modal');
      if (statusModal) {
        statusModal.addEventListener('click', function(e) { if (e.target === statusModal) statusModal.classList.remove('open'); });
      }

      // --- Pause/event modal wiring ---
      var pauseModal = document.getElementById('fw-pause-modal');
      var pauseAction = document.getElementById('fw-pause-action');
      var pauseNote = document.getElementById('fw-pause-note');
      var pausePendingCabId = null;
      if (pauseModal) {
        document.getElementById('fw-pause-cancel').addEventListener('click', function() {
          pauseModal.classList.remove('open'); pauseNote.value = ''; pausePendingCabId = null;
        });
        pauseModal.addEventListener('click', function(e) { if (e.target === pauseModal) { pauseModal.classList.remove('open'); pauseNote.value = ''; pausePendingCabId = null; } });
        document.getElementById('fw-pause-save').addEventListener('click', function() {
          if (!pausePendingCabId) return;
          var actionVal = pauseAction.value;
          var noteVal = pauseNote.value.trim();
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cabinet_id: pausePendingCabId, action_type: actionVal, note: noteVal })
          }).then(function(r) {
            if (r.ok) {
              pauseModal.classList.remove('open'); pauseNote.value = ''; pausePendingCabId = null;
              var actionLabel = pauseAction.options[pauseAction.selectedIndex].text;
              showGlobalToast('Event logged: ' + actionLabel, 'success');
            } else { showGlobalToast('Failed to log event', 'error'); }
          }).catch(function() { showGlobalToast('Failed to log event', 'error'); });
        });
      }

      // --- Notes/data-sheet modal wiring ---
      var notesModal = document.getElementById('fw-notes-modal');
      if (notesModal) {
        document.getElementById('fw-notes-close').addEventListener('click', function() { notesModal.classList.remove('open'); });
        notesModal.addEventListener('click', function(e) { if (e.target === notesModal) notesModal.classList.remove('open'); });
        document.getElementById('fw-notes-addnote').addEventListener('click', function() {
          var cabId = notesModal.dataset.cabId;
          if (!cabId) return;
          notesModal.classList.remove('open');
          noteTitle.textContent = 'Note for Cabinet';
          notePendingCabId = parseInt(cabId);
          noteInput.value = '';
          noteModal.classList.add('open');
          setTimeout(function() { noteInput.focus(); }, 100);
        });
      }

      function onGlobalQR(text) {
        stopGlobalScanner();
        if (!text || !text.startsWith('fw:')) {
          if (typeof window._fabworksHandleQR === 'function') {
            window._fabworksHandleQR(text);
          }
          return;
        }
        var parts = text.split(':');
        var action = parts[1];

        if (action === 'build' && parts[2]) {
          resolveJobCab(parts[2], function(detail, cab) {
            fetch('/api/build/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cabinet_id: cab.id })
            }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
            .then(function(r) {
              if (r.ok || r.data.active_session_id) {
                window.location.href = '/workbench';
              } else {
                showGlobalToast(r.data.error || 'Failed to start build', 'error');
              }
            });
          });
          return;
        }

        if (action === 'info' && parts[2]) {
          resolveJobCab(parts[2], function(detail, cab) {
            window.location.href = '/cabinet/' + cab.id;
          });
          return;
        }

        if (action === 'scan' && parts[2]) {
          var stationSlug = parts[3];
          if (!stationSlug) { showGlobalToast('Missing station in scan code', 'error'); return; }
          resolveJobCab(parts[2], function(detail, cab) {
            fetch('/api/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ station: stationSlug, job_id: detail.id, cabinet_id: cab.id })
            }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
            .then(function(r) {
              if (r.ok) {
                showGlobalToast('Scanned #' + cab.cabinet_number + ' at ' + (r.data.station_name || stationSlug), 'success');
              } else {
                showGlobalToast(r.data.error || 'Scan failed', 'error');
              }
            });
          });
          return;
        }

        if (action === 'note' && parts[2]) {
          resolveJobCab(parts[2], function(detail, cab) {
            var label = cab.label || ('#' + cab.cabinet_number);
            noteTitle.textContent = 'Note for ' + label + ' (' + detail.job_number + ')';
            notePendingCabId = cab.id;
            noteInput.value = '';
            noteModal.classList.add('open');
            setTimeout(function() { noteInput.focus(); }, 100);
          });
          return;
        }

        if (action === 'status' && parts[2]) {
          resolveJobCab(parts[2], function(detail, cab) {
            fetch('/api/cabinets/' + cab.id)
              .then(function(r) { return r.json(); })
              .then(function(data) {
                var label = data.cabinet.label || ('#' + data.cabinet.cabinet_number);
                document.getElementById('fw-status-title').textContent = label + ' — ' + detail.job_number;
                var flags = [];
                try { flags = JSON.parse(data.cabinet.flags || '[]'); } catch(e) {}
                var flagHtml = flags.length
                  ? flags.map(function(f) { return '<span class="fw-flag-badge">' + escHtml(f) + '</span>'; }).join(' ')
                  : '<span style="color:var(--muted)">None</span>';
                var statusText = data.cabinet.status ? data.cabinet.status.replace(/_/g, ' ') : 'pending';
                statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
                var scansHtml = '';
                var scans = data.scans || [];
                if (scans.length) {
                  scansHtml = scans.slice(0, 5).map(function(s) {
                    return '<div class="fw-status-row"><span>' + escHtml(s.station || '') + (s.scanned_by ? ' — ' + escHtml(s.scanned_by) : '') + '</span><span style="color:var(--muted);font-size:0.7rem">' + timeAgo(new Date(s.scanned_at + 'Z')) + '</span></div>';
                  }).join('');
                } else {
                  scansHtml = '<div style="color:var(--muted);font-size:0.8rem;padding:6px 0">No scans yet</div>';
                }
                document.getElementById('fw-status-body').innerHTML =
                  '<div class="fw-status-label">Status</div><div class="fw-status-value">' + escHtml(statusText) + '</div>' +
                  '<div class="fw-status-label">Flags</div><div class="fw-status-value">' + flagHtml + '</div>' +
                  '<div class="fw-status-label">Recent Scans</div>' + scansHtml;
                statusModal.classList.add('open');
              });
          });
          return;
        }

        if (action === 'pause' && parts[2]) {
          resolveJobCab(parts[2], function(detail, cab) {
            var label = cab.label || ('#' + cab.cabinet_number);
            document.getElementById('fw-pause-title').textContent = 'Event — ' + label + ' (' + detail.job_number + ')';
            pausePendingCabId = cab.id;
            pauseAction.value = 'pause_build';
            pauseNote.value = '';
            pauseModal.classList.add('open');
            setTimeout(function() { pauseNote.focus(); }, 100);
          });
          return;
        }

        if (action === 'notes' && parts[2]) {
          resolveJobCab(parts[2], function(detail, cab) {
            var label = cab.label || ('#' + cab.cabinet_number);
            document.getElementById('fw-notes-title').textContent = label + ' — ' + detail.job_number;
            notesModal.dataset.cabId = String(cab.id);
            document.getElementById('fw-notes-body').innerHTML = '<div style="color:var(--muted);font-size:0.85rem">Loading…</div>';
            notesModal.classList.add('open');
            Promise.all([
              fetch('/api/cabinets/' + cab.id).then(function(r) { return r.json(); }),
              fetch('/api/notes?context_type=cabinet&context_id=' + cab.id).then(function(r) { return r.json(); })
            ]).then(function(results) {
              var data = results[0];
              var notesData = results[1];
              var c2 = data.cabinet || {};
              var props = {};
              try { props = JSON.parse(c2.properties || '{}'); } catch(e) {}
              var flags = [];
              try { flags = JSON.parse(c2.flags || '[]'); } catch(e) {}
              var html = '';
              html += '<div class="fw-status-label">Status</div><div class="fw-status-value">' + escHtml((c2.status || 'pending').replace(/_/g,' ')) + '</div>';
              if (flags.length) {
                html += '<div class="fw-status-label">Flags</div><div class="fw-status-value">' + flags.map(function(f) { return '<span class="fw-flag-badge">' + escHtml(f) + '</span>'; }).join(' ') + '</div>';
              }
              var propKeys = Object.keys(props);
              if (propKeys.length) {
                html += '<div class="fw-status-label">Properties</div><div class="fw-status-value" style="font-size:0.8rem">';
                propKeys.forEach(function(k) { html += '<div><b>' + escHtml(k) + ':</b> ' + escHtml(String(props[k])) + '</div>'; });
                html += '</div>';
              }
              if (c2.accessories) {
                html += '<div class="fw-status-label">Accessories</div><div class="fw-status-value">' + escHtml(c2.accessories) + '</div>';
              }
              if (c2.assembly_sheet_url) {
                html += '<div class="fw-status-label">Assembly Sheet</div><div class="fw-status-value"><a href="' + escHtml(c2.assembly_sheet_url) + '" target="_blank" style="color:var(--accent)">' + escHtml(c2.assembly_sheet_url) + '</a></div>';
              }
              var notes = Array.isArray(notesData) ? notesData : (notesData.notes || []);
              if (notes.length) {
                html += '<div class="fw-status-label">Production Notes</div>';
                notes.forEach(function(n) {
                  html += '<div class="fw-status-row"><div>' + escHtml(n.content || '') + '</div><div style="color:var(--muted);font-size:0.7rem;margin-top:2px">' + escHtml(n.author_name || '') + '</div></div>';
                });
              }
              var scans = data.scans || [];
              if (scans.length) {
                html += '<div class="fw-status-label">Recent Scans</div>';
                scans.slice(0, 5).forEach(function(s) {
                  html += '<div class="fw-status-row"><span>' + escHtml(s.station || '') + (s.scanned_by ? ' — ' + escHtml(s.scanned_by) : '') + '</span><span style="color:var(--muted);font-size:0.7rem">' + timeAgo(new Date(s.scanned_at + 'Z')) + '</span></div>';
                });
              }
              document.getElementById('fw-notes-body').innerHTML = html;
            });
          });
          return;
        }

        if (action === 'menu' && parts[2]) {
          window.location.href = '/menu/' + parts[2];
          return;
        }

        if (action === 'cmd') {
          var cmd = parts[2];
          if (cmd === 'staging') { window.location.href = '/staging'; return; }
          if (cmd === 'dashboard') { window.location.href = '/dashboard'; return; }
          if (cmd === 'whoami') { window.location.href = '/profile'; return; }
          if (cmd === 'status') { window.location.href = '/dashboard'; return; }
        }

        if (typeof window._fabworksHandleQR === 'function') {
          window._fabworksHandleQR(text);
        } else {
          window.location.href = '/scan?qr=' + encodeURIComponent(text);
        }
      }
    })();
`;

function renderStandaloneBar(user: SessionUser): string {
  return `<div class="standalone-bar">
    <span class="standalone-title">FabWorks Scan</span>
    <span class="standalone-user">${user.name.charAt(0).toUpperCase()}</span>
  </div>`;
}

export function page(title: string, extraStyles: string, body: string, script: string, user: SessionUser | null, currentPath: string, cdnScripts: string[] = [], config: TenantConfig | null = null): string {
  const isStandalone = config?.isStandalone || false;
  const cdnTags = cdnScripts.map((src) => `<script src="${src}"></script>`).join("\n  ");
  const scannerHtml = user ? `
  <div class="qr-fab" id="qr-fab">
    <button class="fab-btn fab-scan" id="fab-scan-btn" title="Scan QR code">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <line x1="7" y1="12" x2="17" y2="12"/><line x1="12" y1="7" x2="12" y2="17"/>
      </svg>
    </button>
    <button class="fab-btn fab-show" id="fab-show-btn" title="Show QR for this page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="17" width="4" height="4"/>
        <line x1="14" y1="14" x2="21" y2="14"/><line x1="21" y1="14" x2="21" y2="21"/>
      </svg>
    </button>
  </div>
  <div class="scanner-overlay" id="scanner-overlay">
    <button class="scanner-close" id="scanner-close">&times;</button>
    <div id="qr-reader"></div>
    <div class="scanner-status" id="scanner-status">Point camera at a FabWorks QR code</div>
  </div>
  <div class="qr-spotlight" id="fab-spotlight" style="display:none;position:fixed;inset:0;background:white;z-index:250;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:20px;">
    <img id="fab-spot-canvas" alt="QR Code" />
    <div style="font-size:1.4rem;font-weight:700;color:#111;margin-top:16px" id="fab-spot-title"></div>
    <div style="font-size:0.9rem;color:#666;margin-top:4px" id="fab-spot-sub"></div>
    <div style="font-size:0.75rem;color:#999;margin-top:24px">Tap anywhere to close</div>
  </div>
  <div class="fw-modal" id="fw-note-modal">
    <div class="fw-modal-panel">
      <h3 id="fw-note-title">Add Note</h3>
      <textarea id="fw-note-input" placeholder="Type your note..." rows="4"></textarea>
      <div class="fw-modal-actions">
        <button class="fw-modal-cancel" id="fw-note-cancel">Cancel</button>
        <button class="fw-modal-save" id="fw-note-save">Save</button>
      </div>
    </div>
  </div>
  <div class="fw-modal" id="fw-status-modal">
    <div class="fw-modal-panel">
      <h3 id="fw-status-title">Cabinet Status</h3>
      <div id="fw-status-body"></div>
    </div>
  </div>
  <div class="fw-modal" id="fw-pause-modal">
    <div class="fw-modal-panel">
      <h3 id="fw-pause-title">Log Event</h3>
      <div style="margin-bottom:10px">
        <label style="margin-bottom:6px">Action</label>
        <select id="fw-pause-action" style="width:100%;padding:10px;font-size:0.9rem;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
          <option value="pause_build">Pause Build</option>
          <option value="quality_issue">Quality Issue</option>
          <option value="hold">Put on Hold</option>
          <option value="remake">Mark for Remake</option>
          <option value="missing_part">Missing Part</option>
          <option value="escalate">Escalate</option>
          <option value="custom">Custom Note</option>
        </select>
      </div>
      <textarea id="fw-pause-note" placeholder="Add a note (optional)..." rows="3" style="width:100%;padding:10px;font-size:0.9rem;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
      <div class="fw-modal-actions">
        <button class="fw-modal-cancel" id="fw-pause-cancel">Cancel</button>
        <button class="fw-modal-save" id="fw-pause-save">Log Event</button>
      </div>
    </div>
  </div>
  <div class="fw-modal" id="fw-notes-modal">
    <div class="fw-modal-panel" style="max-width:480px;max-height:80vh;overflow-y:auto">
      <h3 id="fw-notes-title" style="margin-bottom:12px">Part Data</h3>
      <div id="fw-notes-body"></div>
      <div class="fw-modal-actions" style="margin-top:12px">
        <button class="fw-modal-cancel" id="fw-notes-close">Close</button>
        <button class="fw-modal-save" id="fw-notes-addnote">Add Note</button>
      </div>
    </div>
  </div>` : "";
  const navHtml = user
    ? (isStandalone ? renderStandaloneBar(user) : renderTopBar(currentPath, user, config))
    : `<div style="padding:0"></div>`;
  const bodyPadding = user
    ? (isStandalone ? 'body{padding-top:52px;} .standalone-bar{position:fixed;top:0;left:0;right:0;z-index:100;height:52px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 16px;padding-top:env(safe-area-inset-top);} .standalone-title{font-size:0.95rem;font-weight:700;color:var(--text);} .standalone-user{width:32px;height:32px;border-radius:50%;background:var(--accent);color:white;font-weight:700;font-size:0.8rem;display:flex;align-items:center;justify-content:center;}' : '')
    : 'body{padding-top:0;}';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#f1f5f9" media="(prefers-color-scheme: light)">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${isStandalone ? 'FW Scan' : 'FabWorks'}">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/icon-192.svg">
  <link rel="apple-touch-icon" href="/icon-192.svg">
  <title>${isStandalone ? 'FabWorks Scan' : 'FabWorks — ' + title}</title>
  <style>${SHARED_STYLES}${OFFLINE_STYLES}${bodyPadding}${extraStyles}</style>
</head>
<body>
  ${navHtml}
  ${OFFLINE_BANNER_HTML}
  ${scannerHtml}
  ${body}
  ${cdnTags}
  <script>${user ? USER_MENU_JS : ""}${OFFLINE_CLIENT_JS}${script}</script>
</body>
</html>`;
}

export function stationNamesJS(config: TenantConfig): string {
  const map: Record<string, string> = {};
  config.stations.forEach((s) => { map[s.slug] = s.name; });
  return `var STATION_NAMES = ${JSON.stringify(map)};`;
}

export function displayStatusJS(config: TenantConfig): string {
  const map: Record<string, string> = { pending: "Pending", in_progress: "In Progress", complete: "Complete" };
  config.l3_statuses.forEach((s) => {
    if (!map[s]) map[s] = s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
  });
  return `function displayStatus(s) { var m = ${JSON.stringify(map)}; return m[s] || s; }`;
}

export const SHARED_JS = `
    function escHtml(s) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
    function timeAgo(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }
    function fmtTime(totalSec) {
      if (totalSec < 0) totalSec = 0;
      var h = Math.floor(totalSec / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      var s = Math.floor(totalSec % 60);
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function fmtMin(m) {
      if (m == null || m === 0) return '\\u2014';
      if (m < 60) return Math.round(m) + 'm';
      var h = Math.floor(m / 60);
      var rm = Math.round(m % 60);
      return h + 'h ' + rm + 'm';
    }
`;

export const STATUS_COLOR_JS = `
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
