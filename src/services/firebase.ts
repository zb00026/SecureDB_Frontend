import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseConfig } from '../config/firebase';
import { request } from '../common/libs/request';

console.log(getApps().length);
// Initialize Firebase
const firebaseApp = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0];
const messaging = getMessaging(firebaseApp);

// Listen for service worker requests for Firebase config
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'REQUEST_FIREBASE_CONFIG') {
      // Send the config to the service worker
      event.source?.postMessage({
        type: 'FIREBASE_CONFIG',
        config: getFirebaseConfig()
      });
    }
  });
}

// Request permission for notifications
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return true;
    } else {
      console.log('Unable to get permission to notify.');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get FCM token
export const getFCMToken = async () => {
  try {
    // Register service worker first
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Send Firebase config to the service worker immediately
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: getFirebaseConfig()
        });
      }
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Handle foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  // Ensure service worker is registered before setting up message handler
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered for messaging with scope:', registration.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Subscribe to a topic
export const subscribeToTopic = async (topic: string) => {
  try {
    const token = await getFCMToken();
    if (!token) return false;

    const response = await request('/api/firebase/notifications/subscribe', {
      method: 'POST',
      data: {
        token,
        topic
      }
    });

    if (response) {
      console.log(`Successfully subscribed to topic: ${topic}, token: ${token}`);
      return true;
    } else {
      console.error('Failed to subscribe to topic');
      return false;
    }
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return false;
  }
};

// Unsubscribe from a topic
export const unsubscribeFromTopic = async (topic: string) => {
  try {
    const token = await getFCMToken();
    if (!token) return false;

    const response = await request('/api/firebase/notifications/unsubscribe', {
      method: 'POST',
      data: {
        token,
        topic
      }
    });

    if (response) {
      console.log(`Successfully unsubscribed from topic: ${topic}`);
      return true;
    } else {
      console.error('Failed to unsubscribe from topic');
      return false;
    }
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return false;
  }
}; 