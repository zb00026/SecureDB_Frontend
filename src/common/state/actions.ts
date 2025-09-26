import { PageRoute } from '@models/PageRoute';
import { state } from '.';
import globalAction from './global';
export const stateActions = {
  ...globalAction,
  addLoading: () => {
    state.session.count++;
  },
  subLoading: () => {
    if (state.session.count > 0) {
      state.session.count--;
    }
  },
  showNotification: (notification: {
    title?: string;
    description: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
  }) => {
    state.session.notification = {
      show: true,
      title: notification.title,
      description: notification.description,
      type: notification.type,
      duration: notification.duration || 5000,
      onClose: notification.onClose
    };
  },
  hideNotification: () => {
    state.session.notification.show = false;
  },
  setToken(token: string) {
    state.storage.token = token;
  },
  setLocale(locale: string) {
    state.storage.locale = locale;
  },
  setUser(user: any) {
    state.session.user = user;
  },
  setIsLogin(isLogin: boolean) {
    state.session.isLogin = isLogin;
  },
  setPageRoutes(routes: Array<PageRoute>) {
    state.storage.pageRoutes = routes;
  },
  setHotKey(hotKey: string) {
    state.storage.hotKey = hotKey;
  }
};

