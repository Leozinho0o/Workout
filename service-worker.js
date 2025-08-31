const CACHE_NAME = 'vitruvian-fit-cache-v1';

// On install, cache the app shell and other critical assets.
// This makes the app load faster on subsequent visits and work offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      // We pre-cache the main entry points. The rest of the app will be cached on first visit.
      return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/assets/icon-192x192.png',
          '/assets/icon-512x512.png'
      ]);
    }).then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
    })
  );
});

// On activate, clean up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Tell the active service worker to take control of the page immediately.
        return self.clients.claim();
    })
  );
});

// On fetch, use a cache-first strategy.
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                // If a cached response is found, return it.
                // Otherwise, fetch from the network.
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // If the fetch is successful, cache the new response.
                    // We check for valid responses to avoid caching errors or opaque responses from cross-origin requests if not desired.
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });

                return response || fetchPromise;
            });
        })
    );
});

// --- WORKOUT NOTIFICATION LOGIC ---

// This variable will hold the workout data while a session is active.
let workoutData;

/**
 * Shows a single, static, persistent notification that a workout is in progress.
 * @returns {Promise<void>} A promise that resolves when the notification is shown.
 */
const showWorkoutNotification = () => {
    if (!workoutData) {
        return Promise.resolve();
    }
    
    const title = 'Vitruvian Fit';
    const options = {
        body: `Treino "${workoutData.routineName}" em andamento. Toque para ver o progresso.`,
        tag: 'workout-notification', // A unique tag ensures this notification replaces any existing one.
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-192x192.png',
        silent: true, // No sound for this notification.
        requireInteraction: true, // Makes the notification persistent on most platforms.
    };

    // showNotification is an async operation that returns a promise.
    return self.registration.showNotification(title, options);
};

/**
 * Stores workout data and triggers the notification display.
 * @param {object} data - The workout data from the main app.
 * @returns {Promise<void>}
 */
const startWorkout = (data) => {
    workoutData = {
        routineName: data.routineName,
        startTime: new Date(data.startTime).getTime(),
    };
    return showWorkoutNotification();
};

/**
 * Clears workout data and closes any active workout notification.
 * @returns {Promise<void>}
 */
const stopWorkout = () => {
    workoutData = null;
    // Find our specific notification by its tag and close it.
    return self.registration.getNotifications({ tag: 'workout-notification' }).then(notifications => {
        notifications.forEach(notification => notification.close());
    });
};

// Listen for messages from the main application.
self.addEventListener('message', event => {
    const data = event.data;
    if (!data) return;

    switch (data.type) {
        case 'START_WORKOUT':
            // event.waitUntil() is crucial. It tells the browser not to terminate the
            // service worker until the promise (showing the notification) is resolved.
            // This guarantees the notification is displayed even if the user switches apps immediately.
            event.waitUntil(startWorkout(data));
            break;
        case 'STOP_WORKOUT':
            event.waitUntil(stopWorkout());
            break;
    }
});

// Handle what happens when the user clicks the notification.
self.addEventListener('notificationclick', event => {
    // We only care about our workout notification.
    if (event.notification.tag === 'workout-notification') {
        // Close the notification when clicked.
        event.notification.close();

        // Focus the existing app window/tab or open a new one.
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                // If a client is already open, focus it.
                for (const client of clientList) {
                    const url = new URL(client.url);
                    if (url.pathname === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open a new window.
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
}, false);
