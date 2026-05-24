// Service Worker script served at /sw.js
// and client-side offline queue JS injected into pages

const SW_VERSION = "v1";

export const SERVICE_WORKER_JS = `
'use strict';
var CACHE_NAME = 'fabworks-${SW_VERSION}';
var API_CACHE = 'fabworks-api-${SW_VERSION}';
var DB_NAME = 'fabworks-offline-queue';
var STORE_NAME = 'pending';

// --- IndexedDB helpers ---
function openDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function(e) { reject(e.target.error); };
  });
}

function queueRequest(entry) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function getAllQueued() {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function removeQueued(id) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function updateQueued(entry) {
  return queueRequest(entry);
}

// --- Cache strategies ---

function isPageRequest(url) {
  var path = new URL(url).pathname;
  if (path.startsWith('/api/')) return false;
  if (path === '/manifest.json' || path.endsWith('.svg') || path === '/sw.js') return false;
  return true;
}

function isApiGet(request) {
  return request.method === 'GET' && new URL(request.url).pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  var path = new URL(url).pathname;
  return path === '/manifest.json' || path.endsWith('.svg');
}

function isMutation(request) {
  return request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE';
}

// Network-first with cache fallback
function networkFirst(request, cacheName) {
  return fetch(request.clone()).then(function(response) {
    if (response.ok) {
      var responseClone = response.clone();
      caches.open(cacheName).then(function(cache) {
        cache.put(request, responseClone);
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      if (cached) return cached;
      if (isPageRequest(request.url)) {
        return new Response(offlinePage(), {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });
}

// Cache-first for static assets
function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return response;
    });
  });
}

// Queue mutations that fail
function handleMutation(request) {
  var requestClone = request.clone();
  return fetch(request).catch(function() {
    return requestClone.text().then(function(body) {
      var entry = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2),
        url: requestClone.url,
        method: requestClone.method,
        headers: Object.fromEntries(requestClone.headers.entries()),
        body: body,
        timestamp: Date.now(),
        retries: 0,
        type: classifyRequest(requestClone.url, requestClone.method)
      };
      return queueRequest(entry).then(function() {
        notifyClients({ type: 'queued', entry: { id: entry.id, url: entry.url, queueType: entry.type, timestamp: entry.timestamp } });
        return new Response(JSON.stringify({ ok: true, offline_queued: true, queue_id: entry.id }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    });
  });
}

function classifyRequest(url, method) {
  var path = new URL(url).pathname;
  if (path.includes('/api/scan')) return 'scan';
  if (path.includes('/api/build')) return 'timer';
  if (path.includes('/api/fixit')) return 'fixit';
  return 'metadata';
}

function offlinePage() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FabWorks — Offline</title><style>body{font-family:-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}.card{background:#1e293b;border-radius:16px;padding:40px;max-width:320px}.icon{font-size:3rem;margin-bottom:16px}h2{margin:0 0 12px}p{color:#94a3b8;margin:0 0 20px;font-size:0.9rem}button{background:#3b82f6;color:white;border:none;border-radius:8px;padding:12px 24px;font-size:1rem;cursor:pointer}button:active{background:#2563eb}</style></head><body><div class="card"><div class="icon">&#x1F4E1;</div><h2>You are offline</h2><p>FabWorks will reconnect automatically. Pending actions will sync when the network returns.</p><button onclick="location.reload()">Retry</button></div></body></html>';
}

// --- Sync / drain queue ---

function drainQueue() {
  return getAllQueued().then(function(items) {
    items.sort(function(a, b) { return a.timestamp - b.timestamp; });
    return items.reduce(function(chain, item) {
      return chain.then(function() { return replayItem(item); });
    }, Promise.resolve());
  });
}

function replayItem(item) {
  var headers = Object.assign({}, item.headers, { 'X-Offline-Queued': 'true', 'X-Request-Id': item.id });
  var opts = { method: item.method, headers: headers };
  if (item.body && item.method !== 'GET') opts.body = item.body;
  return fetch(item.url, opts).then(function(response) {
    if (response.ok || (response.status >= 400 && response.status < 500)) {
      return removeQueued(item.id).then(function() {
        notifyClients({ type: 'synced', id: item.id, status: response.status, ok: response.ok });
      });
    }
    item.retries = (item.retries || 0) + 1;
    if (item.retries >= 5) {
      return removeQueued(item.id).then(function() {
        notifyClients({ type: 'failed', id: item.id, reason: 'max_retries' });
      });
    }
    return updateQueued(item);
  }).catch(function() {
    // Still offline, leave in queue
  });
}

function notifyClients(msg) {
  self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) { client.postMessage(msg); });
  });
}

// --- Event handlers ---

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(['/manifest.json', '/icon-192.svg', '/icon-512.svg']);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME && n !== API_CACHE; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var request = e.request;
  if (request.url.includes('/sw.js')) return;
  if (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html') && isPageRequest(request.url)) {
    e.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }
  if (isStaticAsset(request.url)) {
    e.respondWith(cacheFirst(request));
    return;
  }
  if (isApiGet(request)) {
    e.respondWith(networkFirst(request, API_CACHE));
    return;
  }
  if (isMutation(request)) {
    e.respondWith(handleMutation(request));
    return;
  }
});

self.addEventListener('sync', function(e) {
  if (e.tag === 'fabworks-sync') {
    e.waitUntil(drainQueue());
  }
});

self.addEventListener('message', function(e) {
  if (e.data === 'drain-queue') {
    e.waitUntil(drainQueue());
  }
  if (e.data === 'get-queue') {
    getAllQueued().then(function(items) {
      e.source.postMessage({ type: 'queue-state', items: items.map(function(i) {
        return { id: i.id, url: i.url, type: i.type, timestamp: i.timestamp, retries: i.retries };
      })});
    });
  }
});
`;

