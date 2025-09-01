self.addEventListener("push", function (event) {
  if (!event.data) {
    return;
  }
  const data = event.data.json();
  const title = data.title;
  const options = {
    body: data.body,
    data: { url: data.url },
    badge: "",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림을 클릭했을 때 실행
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data.url;
  // 사용자를 특정 URL로 이동시키고 싶을 때 사용합니다.
  event.waitUntil(clients.openWindow(url));
});
