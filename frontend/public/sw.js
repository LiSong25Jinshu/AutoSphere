// AutoSphere Service Worker — handles web push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'AutoSphere', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/vite.svg',
    badge: data.badge || '/vite.svg',
    timestamp: data.timestamp || Date.now(),
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'View' }],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AutoSphere', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