// Client-side offline queue awareness JS — injected into SHARED_JS
export const OFFLINE_CLIENT_JS = `
    // --- Offline awareness ---
    var _fwOffline = !navigator.onLine;
    var _fwPendingCount = 0;

    function _fwShowOfflineBanner(show) {
      var banner = document.getElementById('fw-offline-banner');
      if (banner) banner.style.display = show ? 'flex' : 'none';
    }

    function _fwUpdatePendingBadge(count) {
      _fwPendingCount = count;
      var badge = document.getElementById('fw-pending-badge');
      if (badge) {
        badge.textContent = count > 0 ? count + ' pending' : '';
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    }

    window.addEventListener('online', function() {
      _fwOffline = false;
      _fwShowOfflineBanner(false);
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('drain-queue');
      }
    });

    window.addEventListener('offline', function() {
      _fwOffline = true;
      _fwShowOfflineBanner(true);
    });

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', function(e) {
        var d = e.data;
        if (!d || !d.type) return;
        if (d.type === 'queued') {
          _fwPendingCount++;
          _fwUpdatePendingBadge(_fwPendingCount);
        }
        if (d.type === 'synced' || d.type === 'failed') {
          _fwPendingCount = Math.max(0, _fwPendingCount - 1);
          _fwUpdatePendingBadge(_fwPendingCount);
          if (d.type === 'synced' && d.ok) {
            _fwToast('Synced offline action', 'success');
          }
          if (d.type === 'failed') {
            _fwToast('Failed to sync action', 'error');
          }
        }
        if (d.type === 'queue-state') {
          _fwUpdatePendingBadge(d.items.length);
        }
      });
      navigator.serviceWorker.ready.then(function(reg) {
        if (reg.active) reg.active.postMessage('get-queue');
      });
    }

    function _fwToast(msg, type) {
      var t = document.createElement('div');
      t.className = 'fw-toast fw-toast-' + (type || 'info');
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function() { t.classList.add('fw-toast-show'); }, 10);
      setTimeout(function() { t.remove(); }, 3000);
    }

    if (_fwOffline) _fwShowOfflineBanner(true);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
`;

// CSS for offline banner and toast notifications
export const OFFLINE_STYLES = `
    #fw-offline-banner{display:none;position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#000;padding:6px 16px;font-size:0.8rem;font-weight:600;z-index:9999;align-items:center;justify-content:center;gap:8px}
    #fw-offline-banner svg{width:16px;height:16px}
    #fw-pending-badge{display:none;background:#ef4444;color:white;font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:10px;margin-left:8px;vertical-align:middle}
    .fw-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);background:#1e293b;color:#e2e8f0;padding:10px 20px;border-radius:8px;font-size:0.85rem;opacity:0;transition:opacity 0.3s,transform 0.3s;z-index:9998;pointer-events:none}
    .fw-toast-show{opacity:1;transform:translateX(-50%) translateY(0)}
    .fw-toast-success{border-left:3px solid #22c55e}
    .fw-toast-error{border-left:3px solid #ef4444}
    body.has-offline-banner{padding-top:calc(var(--nav-h,56px) + 30px)!important}
`;

// HTML for offline banner (injected into page body)
export const OFFLINE_BANNER_HTML = `
  <div id="fw-offline-banner">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
    Offline &mdash; changes will sync when reconnected
    <span id="fw-pending-badge"></span>
  </div>
`;
