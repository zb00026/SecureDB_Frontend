import { useColorMode } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { isAuthorizedPath, DamFullLoading, useMyState, useDamToast, stateActions, request } from '@common/index'
import { ForbiddenPage } from '@pages/error/forbidden'
import { onForegroundMessage, requestNotificationPermission, subscribeToTopic } from '@/services/firebase';
import { SetCredentialDialog } from '@common/components/DamDialog/SetCredentialDialog'
import { useIntl } from 'react-intl'

export function DamInitialState() {
  const { snap } = useMyState()
  const { colorMode, toggleColorMode } = useColorMode();
  const { showSuccess, showError } = useDamToast();
  const [isPsdDialogOpen, setIsPsdDialogOpen] = useState<boolean>(false);
  const intl = useIntl();

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
      if (user.isInitialPassword) {
        setIsPsdDialogOpen(true);
      }
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
        if (payload.data?.messageType == '1') {
          showSuccess({
            title: payload.notification.title,
            description: payload.notification.body
          });
        } else {
          showError({
            title: payload.notification.title,
            description: payload.notification.body
          });
        }


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

  const handleUpdatePassword = (username: string, password: string) => {
    stateActions.addLoading();
    request(`/api/auth/updatePassword`, {
      method: 'POST',
      data: { password }
    })
      .then(() => {
        showSuccess({
          description: intl.formatMessage({ id: 'text.password_updated' }),
        });
        setIsPsdDialogOpen(false);
      })
      .catch((e) => {
        showError({
          description: e.data?.error ?? intl.formatMessage({ id: 'text.password_update_failed' }),
        });
      })
      .finally(() => {
        stateActions.subLoading();
      });
  }

  if (!isAuthorized())
    return <ForbiddenPage />
  if (snap.session.ready)
    return <>
      <SetCredentialDialog
        isOpen={isPsdDialogOpen}
        titleId={'text.update_temporary_password'}
        onClose={() => setIsPsdDialogOpen(false)}
        onSubmit={handleUpdatePassword}
        isTemporaryPassword={true}
        saveButtonTextId={'text.update'}
      />
      <Outlet />
    </>
  return <DamFullLoading />
}
