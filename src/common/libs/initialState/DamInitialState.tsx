import { useColorMode } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { isAuthorizedPath, DamFullLoading, useMyState, useDamToast } from '@common/index'
import { ForbiddenPage } from '@pages/error/forbidden'
import { onForegroundMessage, requestNotificationPermission, subscribeToTopic } from '@/services/firebase';

export function DamInitialState() {
  const { snap } = useMyState()
  const { colorMode, toggleColorMode } = useColorMode();
  const { showSuccess } = useDamToast();

  const location = useLocation();
  const user = snap.session.user;

  // Protect routes based on user role
  const isAuthorized = () => {
    const path = location.pathname;
    return isAuthorizedPath(path, user);
  };

  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (snap.session.ready && user?.id) {
      // Use localStorage instead of sessionStorage
      const request = indexedDB.open('DamDB', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db?.objectStoreNames.contains('userData')) {
          db?.createObjectStore('userData');
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db?.transaction(['userData'], 'readwrite');
        const store = transaction?.objectStore('userData');
        store?.put(String(user.id), 'currentUserId');
      };

      requestNotificationPermission().then((granted) => {
        if (granted) {
          subscribeToTopic("dam_notification");
        }
      });
    }
    // Set up foreground message handler
    const unsubscribe = onForegroundMessage((payload) => {
      // Handle the message
      console.log('Received foreground message:', payload);

      // Example: Show notification using your app's notification system
      if (payload.notification &&
        payload.data?.receiverId == user?.id) {

        showSuccess({
          title: payload.notification.title,
          description: payload.notification.body
        });

      }
    });

    // Clean up
    return () => {
      unsubscribe();
    };
  }, [snap.session.ready, user?.id]);
  // colorMode
  useEffect(() => {
    let color = searchParams.get('theme')
    let colorMode = localStorage.getItem('chakra-ui-color-mode')
    if (color) {
      if (color !== colorMode) toggleColorMode()
    }
  }, [colorMode])

  useEffect(() => {

  }, [snap.storage.isLogin])

  if (!isAuthorized())
    return <ForbiddenPage />
  if (snap.session.ready)
    return <Outlet />
  return <DamFullLoading />
}
