import { state, stateActions } from '../../state';
import keycloak from '@common/keycloak/keycloak';

// Initialize googleToken from localStorage
let googleToken: string | null = localStorage.getItem('googleToken');

// Token management functions
export const setGoogleToken = (token: string) => {
  googleToken = token;
  localStorage.setItem('googleToken', token);
};

export const getGoogleToken = () => {
  return googleToken ?? localStorage.getItem('googleToken');
};

export const clearGoogleToken = () => {
  googleToken = null;
  localStorage.removeItem('googleToken');
};

export const logout = () => {
  state.storage.isLogin = false;
  state.storage.token = '';
  clearGoogleToken();
  keycloak.logout({ redirectUri: window.location.origin });
}

// Helper function to prepare headers
const prepareHeaders = (options: RequestInit, isFormData: boolean): Headers => {
  const headers = new Headers(options.headers);

  // Only set Content-Type for non-FormData requests
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add authorization header
  const storedToken = localStorage.getItem('googleToken');
  if (storedToken) {
    headers.set('Authorization', `Bearer ${storedToken}`);
  } else if (keycloak.token) {
    headers.set('Authorization', `Bearer ${keycloak.token}`);
  }

  // Add cache management headers - expire in 3 minutes
  headers.set('Cache-Control', 'max-age=180, must-revalidate');
  headers.set('Expires', new Date(Date.now() + 180000).toUTCString()); // 3 minutes = 180000ms

  return headers;
};

// Helper function to prepare request body
const prepareRequestBody = (options: RequestInit & { data?: any }): BodyInit | undefined => {
  if (options.method === 'GET') return undefined;
  
  if (options.body) return options.body;
  if (options.data) return JSON.stringify(options.data);
  
  return undefined;
};

// Helper function to handle response errors
const handleResponseError = (response: Response, data: any): Promise<never> => {
  // Spring Boot ResponseStatusException sends error message in 'error' field
  // but some other endpoints might use 'message' field, so check both
  const errorMessage = data.error ?? data.message ?? 'Request failed';
  const error = new Error(errorMessage);
  error.name = 'ApiError';
  Object.assign(error, { status: response.status, data });
  return Promise.reject(error);
};

// Helper function to handle 401 unauthorized errors
const handleUnauthorizedError = (): Promise<never> => {
  // Clear any stored tokens
  clearGoogleToken();
  state.storage.isLogin = false;
  state.storage.token = '';
  
  // Show error notification for 2 seconds using global state
  stateActions.showNotification({
    title: 'Session Expired',
    description: 'Your session has expired. Redirecting to login page...',
    type: 'error',
    duration: 2000,
    onClose: () => {
      // Redirect to login page when toast is closed
      globalThis.location.href = '/';
    }
  });
  
  // Also set a fallback timeout in case toast doesn't close properly
  setTimeout(() => {
    globalThis.location.href = '/';
  }, 2000);
  
  return Promise.reject(new Error('Unauthorized - redirecting to login'));
};

// Helper function to handle data errors
const handleDataError = (data: any): Promise<never> => {
  console.log(window.location.href);
  const error = new Error(data.error.message ?? data.error);
  error.name = 'ApiError';
  Object.assign(error, { data });
  return Promise.reject(error);
};

// Main request function
export const request = async (url: string, options: RequestInit & { data?: any } = {}, responseIsJson: boolean = true, timeout: number = 30000) => {
  const baseURL = import.meta.env.VITE_REQUEST_BASE_URL;
  const isFormData = options.body instanceof FormData;
  
  const fetchOptions: RequestInit = {
    ...options,
    headers: prepareHeaders(options, isFormData),
    body: prepareRequestBody(options),
  };
        
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    const response = await fetch(`${baseURL}${url}`, fetchOptions);
    clearTimeout(timeoutId);
    
    stateActions.subLoading();
    if (!responseIsJson) return response;
    
    // Check for 401 status before parsing JSON to avoid parsing errors
    if (response.status === 401) {
      return handleUnauthorizedError();
    }
    
    const data = await response.json();
    
    if (![200, 201].includes(response.status)) {
      return handleResponseError(response, data);
    }

    if (data.error) {
      return handleDataError(data);
    }

    return data;
  } catch (error: any) {
    stateActions.subLoading();
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    if (!(error instanceof Error)) {
      throw new Error(error.message ?? 'Unknown error occurred');
    }
    
    throw error;
  }
};
