importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
);

let firebaseApp = null;
let messaging = null;

// Listen for the config message from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    const firebaseConfig = event.data.config;
    if (!firebaseApp) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      initializeFirebase();
    }
  }
});

function initializeFirebase() {
  messaging = firebaseApp.messaging();
  setupMessageHandler();
}

function setupMessageHandler() {
  messaging.onBackgroundMessage(handleBackgroundMessage);
}

async function handleBackgroundMessage(payload) {
  console.log("Received background message:", payload);

  const currentUserId = await getCurrentUserId();
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

  showNotification(payload);
}

function showNotification(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/vite.svg",
    requireInteraction: true,
    data: payload.data,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
}

function getCurrentUserId() {
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
}
