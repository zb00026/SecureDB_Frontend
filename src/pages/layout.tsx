import React, { useRef } from 'react'
import { Outlet, Link, useRouteLoaderData } from 'react-router-dom'
import {
  MyAlert,
  MyChakraProvider,
  MyInitialState,
  MyIntlProvider,
  MyLoading,
} from '@/common'

import keycloak from "@common/keycloak/keycloak";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import Login from "@pages/auth/login";
import { GoogleOAuthProvider } from '@react-oauth/google';

export const MyAlertRootContext = React.createContext({})

export const id = '/'

export function loader() {
  return {
    root: 'root'
  }
}

export function handle() { }

export function action() { }

export function ErrorBoundary() {
  return (
    <div className="route-error">Route Error</div>
  )
}

export function shouldRevalidate() {
  return false
}
export function Component() {
  const myAlertRef = useRef()
  return (
    <MyIntlProvider>
      <MyChakraProvider>

        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{
              onLoad: 'check-sso',
              silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
              checkLoginIframe: false
            }}
          >
            <Login>
              <MyAlertRootContext.Provider value={myAlertRef}>
                <MyAlert ref={myAlertRef} />
                <MyLoading />
                <MyInitialState />
              </MyAlertRootContext.Provider>

            </Login>

          </ReactKeycloakProvider>
        </GoogleOAuthProvider>
      </MyChakraProvider>
    </MyIntlProvider>
  )
}
