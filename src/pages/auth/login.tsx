import { AUTH_PROVIDER } from "@/constants/enums";
import { Flex } from "@chakra-ui/react";
import KeycloakLogin from "@common/components/MyAuthProvider/KeycloakLogin";
import { request, setGoogleToken, useMyToast, getGoogleToken, clearGoogleToken, stateActions, MyFullLoading } from "@common/index";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useSearchParams } from "react-router-dom";

export default function Login({ authProviders, children }: { authProviders: string, children: React.ReactNode }) {
  const { showError } = useMyToast();
  const [authenticating, setAuthenticating] = useState<boolean>(false);
  const [isValidToken, setIsValidToken] = useState<boolean>(false);
  const [isCheckingLocalToken, setIsCheckingLocalToken] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [keycloakInitialized, setKeycloakInitialized] = useState<boolean>(false);
  const [keycloakAuthenticated, setKeycloakAuthenticated] = useState<any>(null);
  const [keycloakLoggedOut, setKeycloakLoggedOut] = useState<boolean>(false);
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('inviteCode');


  const isAuthProviderAvailable = (provider: string) => {
    const auth_providers: string[] = authProviders.split(',');
    return auth_providers.indexOf(provider) != -1;
  }

  useEffect(() => {
    // Check if there's a stored Google token and verify it
    const storedToken = getGoogleToken();
    if (storedToken) {
      setIsCheckingLocalToken(true);
      verifyUserToken(storedToken, AUTH_PROVIDER.GOOGLE.toUpperCase(), true);
    }
  }, []);

  useEffect(() => {
    if ((isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) && !keycloakInitialized) ||
      authenticating || isCheckingLocalToken) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [keycloakInitialized, authenticating, isCheckingLocalToken]);

  useEffect(() => {
    if (isCheckingLocalToken) {
      stateActions.addLoading();
    } else {
      stateActions.subLoading();
    }
  }, [isCheckingLocalToken]);

  const verifyUserToken = async (token: string | undefined, authProvider: string, isLocalToken: boolean = false) => {
    if (!token) {
      console.error("No token found.");
      return;
    }
    stateActions.addLoading();
    setAuthenticating(true);
    request(`/api/auth/verifyToken`, {
      method: 'POST',
      data: {
        token,
        inviteCode,
        authProvider: authProvider.toUpperCase()
      }
    }).then((res: any) => {
      stateActions.subLoading();
      if (res.authorized) {
        setIsValidToken(true);
        stateActions.setUser(res.user);
        stateActions.setIsLogin(true);
        if (!isLocalToken) {
          if (authProvider === AUTH_PROVIDER.GOOGLE) {
            setGoogleToken(token);
          }
        }
      } else {
        setIsValidToken(false);
        handleAuthFailure(authProvider);
      }
    }).catch((e: any) => {
      setIsValidToken(false);
      handleAuthError(e, authProvider);
    }).finally(() => {
      setAuthenticating(false);
      setIsCheckingLocalToken(false);
      stateActions.subLoading();
    });
  };
  const logoutToken = (authProvider: string) => {
    if (isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) &&
      authProvider === AUTH_PROVIDER.KEYCLOAK) {
      setKeycloakLoggedOut(true);
    } else if (isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) &&
      authProvider === AUTH_PROVIDER.GOOGLE) {
      googleLogout();
      clearGoogleToken();
    }
    setIsValidToken(false);
  }
  const handleAuthFailure = (authProvider: string) => {
    showError({
      description: "Authentication failed",
      onCloseComplete: () => {
        logoutToken(authProvider);
      }
    });
  };

  const handleAuthError = (error: any, authProvider: string) => {
    showError({
      description: error?.response?.data?.error ??
        intl.formatMessage({ id: 'text.login_failed' }),
      onCloseComplete: () => {
        logoutToken(authProvider);
      }
    });
  };

  const handleKeycloakLogin = () => {
    setAuthenticating(true);
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    const token = credentialResponse.credential;
    verifyUserToken(token, AUTH_PROVIDER.GOOGLE);
  };

  // Show children if authenticated with either method
  if (isValidToken && (
    (isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) && keycloakAuthenticated) ||
    (isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && getGoogleToken()))) {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete('inviteCode');
    const newUrl = window.location.pathname + '?' + queryParams.toString();
    window.history.replaceState({}, '', newUrl);
    return <>{children}</>;
  }

  // Show loading state or login buttons
  return (
    <Flex direction="column" align="center" justify="center" height="100vh">
      {isLoading && <MyFullLoading showBackground />}
      {
        isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) &&

        <KeycloakLogin
          authenticating={authenticating}
          inviteCode={inviteCode}
          handleKeycloakLogin={handleKeycloakLogin}
          onInitialized={() => { setKeycloakInitialized(true) }}
          isLoggedOut={keycloakLoggedOut}
          onAuthenticated={(token: string) => {
            setIsCheckingLocalToken(true);
            setKeycloakAuthenticated(true);
            verifyUserToken(token, AUTH_PROVIDER.KEYCLOAK, true);
          }}
        />
      }
      {
        isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            setAuthenticating(false);
            setIsValidToken(false);
          }}
          useOneTap
        />
      }
    </Flex>
  );
}

