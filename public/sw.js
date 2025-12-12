// Service Worker for FiltersFast PWA
// Version: 1.0.0

const CACHE_NAME = 'filtersfast-v1';
const RUNTIME_CACHE = 'filtersfast-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/touch-icon-114x114.png',
  '/filtersfast-logo.png',
  '/manifest.json',
];

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/',
];

// Image routes that should use cache-first strategy
const IMAGE_ROUTES = [
  '/images/',
  '/ProdImages/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API routes - Network first, fallback to cache
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Image routes - Cache first, fallback to network
  if (IMAGE_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static assets - Cache first
  if (STATIC_ASSETS.some((asset) => url.pathname === asset)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - Network first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, '/'));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirst(request));
});

// Network-first strategy: Try network, fallback to cache
async function networkFirst(request, fallbackUrl = null) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If we have a fallback URL and it's an HTML request, return offline page
    if (fallbackUrl && request.headers.get('accept')?.includes('text/html')) {
      const fallbackResponse = await caches.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    // Return a basic offline response for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - FiltersFast</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
                color: #333;
              }
              .offline-container {
                text-align: center;
                max-width: 400px;
              }
              .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 24px;
              }
              h1 { color: #ff6600; margin-bottom: 16px; font-size: 24px; }
              p { margin-bottom: 24px; color: #666; line-height: 1.5; }
              .retry-btn {
                background: #ff6600;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                font-weight: 500;
              }
              .retry-btn:hover { background: #e55a00; }
              .retry-btn:focus {
                outline: 2px solid #ff6600;
                outline-offset: 2px;
              }
            </style>
          </head>
          <body>
            <div class="offline-container">
              <img src="/filtersfast-logo.png" alt="FiltersFast" class="logo" />
              <h1>You're Offline</h1>
              <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
              <button class="retry-btn" id="retry-btn" aria-label="Retry connection">Retry</button>
            </div>
            <script>
              (function() {
                var btn = document.getElementById('retry-btn');
                if (btn) {
                  btn.addEventListener('click', function() {
                    window.location.reload();
                  });
                }
              })();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    
    throw error;
  }
}

// Cache-first strategy: Try cache, fallback to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error('Error parsing push notification data:', error);
    data = {};
  }

  // Validate and sanitize notification data
  const title = typeof data.title === 'string' && data.title.length > 0 && data.title.length <= 100
    ? data.title
    : 'FiltersFast';
  const body = typeof data.body === 'string' && data.body.length > 0 && data.body.length <= 500
    ? data.body
    : 'You have a new notification';
  
  const options = {
    body: body,
    icon: '/touch-icon-114x114.png',
    badge: '/touch-icon-114x114.png',
    data: typeof data.data === 'object' && data.data !== null ? data.data : {},
    tag: typeof data.tag === 'string' && data.tag.length <= 50 ? data.tag : 'default',
    requireInteraction: Boolean(data.requireInteraction),
    actions: Array.isArray(data.actions) && data.actions.length <= 2
      ? data.actions.filter(action => 
          typeof action === 'object' &&
          action !== null &&
          typeof action.action === 'string' &&
          typeof action.title === 'string' &&
          action.title.length <= 20
        ).slice(0, 2)
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  // Validate URL to prevent open redirect attacks
  if (data && typeof data.url === 'string') {
    try {
      const urlObj = new URL(data.url, self.location.origin);
      // Only allow same-origin URLs
      if (urlObj.origin === self.location.origin) {
        // Ensure path starts with / and doesn't contain dangerous patterns
        const path = urlObj.pathname;
        if (path.startsWith('/') && 
            !path.includes('..') && 
            !path.includes('<') && 
            !path.includes('>') &&
            path.length <= 500) {
          url = path + urlObj.search;
        }
      }
    } catch (error) {
      console.error('Invalid notification URL:', error);
      url = '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(url, self.location.origin);
            if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
              return client.focus();
            }
          } catch (error) {
            // Skip invalid URLs
            continue;
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

// Handle background sync (for offline actions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  // This would sync cart data when back online
  // Implementation depends on your cart sync logic
  console.log('Syncing cart...');
}

