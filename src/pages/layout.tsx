import React, { useRef } from 'react'
import {
  MyAlert,
  MyAuthProvider,
  MyChakraProvider,
  MyInitialState,
  MyIntlProvider,
  MyLoading,
  MyPageSearch,
} from '@/common';
import Login from "@pages/auth/login";
import { AUTH_PROVIDER } from '@/constants/enums';

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
  const auth_providers = import.meta.env.VITE_AUTH_PROVIDER || AUTH_PROVIDER.GOOGLE;
  const myAlertRef = useRef()
  return (
    <MyIntlProvider>
      <MyChakraProvider>
        <MyAuthProvider authProviders={auth_providers}>
            <Login authProviders={auth_providers}>
              <MyPageSearch>
                <MyAlertRootContext.Provider value={myAlertRef}>
                  <MyAlert ref={myAlertRef} />
                  <MyLoading />
                  <MyInitialState />
                </MyAlertRootContext.Provider>
              </MyPageSearch>
            </Login>
          </MyAuthProvider>
      </MyChakraProvider>
    </MyIntlProvider>
  )
}
