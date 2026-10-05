/* Service worker للإشعارات — الإعدادات بتوصله من رابط التسجيل */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const p = new URL(self.location.href).searchParams;
firebase.initializeApp({
  apiKey: p.get("apiKey"),
  authDomain: p.get("authDomain"),
  projectId: p.get("projectId"),
  messagingSenderId: p.get("messagingSenderId"),
  appId: p.get("appId"),
});
// إشعارات الخلفية اللي فيها notification payload بيعرضها Firebase تلقائيًا
firebase.messaging();
