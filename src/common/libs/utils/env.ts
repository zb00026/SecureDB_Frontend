import { getRuntimeConfig } from '../../../runtimeConfig';

export async function getKeycloakSettings() {
  const cfg = await getRuntimeConfig().catch(() => null);
  return {
    url: cfg?.keycloakUrl ?? (import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081'),
    realm: cfg?.keycloakRealm ?? (import.meta.env.VITE_KEYCLOAK_REALM || 'DAM'),
    clientId: cfg?.keycloakClientId ?? (import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend-client'),
  };
}

export async function getRequestBaseUrl() {
  const cfg = await getRuntimeConfig().catch(() => null);
  return cfg?.requestBaseUrl ?? import.meta.env.VITE_REQUEST_BASE_URL;
}

export async function getWebsocketUrl() {
  const cfg = await getRuntimeConfig().catch(() => null);
  return cfg?.websocketUrl ?? (import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080');
}

export async function getAuthProviderValue() {
  const cfg = await getRuntimeConfig().catch(() => null);
  return cfg?.authProvider ?? import.meta.env.VITE_AUTH_PROVIDER;
}



