import { state, stateActions } from '../../state';
import keycloak from '@common/keycloak/keycloak';
import { useNavigate } from 'react-router';

// Initialize googleToken from localStorage
let googleToken: string | null = localStorage.getItem('googleToken');

// Token management functions
export const setGoogleToken = (token: string) => {
  googleToken = token;
  localStorage.setItem('googleToken', token);
};

export const getGoogleToken = () => {
  return googleToken || localStorage.getItem('googleToken');
};

export const clearGoogleToken = () => {
  googleToken = null;
  localStorage.removeItem('googleToken');
};

export const logout = () => {
  const navigate = useNavigate();
  clearGoogleToken();
  keycloak.logout();
  state.storage.isLogin = false;
  state.storage.token = '';
  navigate('/');
}

// Main request function
export const request = async (url: string, options: RequestInit & { data?: any } = {}) => {
  const baseURL = import.meta.env.VITE_REQUEST_BASE_URL;
  const timeout = 30000;

  // Prepare headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  // Add authorization header
  const storedToken = localStorage.getItem('googleToken');
  if (storedToken) {
    headers.set('Authorization', `Bearer ${storedToken}`);
  } else if (keycloak.token) {
    headers.set('Authorization', `Bearer ${keycloak.token}`);
  }

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // Only add body for non-GET requests
  if (options.method !== 'GET' && options.data) {
    fetchOptions.body = JSON.stringify(options.data);
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    const response = await fetch(`${baseURL}${url}`, fetchOptions);
    clearTimeout(timeoutId);

    const data = await response.json();

    // Handle response
    stateActions.subLoading();
    
    if (![200, 201].includes(response.status)) {
      // Create Error object with response data
      const error = new Error(data.message || 'Request failed');
      error.name = 'ApiError';
      // Attach additional data to the error object
      Object.assign(error, { 
        status: response.status,
        data: data 
      });
      return Promise.reject(error);
    }

    if (data.error) {
      console.log(window.location.href);
      // Create Error object for data.error
      const error = new Error(data.error.message || data.error);
      error.name = 'ApiError';
      Object.assign(error, { data });
      return Promise.reject(error);
    }

    return data;
  } catch (error: any) {
    stateActions.subLoading();
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    // If error is not already an Error instance, wrap it
    if (!(error instanceof Error)) {
      throw new Error(error.message || 'Unknown error occurred');
    }
    
    throw error;
  }
};
