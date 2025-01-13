import { BrowserRouter, createBrowserRouter, RouterProvider, useRoutes } from "react-router-dom";
import routes from "route-views";
import "./global.scss";
import "./main.scss";
import "./polyfills";
import keycloak from "@common/keycloak/keycloak";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import Login from "@pages/auth/login";


const router = createBrowserRouter(routes)

export default function App() {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false
      }}
    >
      <Login>
        <RouterProvider
          router={router} 
        />
      </Login>

    </ReactKeycloakProvider>
  );
}
