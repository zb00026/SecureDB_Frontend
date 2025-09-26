import { PageRoute } from "@models/PageRoute";
import { proxy, subscribe, snapshot, useSnapshot } from "valtio";

export * from "./actions";

function proxyWithPersistant(
  val: DefaultStorageType,
  opts: {
    key: string;
  }
) {
  val.locale = "en";
  const local = localStorage.getItem(opts.key);
  const state = proxy(local ? JSON.parse(local) : val);
  subscribe(state, () => {
    localStorage.setItem(opts.key, JSON.stringify(snapshot(state)));
  });
  return state;
}

type StorageType = {
  name: string;
  email: string;
  token: string;
  locale: string;
  isLogin: boolean;
  hotKey: string;
  pageRoutes: Array<PageRoute>;
};

type DefaultStorageType = {
  name: string;
  email: string;
  locale: string;
  isLogin: boolean;
  hotKey: string;
  pageRoutes: Array<PageRoute>;
};

const storage: StorageType = proxyWithPersistant(
  {
    name: "",
    email: "",
    locale: "en",
    isLogin: false,
    hotKey: "Ctrl+J",
    pageRoutes: [],
  },
  {
    key: "account",
  }
);

type SessionType = {
  ready: boolean; // is ready?
  count: number; // loading count
  user: any; // wechat
  global: any; // global
  isLogin: boolean;
  hotKey: string;
  notification: {
    show: boolean;
    title?: string;
    description?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
  };
};
const session: SessionType = proxy({
  ready: true,
  count: 0,
  user: undefined,
  global: {},
  isLogin: false,
  hotKey: "Ctrl+J",
  notification: {
    show: false,
    title: '',
    description: '',
    type: 'info',
    duration: 5000,
    onClose: undefined
  }
});

export type StateType = {
  storage: StorageType;
  session: SessionType;
};
export const state: StateType = proxy({
  storage,
  session,
});

export function useMyState() {
  const snap = useSnapshot<StateType>(state);
  return { snap };
}
