importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyC8_BbePSsR3tcRetXw5ldMAymrPf7uvxY",
  authDomain: "dam-project-7cb4b.firebaseapp.com",
  projectId: "dam-project-7cb4b",
  storageBucket: "dam-project-7cb4b.firebasestorage.app",
  messagingSenderId: "172937358724",
  appId: "1:172937358724:web:de7b6ecb27468e1540c1d1",
});

const messaging = firebase.messaging();

const getCurrentUserId = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open("DamDB", 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["userData"], "readonly");
      const store = transaction.objectStore("userData");
      const getRequest = store.get("currentUserId");

      getRequest.onsuccess = () => {
        resolve(getRequest.result);
      };

      getRequest.onerror = () => {
        console.error("Error getting currentUserId from IndexedDB");
        resolve(null);
      };
    };

    request.onerror = () => {
      console.error("Error opening IndexedDB");
      resolve(null);
    };
  });
};

messaging.onBackgroundMessage(async (payload) => {
  console.log("Received background message:", payload);

  const fbSelf = self;
  getCurrentUserId().then((currentUserId) => {
    console.log("Current User ID when receiving message:", currentUserId);

    // Convert both IDs to strings for comparison
    const receiverId = String(payload.data?.receiverId);
    const currentId = String(currentUserId);

    // Debug logging
    console.log("Receiver ID:", receiverId);
    console.log("Current User ID:", currentId);

    // Check if the message is intended for the current user
    if (receiverId && receiverId !== currentId) {
      console.log("Message not for current user, skipping notification");
      return;
    }

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: "/vite.svg",
      requireInteraction: true,
      data: payload.data,
    };

    return fbSelf.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  });
});
