// Service Worker for ExpenseTracker Web Push Notifications & Lock Screen Alerts
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch event listener to prevent PWA navigation load errors
self.addEventListener("fetch", (event) => {
  // Only handle GET requests, pass through everything cleanly
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch((error) => {
      console.warn("Fetch failed, returning network request", error);
      return caches.match(event.request);
    }),
  );
});

self.addEventListener("push", function (event) {
  let data = { title: "ExpenseTracker", body: "มีการแจ้งเตือนใหม่ในระบบ" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || "มีการแจ้งเตือนใหม่",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || data.link || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
