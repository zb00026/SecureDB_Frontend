import Keycloak from 'keycloak-js';

// Initialize Keycloak with the client settings from your Keycloak server
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "DAM",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "frontend-client",
});

export default keycloak;