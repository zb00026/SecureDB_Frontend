import React from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "@common/keycloak/keycloak";
import { AUTH_PROVIDER } from "@/constants/enums";

interface KeycloakProviderProps {
  children: React.ReactNode;
  providers: string[];
}

const KeycloakProvider: React.FC<KeycloakProviderProps> = ({ children, providers }) => {
  // Check if Keycloak is included in the list of providers
  const isKeycloakEnabled = providers.includes(AUTH_PROVIDER.KEYCLOAK);

  return isKeycloakEnabled ? (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false
      }}
    >
      {children}
    </ReactKeycloakProvider>
  ) : (
    <>{children}</>
  );
};

export default KeycloakProvider;
