import { AUTH_PROVIDER } from "@/constants/enums";
import keycloak from "@common/keycloak/keycloak";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";

export function MyAuthProvider({ authProviders, children }: { authProviders: string, children: React.ReactNode }) {
  const providers: string[] = authProviders.split(',');
  if (!providers?.length) {
    return (<>{children}</>);
  }

  const KeycloakProvider = () => {
    return (
      providers.indexOf(AUTH_PROVIDER.KEYCLOAK) != -1 ? (
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
        <> {children} </>
      )
    );
  }

  return (
    providers.indexOf(AUTH_PROVIDER.GOOGLE) != -1 ? (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <KeycloakProvider />
      </GoogleOAuthProvider>
    ) : (
      <KeycloakProvider />
    )
  );

}