/**
 * DRISHTI Background Sync Service Worker
 * Author: Adrian Roy Williams
 * Role: Detects restored connectivity and flushes the IndexedDB outbox to the Supabase backend.
 * 
 * NOTE: Service Workers cannot use ES module imports. This file uses the
 * self-contained IndexedDB access pattern (duplicated from darkZoneStore)
 * because SW runs in an isolated thread with no access to the app bundle.
 */

const DB_NAME = 'DrishtiDarkZoneDB';
const STORE_NAME = 'telemetry_outbox';

// The Supabase/backend endpoint for offline sync
const SYNC_ENDPOINT = '/api/sync-offline';

const CACHE_NAME = 'drishti-shell-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[DRISHTI SW] Installing Dark Zone Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[DRISHTI SW] Dark Zone Service Worker activated.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests for navigation and static assets
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return; // let APIs fall through or fail

  // Use Network-First strategy for HTML navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Update the cache with the freshest index.html
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-First strategy for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(event.request).then((networkResponse) => {
        // Cache new dynamic assets automatically to prevent 404s later
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.error('[DRISHTI SW] Fetch failed for static asset:', event.request.url);
        throw error;
      });
    })
  );
});

// The core Background Sync listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-drishti-telemetry') {
    console.log('[DRISHTI SW] Network restored. Flushing Dark Zone queue...');
    event.waitUntil(flushTelemetryQueue());
  }
});

// Fallback: Also listen for online events in case Background Sync is unavailable
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_SYNC') {
    console.log('[DRISHTI SW] Manual sync requested. Flushing queue...');
    flushTelemetryQueue();
  }
});

// ============================================================
// IndexedDB Access (Self-contained for Service Worker context)
// ============================================================
function openDarkZoneDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllQueued(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteItem(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// Core Flush Logic
// ============================================================
async function flushTelemetryQueue() {
  const db = await openDarkZoneDB();
  const queuedItems = await getAllQueued(db);

  if (!queuedItems || queuedItems.length === 0) {
    console.log('[DRISHTI SW] Queue is empty. Nothing to sync.');
    return;
  }

  console.log(`[DRISHTI SW] Found ${queuedItems.length} queued payload(s). Beginning sync...`);

  for (const item of queuedItems) {
    try {
      // Reconstruct the multipart payload for the backend API
      const formData = new FormData();
      formData.append('project_id', item.projectId);
      formData.append('telemetry_json', JSON.stringify(item.telemetryData));
      formData.append('interrogation_json', JSON.stringify(item.interrogationAnswers));

      // Blobs (PDFs and Cryptographic Photos) are pulled directly from IndexedDB
      if (item.pdfBlob) {
        formData.append('dpr_pdf', item.pdfBlob, 'report.pdf');
      }
      if (item.photoBlob) {
        formData.append('geotagged_proof', item.photoBlob, 'audit.jpg');
      }

      // Dispatch to the backend
      const headers = {};
      if (item.authToken) {
        headers['Authorization'] = `Bearer ${item.authToken}`;
      }

      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers
      });

      if (response.ok) {
        // Remove from local storage upon cryptographic verification of receipt
        await deleteItem(db, item.id);
        console.log(`[DRISHTI SW] Offline payload ${item.id} successfully committed to Ledger.`);
        
        // Notify the frontend that sync completed
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            payload: { id: item.id, projectId: item.projectId }
          });
        });
      } else {
        console.warn(`[DRISHTI SW] Server rejected payload ${item.id}: ${response.status}`);
      }
    } catch (error) {
      console.error(`[DRISHTI SW] Sync failed for item ${item.id}, will retry next connection.`, error);
      // Throwing an error tells the browser to retry the sync later
      throw error;
    }
  }
}
