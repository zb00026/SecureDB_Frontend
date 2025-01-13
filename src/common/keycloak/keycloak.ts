import Keycloak from 'keycloak-js';

// Initialize Keycloak with the client settings from your Keycloak server
const keycloak = new Keycloak({
  url: "http://localhost:8081", // Keycloak URL
  realm: "DAM", // Replace with your realm name
  clientId: "frontend-client", // Replace with your frontend client ID
});
export default keycloak;