import { AUTH_PROVIDER, USER_ROLE } from "@/constants/enums";
import { 
  VStack,
  Heading,
  Text,
  HStack,
  Divider,
  Box,
  Link
} from "@chakra-ui/react";
import KeycloakLogin from "@common/components/DamAuthProvider/KeycloakLogin";
import DamAuthLayout from "@common/components/DamAuthLayout";
import DamAuthCard from "@common/components/DamAuthCard";
import { request, setGoogleToken, useDamToast, getGoogleToken, clearGoogleToken, stateActions, DamFullLoading, userHasRole } from "@common/index";
import { User } from "@models/User";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useSearchParams, useNavigate, Link as RouterLink } from "react-router-dom";

import ForgotPassword from "./forgot-password";
import ResetPassword from "./reset-password";

export default function Login({ authProviders, children }: { authProviders: string, children: React.ReactNode }) {
  const { showError, showSuccess } = useDamToast();
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
  const navigate = useNavigate();

  // Store invite code in localStorage when it's found in URL, so it persists through Keycloak redirects
  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('pendingInviteCode', inviteCode);
      console.log('Stored invite code for later use:', inviteCode);
    }
  }, [inviteCode]);

  // Retrieve stored invite code (for use after Keycloak redirects)
  const getStoredInviteCode = () => {
    return localStorage.getItem('pendingInviteCode');
  };

  // Clear stored invite code after successful authentication
  const clearStoredInviteCode = () => {
    localStorage.removeItem('pendingInviteCode');
  };

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
        inviteCode: getStoredInviteCode(),
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
        handleLoginSuccess(res.user);
        clearStoredInviteCode();
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
    // Try multiple possible error message paths from Spring Boot ResponseStatusException
    const errorMessage = error?.response?.data?.message ?? 
                         error?.response?.data?.error ?? 
                         error?.message ??
                         intl.formatMessage({ id: 'text.login_failed' });
    
    console.log('Authentication error details:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: errorMessage
    });
    
    showError({
      description: errorMessage,
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

  const showAuditLogStorageNotConfigured = () => {
    showError({ 
      description: intl.formatMessage({ id: 'text.audit_log_storage_not_configured' })
    });
    navigate('/admin/settings');
  }

  const checkAssetCredential = (user: User) => {
    if (userHasRole(user, USER_ROLE.ASSET_OWNER) ?? userHasRole(user, USER_ROLE.ADMIN)) {
      request('/api/asset_owner/assets/new-credentials', {})
      .then((res) => {
        if(res.length > 0) {
          showError({
            description: intl.formatMessage({ id: 'text.new_asset_is_assigned' }),
          });
          navigate('/asset_owner');
        }
      })
      .catch((e) => {
        console.log(e);
      })
    }
  }

  const handleLoginSuccess = async (user: User) => {
    // Check if user is admin
    if (userHasRole(user, USER_ROLE.ADMIN)) {
      request('/api/admin/settings/get-current-audit-log-storage', {
        method: 'GET',
      }).then((res: any) => {
        if (res.bucketName === '') {
          showAuditLogStorageNotConfigured();
        } else {
          checkAssetCredential(user);
        }
      }).catch((e: any) => {
        showAuditLogStorageNotConfigured();
      });
    }
    if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
      checkAssetCredential(user);
    }
    if (userHasRole(user, USER_ROLE.DEVELOPER)) {
      request('/api/developer/assets/get_newly_approved_requests', {
        method: 'GET',
      }).then((res: any) => {
        if (res.length > 0) {
          showSuccess({
            description: intl.formatMessage({ id: 'text.access_request_approved_to_update_psd' }),
          });
          navigate('/developer/assets');
        }
      })
    }

  };
  
  const currentUrl = new URL(window.location.href);
  if (currentUrl.pathname.includes('/auth/reset-password')) {
    return <ResetPassword />
  }
  if (currentUrl.pathname.includes('/auth/forgot-password')) {
    return <ForgotPassword />
  }
  // Show children if authenticated with either method
  if (isValidToken && (
    (isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) && keycloakAuthenticated) ||
    (isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && getGoogleToken()))) {
    
    // Clean up the URL by removing the inviteCode parameter
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('inviteCode')) {
      currentUrl.searchParams.delete('inviteCode');
      // Use navigate to redirect to clean URL without inviteCode
      const cleanPath = currentUrl.pathname + (currentUrl.search ?? '');
      navigate(cleanPath.endsWith('?') ? cleanPath.slice(0, -1) : cleanPath, { replace: true });
    }
    
    return <>{children}</>;
  }

  return (
    <DamAuthLayout>
      {isLoading && <DamFullLoading showBackground />}
      
      <DamAuthCard>
        <VStack spacing={6}>
          <VStack spacing={2} textAlign="center">
            <Heading size="lg" color="gray.700" _dark={{ color: 'gray.200' }}>
              Welcome Back
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              Sign in to access your dashboard
            </Text>
          </VStack>

          <VStack spacing={4} w="full">
            {isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) && (
              <KeycloakLogin
                authenticating={authenticating}
                inviteCode={getStoredInviteCode()}
                handleKeycloakLogin={handleKeycloakLogin}
                onInitialized={() => { setKeycloakInitialized(true) }}
                isLoggedOut={keycloakLoggedOut}
                onAuthenticated={(token: string) => {
                  setIsCheckingLocalToken(true);
                  setKeycloakAuthenticated(true);
                  verifyUserToken(token, AUTH_PROVIDER.KEYCLOAK, true);
                }}
              />
            )}

            {isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && 
             isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) && (
              <HStack w="full" spacing={4}>
                <Divider />
                <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                  OR
                </Text>
                <Divider />
              </HStack>
            )}

            {isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && (
              <Box w="full" display="flex" justifyContent="center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setAuthenticating(false);
                    setIsValidToken(false);
                  }}
                  useOneTap
                />
              </Box>
            )}
          </VStack>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            Protected by enterprise-grade security
          </Text>

          <Box w="full" textAlign="center">
            <Link
              as={RouterLink}
              to="/auth/forgot-password"
              color="brand.500"
              _hover={{ textDecoration: 'underline' }}
              fontSize="sm"
            >
              Forgot password?
            </Link>
          </Box>
        </VStack>
      </DamAuthCard>
    </DamAuthLayout>
  );
}

