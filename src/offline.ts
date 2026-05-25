// Service Worker script served at /sw.js
// and client-side offline queue JS injected into pages

const SW_VERSION = "v2";

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

var MAX_QUEUE_SIZE = 50;

function getQueueCount() {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  });
}

function queueRequest(entry) {
  return getQueueCount().then(function(count) {
    if (count >= MAX_QUEUE_SIZE) {
      notifyClients({ type: 'queue-full', count: count });
      return Promise.reject(new Error('Queue full (' + MAX_QUEUE_SIZE + ' items)'));
    }
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function(e) { reject(e.target.error); };
      });
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
      }).catch(function(err) {
        return new Response(JSON.stringify({ error: 'Offline queue full — cannot save more actions until reconnected', offline_queue_full: true }), {
          status: 507,
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

function base64ToBlob(base64, mime) {
  var binary = atob(base64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function replayItem(item) {
  var fetchOpts = { method: item.method };

  if (item.type === 'fixit' && item.photoBase64) {
    var parsed = JSON.parse(item.body);
    var fd = new FormData();
    fd.append('cabinet_id', parsed.cabinet_id);
    if (parsed.build_session_id) fd.append('build_session_id', parsed.build_session_id);
    fd.append('root_cause', parsed.root_cause);
    if (parsed.description) fd.append('description', parsed.description);
    fd.append('photo', base64ToBlob(item.photoBase64, item.photoMime || 'image/jpeg'), 'photo.jpg');
    fetchOpts.body = fd;
    fetchOpts.headers = { 'X-Offline-Queued': 'true', 'X-Request-Id': item.id };
  } else if (item.type === 'fixit' && item.body && !item.headers['content-type']) {
    var parsedBody = JSON.parse(item.body);
    var formData = new FormData();
    formData.append('cabinet_id', parsedBody.cabinet_id);
    if (parsedBody.build_session_id) formData.append('build_session_id', parsedBody.build_session_id);
    formData.append('root_cause', parsedBody.root_cause);
    if (parsedBody.description) formData.append('description', parsedBody.description);
    fetchOpts.body = formData;
    fetchOpts.headers = { 'X-Offline-Queued': 'true', 'X-Request-Id': item.id };
  } else {
    var headers = Object.assign({}, item.headers, { 'X-Offline-Queued': 'true', 'X-Request-Id': item.id });
    fetchOpts.headers = headers;
    if (item.body && item.method !== 'GET') fetchOpts.body = item.body;
  }

  return fetch(item.url, fetchOpts).then(function(response) {
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
  var data = e.data;
  if (data === 'drain-queue') {
    e.waitUntil(drainQueue());
  }
  if (data === 'get-queue') {
    getAllQueued().then(function(items) {
      e.source.postMessage({ type: 'queue-state', items: items.map(function(i) {
        return { id: i.id, url: i.url, type: i.type, timestamp: i.timestamp, retries: i.retries, hasPhoto: !!i.photoBase64 };
      })});
    });
  }
  if (data && data.command === 'retry-item') {
    e.waitUntil(
      openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          var req = store.get(data.id);
          req.onsuccess = function() {
            var item = req.result;
            if (!item) { resolve(); return; }
            item.retries = 0;
            store.put(item);
            tx.oncomplete = function() { resolve(item); };
          };
          req.onerror = function() { resolve(); };
        });
      }).then(function(item) {
        if (item) return replayItem(item);
      }).then(function() {
        return getAllQueued().then(function(items) {
          notifyClients({ type: 'queue-state', items: items.map(function(i) {
            return { id: i.id, url: i.url, type: i.type, timestamp: i.timestamp, retries: i.retries, hasPhoto: !!i.photoBase64 };
          })});
        });
      })
    );
  }
  if (data && data.command === 'discard-item') {
    e.waitUntil(
      removeQueued(data.id).then(function() {
        return getAllQueued().then(function(items) {
          notifyClients({ type: 'queue-state', items: items.map(function(i) {
            return { id: i.id, url: i.url, type: i.type, timestamp: i.timestamp, retries: i.retries, hasPhoto: !!i.photoBase64 };
          })});
        });
      })
    );
  }
  if (data && data.command === 'queue-fixit') {
    var fixitEntry = data.entry;
    e.waitUntil(
      queueRequest(fixitEntry).then(function() {
        notifyClients({ type: 'queued', entry: { id: fixitEntry.id, url: fixitEntry.url, queueType: fixitEntry.type, timestamp: fixitEntry.timestamp } });
      }).catch(function() {
        notifyClients({ type: 'queue-full', count: MAX_QUEUE_SIZE });
      })
    );
  }
  if (data && data.command === 'discard-all') {
    e.waitUntil(
      openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).clear();
          tx.oncomplete = function() { resolve(); };
          tx.onerror = function(e) { reject(e.target.error); };
        });
      }).then(function() {
        notifyClients({ type: 'queue-state', items: [] });
      })
    );
  }
});

