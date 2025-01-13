import React, { useRef } from 'react'
import { Outlet, Link, useRouteLoaderData } from 'react-router-dom'
import {
  MyAlert,
  MyChakraProvider,
  MyInitialState,
  MyIntlProvider,
  MyLoading,
} from '@/common'
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
        <MyAlertRootContext.Provider value={myAlertRef}>
          <MyAlert ref={myAlertRef} />
          <MyLoading />
          <MyInitialState />
        </MyAlertRootContext.Provider>
      </MyChakraProvider>
    </MyIntlProvider>
  )
}
