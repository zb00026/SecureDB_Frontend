import axios, { AxiosRequestConfig } from 'axios';
import { state, stateActions } from '../../state';
import keycloak from '@common/keycloak/keycloak';

export const request = axios.create({
  baseURL: import.meta.env.VITE_REQUEST_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Initialize googleToken from localStorage
let googleToken: string | null = localStorage.getItem('googleToken');

// Function to set the Google token
export const setGoogleToken = (token: string) => {
  googleToken = token;
  localStorage.setItem('googleToken', token);
};

// Function to get the Google token
export const getGoogleToken = () => {
  return googleToken || localStorage.getItem('googleToken');
};

// Function to clear the Google token
export const clearGoogleToken = () => {
  googleToken = null;
  localStorage.removeItem('googleToken');
};

request.interceptors.request.use((config) => {
  const storedToken = localStorage.getItem('googleToken');
  if (storedToken) {
    config.headers['Authorization'] = `Bearer ${storedToken}`;
  } else if(keycloak.token) {
    config.headers['Authorization'] = `Bearer ${keycloak.token}`;
  }
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