self.addEventListener('push', function(e) {
  var data = { title: 'FabWorks', body: 'New notification', icon: '/icon-192.svg', url: '/' };
  try { if (e.data) data = Object.assign(data, e.data.json()); } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.svg',
      badge: '/icon-192.svg',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) ? e.notification.data.url : '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.indexOf(url) !== -1) {
          return windowClients[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
`;

// Client-side offline queue awareness JS — injected into SHARED_JS
export const OFFLINE_CLIENT_JS = `
    // --- Offline awareness ---
    var _fwOffline = !navigator.onLine;
    var _fwPendingCount = 0;
    var _fwQueueItems = [];
    var _fwQueuePanelOpen = false;

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

    function _fwQueueTypeLabel(type) {
      var labels = { scan: 'Scan', timer: 'Timer', fixit: 'FixIt', metadata: 'Update' };
      return labels[type] || 'Action';
    }

    function _fwQueueItemLabel(item) {
      try {
        var path = new URL(item.url).pathname;
        if (item.type === 'scan') return 'QR Scan';
        if (item.type === 'timer') {
          if (path.includes('/start')) return 'Timer Start';
          if (path.includes('/stop') || path.includes('/complete')) return 'Timer Stop';
          if (path.includes('/pause')) return 'Timer Pause';
          return 'Timer Action';
        }
        if (item.type === 'fixit') return 'FixIt Report';
        return 'Data Update';
      } catch(e) { return 'Queued Action'; }
    }

    function _fwRenderQueuePanel() {
      var panel = document.getElementById('fw-queue-panel');
      if (!panel) return;
      var items = _fwQueueItems;
      if (items.length === 0) {
        panel.innerHTML = '<div class="fwq-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>No pending items</span></div>';
        return;
      }
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var pillClass = 'fwq-pill-' + it.type;
        var retryInfo = it.retries > 0 ? '<span class="fwq-retries">' + it.retries + '/5</span>' : '';
        var photoIcon = '';
        if (it.type === 'fixit') {
          photoIcon = it.hasPhoto ? '<span class="fwq-photo" title="Photo attached">&#x1F4F7;</span>' : '<span class="fwq-no-photo" title="No photo">&#x26A0;</span>';
        }
        html += '<div class="fwq-item" data-id="' + it.id + '">'
          + '<span class="fwq-pill ' + pillClass + '">' + _fwQueueTypeLabel(it.type) + '</span>'
          + '<span class="fwq-label">' + _fwQueueItemLabel(it) + photoIcon + '</span>'
          + '<span class="fwq-time">' + timeAgo(new Date(it.timestamp)) + '</span>'
          + retryInfo
          + '<button class="fwq-btn fwq-retry" title="Retry now" data-id="' + it.id + '">&#x21bb;</button>'
          + '<button class="fwq-btn fwq-discard" title="Discard" data-id="' + it.id + '">&times;</button>'
          + '</div>';
      }
      if (items.length > 1) {
        html += '<button class="fwq-discard-all">Discard All (' + items.length + ')</button>';
      }
      panel.innerHTML = html;
    }

    function _fwToggleQueuePanel() {
      var panel = document.getElementById('fw-queue-panel');
      if (!panel) return;
      _fwQueuePanelOpen = !_fwQueuePanelOpen;
      panel.style.display = _fwQueuePanelOpen ? 'block' : 'none';
      if (_fwQueuePanelOpen && navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('get-queue');
      }
    }

    function _fwSendSWCommand(command, id) {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ command: command, id: id });
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
          if (_fwQueuePanelOpen) {
            navigator.serviceWorker.controller.postMessage('get-queue');
          }
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
          _fwQueueItems = d.items;
          _fwUpdatePendingBadge(d.items.length);
          if (_fwQueuePanelOpen) _fwRenderQueuePanel();
          if (d.items.length === 0 && _fwQueuePanelOpen) {
            _fwRenderQueuePanel();
          }
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

    document.addEventListener('click', function(e) {
      var badge = document.getElementById('fw-pending-badge');
      if (badge && badge.contains(e.target)) {
        e.stopPropagation();
        _fwToggleQueuePanel();
        return;
      }
      var panel = document.getElementById('fw-queue-panel');
      if (panel && panel.contains(e.target)) {
        var btn = e.target.closest('.fwq-retry');
        if (btn) { _fwSendSWCommand('retry-item', btn.dataset.id); return; }
        var disc = e.target.closest('.fwq-discard');
        if (disc) { _fwSendSWCommand('discard-item', disc.dataset.id); return; }
        var discAll = e.target.closest('.fwq-discard-all');
        if (discAll) { _fwSendSWCommand('discard-all'); return; }
        return;
      }
      if (_fwQueuePanelOpen) {
        _fwQueuePanelOpen = false;
        if (panel) panel.style.display = 'none';
      }
    });
