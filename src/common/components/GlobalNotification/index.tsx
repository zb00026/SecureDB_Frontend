import React, { useEffect } from 'react';
import { useMyState, stateActions } from '@common/state';
import { useToast } from '@chakra-ui/react';

export const GlobalNotification: React.FC = () => {
  const { snap } = useMyState();
  const toast = useToast();

  useEffect(() => {
    if (snap.session.notification.show) {
      const notification = snap.session.notification;
      
      toast({
        id: 'global-notification',
        title: notification.title,
        description: notification.description,
        status: notification.type,
        duration: notification.duration,
        isClosable: true,
        onCloseComplete: () => {
          stateActions.hideNotification();
          if (notification.onClose) {
            notification.onClose();
          }
        }
      });
    }
  }, [snap.session.notification.show, toast]);

  return null; // This component doesn't render anything visible
};
