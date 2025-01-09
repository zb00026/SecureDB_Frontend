import axios from 'axios';
import { state, stateActions } from '../../state';

export const request = axios.create({
  baseURL: import.meta.env.VITE_REQUEST_BASE_URL || '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use((config) => {
  // if (!config.url?.includes('login')) stateActions.addLoading();
  config.headers.account = JSON.stringify(state.storage ?? '');
  // config.headers.authorization =
  //   'Bearer ' + (state.storage.token?.access_token ?? '0');
  return config;
});

request.interceptors.response.use(
  (response) => {
    stateActions.subLoading();
    const data = response.data;
    // console.log("response:", response);
    if (![200, 201].includes(response.status)) {
      return Promise.reject(response.data);
    }
    if (data.error) {
      console.log(window.location.href);
      // if (location.pathname !== '/') location.href = '/';
      return Promise.reject(response.data);
    }
    return Promise.resolve(data);

  },
  (error) => {
    stateActions.subLoading();
    console.log('err:', error, error.response); // for debug
    if (error.response && error.response.status) {
    }
    // throw new Error(error);
    return Promise.reject(error);
  },
);
