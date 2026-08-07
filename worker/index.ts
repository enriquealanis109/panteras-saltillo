// @ts-nocheck
/* eslint-disable */

// Mostrar notificacion al recibirla desde el servidor
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Panteras Saltillo", {
      body:    data.body  ?? "",
      icon:    data.icon  ?? "/icon-192.png",
      badge:   data.badge ?? "/icon-192.png",
      data:    data.data  ?? {},
      vibrate: [200, 100, 200],
    })
  );
});

// Al tocar la notificacion abrir /papa
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/papa";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});
