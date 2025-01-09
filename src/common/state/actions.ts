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
  setToken(token: string) {
    state.storage.token = token;
  },
  setLocale(locale: string) {
    state.storage.locale = locale;
  },
  setUser(user: any) {
    state.session.user = user;
  },
};
