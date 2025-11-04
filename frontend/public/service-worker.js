// service-worker.js

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? "/notifications")
  );
});

// ...existing service worker code...