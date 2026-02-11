import React, { useRef } from 'react'
import {
  DamAlert,
  DamAuthProvider,
  DamChakraProvider,
  DamInitialState,
  DamIntlProvider,
  DamLoading,
  DamPageSearch,
} from '@/common';
import { TimezoneProvider } from '@common/contexts/TimezoneContext';
import Login from "@pages/hagrids_auth/login";
import { AUTH_PROVIDER } from '@/constants/enums';

export const DamAlertRootContext = React.createContext({})

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
  const auth_providers = import.meta.env.VITE_AUTH_PROVIDER || AUTH_PROVIDER.GOOGLE;
  const myAlertRef = useRef()
  return (
    <DamIntlProvider>
      <DamChakraProvider>
        <TimezoneProvider>
          <DamAuthProvider authProviders={auth_providers}>
              <Login authProviders={auth_providers}>
                <DamPageSearch>
                  <DamAlertRootContext.Provider value={myAlertRef}>
                    <DamAlert ref={myAlertRef} />
                    <DamLoading />
                    <DamInitialState />
                  </DamAlertRootContext.Provider>
                </DamPageSearch>
              </Login>
            </DamAuthProvider>
        </TimezoneProvider>
      </DamChakraProvider>
    </DamIntlProvider>
  )
}
