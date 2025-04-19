// Service Worker for 4ochan.org PWA
const CACHE_NAME = '4ochan-v1';

// Add files to cache during installation
const filesToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/offline.html'
];

// Install event - Cache critical assets
self.addEventListener('install', e => {
  console.log('[Service Worker] Install');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(filesToCache);
      })
  );
  // Activate the SW immediately
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', e => {
  console.log('[Service Worker] Activate');
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Claim clients immediately
  return self.clients.claim();
});

// Helper function to determine if a request is for an API
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

// Helper function to determine if a request should be cached
const shouldCache = (url) => {
  // Don't cache API requests
  if (isApiRequest(url)) return false;
  
  // Cache static assets
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  ) {
    return true;
  }
  
  // Cache HTML pages
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    return true;
  }
  
  return false;
};

// Fetch event - Handle network requests
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // For navigation requests (HTML pages), use a network-first approach
  // but fallback to cached content if offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // Cache the fresh network response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(e.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, serve the offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For API requests, always go to the network first
  if (isApiRequest(url)) {
    e.respondWith(
      fetch(e.request)
        .catch(() => {
          // If the request fails, return an empty JSON object with status information
          return new Response(
            JSON.stringify({ 
              offline: true, 
              error: 'You are offline. This request will be retried when you are back online.' 
            }),
            { 
              status: 503, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }

  // For assets that should be cached, use a cache-first approach
  if (shouldCache(url)) {
    e.respondWith(
      caches.match(e.request)
        .then(cachedResponse => {
          // Return cached response if available
          if (cachedResponse) {
            return cachedResponse;
          }

          // Otherwise fetch from network and cache
          return fetch(e.request)
            .then(response => {
              // Don't cache bad responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();
              
              // Add to cache
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(e.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // Network failed, but we don't have a cached version
              // For images, could return a placeholder
              if (
                e.request.url.endsWith('.jpg') || 
                e.request.url.endsWith('.png') || 
                e.request.url.endsWith('.gif') || 
                e.request.url.endsWith('.webp') || 
                e.request.url.endsWith('.svg')
              ) {
                // Return a placeholder image
                return new Response('', { status: 404, statusText: 'Not found (offline)' });
              }
              
              // For other resources, just return a 504 Gateway Timeout
              return new Response('', { status: 504, statusText: 'Gateway Timeout (offline)' });
            });
        })
    );
    return;
  }

  // For all other requests, try network first, then cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache the response if valid
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(e.request);
      })
  );
});

// Background sync for offline posts
self.addEventListener('sync', e => {
  if (e.tag === 'sync-nostr-events') {
    e.waitUntil(syncNostrEvents());
  }
});

// Function to sync offline Nostr events
async function syncNostrEvents() {
  try {
    // Retrieve offline events from IndexedDB
    const offlineEvents = await getOfflineEvents();
    
    if (offlineEvents && offlineEvents.length) {
      // Process each offline event
      const successfulEvents = [];
      
      for (const event of offlineEvents) {
        try {
          // Attempt to send the event to the server
          const response = await fetch('/api/nostr/publish', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          });
          
          if (response.ok) {
            successfulEvents.push(event.id);
          }
        } catch (error) {
          console.error('Failed to sync event:', event.id, error);
        }
      }
      
      // Remove successfully synced events
      await removeSuccessfulEvents(successfulEvents);
      
      // Notify the user that events were synced
      if (successfulEvents.length > 0) {
        self.registration.showNotification('4ochan Sync Complete', {
          body: `${successfulEvents.length} offline post${successfulEvents.length === 1 ? '' : 's'} successfully synced!`,
          icon: '/icon-192x192.svg'
        });
      }
    }
  } catch (error) {
    console.error('Error during background sync:', error);
  }
}

// Helper functions for IndexedDB operations
// These would normally be implemented by your application

async function getOfflineEvents() {
  // This would access your IndexedDB to retrieve offline events
  // For now, we'll return an empty array
  return [];
}

async function removeSuccessfulEvents(eventIds) {
  // This would remove successfully synced events from IndexedDB
  // For now, it's a no-op
  return true;
}

// Push notification event
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const title = data.title || '4ochan Notification';
  const options = {
    body: data.body || 'New activity on 4ochan',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url;
        
        // Check if there is already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open with the URL, open it
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});