import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseConfig } from '../config/firebase';
import { request } from '../common/libs/request';

console.log(getApps().length);
// Initialize Firebase
const firebaseApp = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0];

// Check if messaging is supported
let messaging: any = null;
try {
  messaging = getMessaging(firebaseApp);
} catch (error) {
  console.warn('Firebase messaging is not supported in this browser:', error);
}

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

// Check if notifications are permanently blocked
export const isNotificationPermissionBlocked = () => {
  return Notification.permission === 'denied';
};

// Get user-friendly instructions for enabling notifications
export const getNotificationInstructions = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    return {
      browser: 'Chrome',
      steps: [
        'Method 1: Click the tune icon (⚙️) in the address bar (if visible)',
        'Method 2: Press F12 → Console → Type: chrome://settings/content/notifications',
        'Method 3: Go to Chrome Settings → Privacy and security → Site Settings → Notifications',
        'Find this website and set to "Allow"',
        'Refresh the page'
      ]
    };
  } else if (userAgent.includes('firefox')) {
    return {
      browser: 'Firefox',
      steps: [
        'Method 1: Click the shield icon in the address bar (if visible)',
        'Method 2: Press F12 → Console → Type: about:preferences#privacy',
        'Method 3: Go to Firefox Settings → Privacy & Security → Permissions → Notifications',
        'Find this website and set to "Allow"',
        'Refresh the page'
      ]
    };
  } else if (userAgent.includes('safari')) {
    return {
      browser: 'Safari',
      steps: [
        'Go to Safari menu → Preferences → Websites → Notifications',
        'Find this website in the list and set to "Allow"',
        'Refresh the page'
      ]
    };
  } else if (userAgent.includes('edge')) {
    return {
      browser: 'Edge',
      steps: [
        'Method 1: Click the tune icon (⚙️) in the address bar (if visible)',
        'Method 2: Go to Edge Settings → Cookies and site permissions → Notifications',
        'Find this website and set to "Allow"',
        'Refresh the page'
      ]
    };
  }
  
  return {
    browser: 'Unknown',
    steps: [
      'Try these methods:',
      '1. Look for any icon in the address bar (🔒, ⚙️, 🛡️)',
      '2. Right-click on the page → "Site information" or "Page info"',
      '3. Go to browser Settings → Privacy/Security → Notifications',
      '4. Find this website and set to "Allow"',
      'Refresh the page'
    ]
  };
};

// Request permission for notifications
export const requestNotificationPermission = async () => {
  try {
    // Check if messaging is supported
    if (!messaging) {
      console.log('Firebase messaging is not supported in this browser');
      return false;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!globalThis.isSecureContext) {
      console.log('Notifications require a secure context (HTTPS or localhost)');
      return false;
    }

    // Check if notifications are supported
    if (!('Notification' in globalThis)) {
      console.log('This browser does not support notifications');
      return false;
    }

    // Check current permission status
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      const instructions = getNotificationInstructions();
      console.log(`Notification permission was denied in ${instructions.browser}. User must manually enable it:`);
      for (const [index, step] of instructions.steps.entries()) {
        console.log(`${index + 1}. ${step}`);
      }
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return true;
    } else {
      console.log('Unable to get permission to notify. Permission:', permission);
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
    // Check if messaging is supported
    if (!messaging) {
      console.warn('Firebase messaging is not supported in this browser');
      return null;
    }

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
  // Check if messaging is supported
  if (!messaging) {
    console.warn('Firebase messaging is not supported in this browser');
    // Return a no-op unsubscribe function
    return () => {};
  }

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

// Debug notification permissions - call this in console to check status
export const debugNotificationPermissions = () => {
  console.log('🔔 Notification Permission Debug Info:');
  console.log('=====================================');
  console.log('Current permission:', Notification.permission);
  console.log('Secure context:', globalThis.isSecureContext);
  console.log('Notifications supported:', 'Notification' in globalThis);
  console.log('Firebase messaging supported:', !!messaging);
  
  if (Notification.permission === 'denied') {
    const instructions = getNotificationInstructions();
    console.log(`\n🚫 Notifications are BLOCKED in ${instructions.browser}`);
    console.log('To enable notifications:');
    for (const [index, step] of instructions.steps.entries()) {
      console.log(`   ${index + 1}. ${step}`);
    }
    
    // Add direct links for easy access
    console.log('\n🔗 Direct Links:');
    if (instructions.browser === 'Chrome') {
      console.log('   Chrome Settings: chrome://settings/content/notifications');
    } else if (instructions.browser === 'Firefox') {
      console.log('   Firefox Settings: about:preferences#privacy');
    }
  } else if (Notification.permission === 'granted') {
    console.log('✅ Notifications are ENABLED');
  } else {
    console.log('❓ Notifications permission not yet requested');
  }
  
  return {
    permission: Notification.permission,
    isSecureContext: globalThis.isSecureContext,
    notificationsSupported: 'Notification' in globalThis,
    messagingSupported: !!messaging,
    isBlocked: isNotificationPermissionBlocked()
  };
};

// Quick test function to open notification settings
export const openNotificationSettings = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    globalThis.open('chrome://settings/content/notifications', '_blank');
    console.log('Opening Chrome notification settings...');
  } else if (userAgent.includes('firefox')) {
    globalThis.open('about:preferences#privacy', '_blank');
    console.log('Opening Firefox notification settings...');
  } else {
    console.log('Please manually go to your browser settings and find notification permissions');
  }
}; 