`;

// CSS for offline banner, queue panel, and toast notifications
export const OFFLINE_STYLES = `
    #fw-offline-banner{display:none;position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#000;padding:6px 16px;font-size:0.8rem;font-weight:600;z-index:9999;align-items:center;justify-content:center;gap:8px}
    #fw-offline-banner svg{width:16px;height:16px}
    #fw-pending-badge{display:none;background:#ef4444;color:white;font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:10px;margin-left:8px;vertical-align:middle;cursor:pointer}
    #fw-queue-panel{display:none;position:fixed;top:32px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:400px;max-height:70vh;overflow-y:auto;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px;z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
    .fwq-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;color:#94a3b8}
    .fwq-empty svg{opacity:0.5}
    .fwq-item{display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:#0f172a;margin-bottom:6px}
    .fwq-pill{font-size:0.6rem;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:4px;white-space:nowrap}
    .fwq-pill-scan{background:#3b82f620;color:#60a5fa}
    .fwq-pill-timer{background:#f59e0b20;color:#fbbf24}
    .fwq-pill-fixit{background:#ef444420;color:#f87171}
    .fwq-pill-metadata{background:#64748b20;color:#94a3b8}
    .fwq-label{flex:1;font-size:0.8rem;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .fwq-time{font-size:0.7rem;color:#64748b;white-space:nowrap}
    .fwq-retries{font-size:0.65rem;color:#f59e0b;font-weight:600}
    .fwq-btn{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1rem;padding:4px;border-radius:4px;line-height:1}
    .fwq-btn:hover{background:#334155;color:#e2e8f0}
    .fwq-discard:hover{color:#ef4444}
    .fwq-discard-all{display:block;width:100%;margin-top:8px;padding:8px;background:#ef444420;color:#f87171;border:1px solid #ef444440;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;text-align:center}
    .fwq-photo{margin-left:4px;font-size:0.7rem}
    .fwq-no-photo{margin-left:4px;font-size:0.7rem;color:#f59e0b}
    .fwq-discard-all:hover{background:#ef444440}
    .fw-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);background:#1e293b;color:#e2e8f0;padding:10px 20px;border-radius:8px;font-size:0.85rem;opacity:0;transition:opacity 0.3s,transform 0.3s;z-index:9998;pointer-events:none}
    .fw-toast-show{opacity:1;transform:translateX(-50%) translateY(0)}
    .fw-toast-success{border-left:3px solid #22c55e}
    .fw-toast-error{border-left:3px solid #ef4444}
    body.has-offline-banner{padding-top:calc(var(--nav-h,56px) + 30px)!important}
`;

// HTML for offline banner + queue panel (injected into page body)
export const OFFLINE_BANNER_HTML = `
  <div id="fw-offline-banner">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
    Offline &mdash; changes will sync when reconnected
    <span id="fw-pending-badge"></span>
  </div>
  <div id="fw-queue-panel"></div>
`;
