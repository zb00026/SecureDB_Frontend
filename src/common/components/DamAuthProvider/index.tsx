import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import KeycloakProvider from "./KeycloakProvider";
import { AUTH_PROVIDER } from "@/constants/enums";

export function DamAuthProvider({ authProviders, children }: { readonly authProviders: string, readonly children: React.ReactNode }) {
  const providers: string[] = authProviders.split(',');
  if (!providers?.length) {
    return (<>{children}</>);
  }

  return (
    providers.includes(AUTH_PROVIDER.GOOGLE) ? (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <KeycloakProvider providers={providers} children={children} />
      </GoogleOAuthProvider>
    ) : (
      <KeycloakProvider providers={providers} children={children} />
    )
  );
}