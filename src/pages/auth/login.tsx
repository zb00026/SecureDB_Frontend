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
  const [hasProcessedAuthentication, setHasProcessedAuthentication] = useState<boolean>(false);
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('inviteCode');
  const usedInviteCode = searchParams.get('usedInviteCode');
  const navigate = useNavigate();

  // Store invite code in localStorage when it's found in URL, so it persists through Keycloak redirects
  useEffect(() => {
    if (inviteCode && !usedInviteCode) {
      localStorage.setItem('pendingInviteCode', inviteCode);
    }
    
    // Mark that we've used the invite code when coming back from Keycloak
    if (usedInviteCode) {
      localStorage.setItem('usedInviteCode', 'true');
    }
    
    // Clean up if neither parameter is present
    if (!usedInviteCode && !inviteCode) {
      localStorage.removeItem('pendingInviteCode');
      localStorage.removeItem('usedInviteCode');
    }
  }, [inviteCode, usedInviteCode]);

  // Clear stored invite code after successful authentication
  const clearStoredInviteCode = () => {
    localStorage.removeItem('pendingInviteCode');
    localStorage.removeItem('usedInviteCode');
    // Clean up URL parameters
    const currentUrl = new URL(globalThis.location.href);
    if (currentUrl.searchParams.has('inviteCode')) {
      currentUrl.searchParams.delete('inviteCode');
    }
    if (currentUrl.searchParams.has('usedInviteCode')) {
      currentUrl.searchParams.delete('usedInviteCode');
    }
    // Navigate to clean URL
    const cleanPath = currentUrl.pathname + (currentUrl.search ?? '');
    navigate(cleanPath.endsWith('?') ? cleanPath.slice(0, -1) : cleanPath, { replace: true });
  };

  // Retrieve stored invite code (for use after Keycloak redirects)
  const getStoredInviteCode = () => {
    // Only return stored invite code if we have usedInviteCode parameter in URL
    // or if we have it marked in localStorage
    const hasUsedInviteCode = usedInviteCode || localStorage.getItem('usedInviteCode');
    return hasUsedInviteCode ? localStorage.getItem('pendingInviteCode') : null;
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
    if (((isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) || isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK_SSO)) && !keycloakInitialized) ||
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

  const handleTokenVerificationSuccess = (res: any, token: string, authProvider: string, isLocalToken: boolean) => {
    setIsValidToken(true);
    stateActions.setUser(res.user);
    stateActions.setIsLogin(true);

    if (!isLocalToken && authProvider === AUTH_PROVIDER.GOOGLE) {
      setGoogleToken(token);
    }

    handleLoginSuccess(res.user);
    clearStoredInviteCode();
  };

  const verifyUserToken = async (token: string | undefined, authProvider: string, isLocalToken: boolean = false) => {
    if (!token) {
      console.error("No token found.");
      return;
    }

    // Prevent duplicate authentication processing
    if (hasProcessedAuthentication) {
      return;
    }
    
    setHasProcessedAuthentication(true);
    stateActions.addLoading();
    setAuthenticating(true);

    try {
      const res = await request(`/api/auth/verifyToken`, {
        method: 'POST',
        data: {
          token,
          inviteCode: getStoredInviteCode(),
          authProvider: authProvider.toUpperCase()
        }
      });

      if (res.authorized) {
        handleTokenVerificationSuccess(res, token, authProvider, isLocalToken);
      } else {
        setIsValidToken(false);
        handleAuthFailure(authProvider);
      }
    } catch (e: any) {
      setIsValidToken(false);
      handleAuthError(e, authProvider);
    } finally {
      setAuthenticating(false);
      setIsCheckingLocalToken(false);
      stateActions.subLoading();
    }
  };
  const logoutKeycloak = () => {
    setKeycloakLoggedOut(true);
    setIsValidToken(false);
    setHasProcessedAuthentication(false);
  };

  const logoutGoogle = () => {
    googleLogout();
    clearGoogleToken();
    setIsValidToken(false);
    setHasProcessedAuthentication(false);
  };

  const logoutToken = (authProvider: string) => {
    const isKeycloakProvider = (isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) && authProvider === AUTH_PROVIDER.KEYCLOAK) ||
      (isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK_SSO) && authProvider === AUTH_PROVIDER.KEYCLOAK_SSO);
    const isGoogleProvider = isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && authProvider === AUTH_PROVIDER.GOOGLE;

    if (isKeycloakProvider) {
      logoutKeycloak();
    } else if (isGoogleProvider) {
      logoutGoogle();
    }
  };
  const handleAuthFailure = (authProvider: string) => {
    // Clean up URL parameters on authentication failure
    clearStoredInviteCode();
    
    showError({
      description: "Authentication failed",
      onCloseComplete: () => {
        logoutToken(authProvider);
      }
    });
  };

  const handleAuthError = (error: any, authProvider: string) => {
    // Clean up URL parameters on authentication error
    clearStoredInviteCode();
    
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
      // Check for new credentials first
      request('/api/asset_owner/assets/new-credentials', {})
        .then((res) => {
          if (res.length > 0) {
            showError({
              description: intl.formatMessage({ id: 'text.new_asset_is_assigned' }),
            });
            navigate('/asset_owner');
          } else {
            // If no new credentials, check for pending approval requests
            checkPendingApprovals();
          }
        })
        .catch((e) => {
          console.log(e);
          // Even if new credentials check fails, still check for pending approvals
          checkPendingApprovals();
        })
    }
  }

  const checkPendingApprovals = () => {
    
    request('/api/asset_owner/assets/approvals', {})
      .then((res) => {
        if (res.length > 0) {
          showSuccess({
            description: intl.formatMessage({ id: 'text.pending_approval_requests_found' }),
          });
          navigate('/asset_owner?tab=approvals');
        }
      })
      .catch((e) => {
        console.log('Failed to check pending approvals:', e);
      })
  }

  const handleAdminLogin = async (user: User) => {
    try {
      const res = await request('/api/admin/settings/get-current-audit-log-storage', {
        method: 'GET',
      });
      if (res.bucketName === '') {
        showAuditLogStorageNotConfigured();
      } else {
        checkAssetCredential(user);
      }
    } catch (error: any) {
      console.error('Failed to check audit log storage configuration:', error);
      showAuditLogStorageNotConfigured();
    }
  };

  const handleDeveloperLogin = async () => {
    try {
      const res = await request('/api/developer/assets/get_newly_approved_requests', {
        method: 'GET',
      });
      if (res.length > 0) {
        showSuccess({
          description: intl.formatMessage({ id: 'text.access_request_approved_to_update_psd' }),
        });
        navigate('/developer/assets');
      }
    } catch (e) {
      console.log('Failed to check approved requests:', e);
    }
  };

  const handleLoginSuccess = async (user: User) => {
    if (userHasRole(user, USER_ROLE.ADMIN)) {
      await handleAdminLogin(user);
    } else if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
      // Only call checkAssetCredential if user is not ADMIN (since handleAdminLogin already calls it)
      checkAssetCredential(user);
    }
    if (userHasRole(user, USER_ROLE.DEVELOPER)) {
      await handleDeveloperLogin();
    }
  };

  const currentUrl = new URL(window.location.href);
  if (currentUrl.pathname.includes('/auth/reset-password')) {
    return <ResetPassword />
  }
  if (currentUrl.pathname.includes('/auth/forgot-password')) {
    return <ForgotPassword />
  }
  const isKeycloakAuthenticated = (isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) || isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK_SSO)) && keycloakAuthenticated;
  const isGoogleAuthenticated = isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE) && getGoogleToken();
  const isAuthenticated = isValidToken && (isKeycloakAuthenticated || isGoogleAuthenticated);

  const cleanupInviteCodeFromUrl = () => {
    const hasPendingInviteCode = localStorage.getItem('pendingInviteCode');
    const hasUsedInviteCode = localStorage.getItem('usedInviteCode');

    if (!hasPendingInviteCode && !hasUsedInviteCode) {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('inviteCode')) {
        currentUrl.searchParams.delete('inviteCode');
        const cleanPath = currentUrl.pathname + (currentUrl.search ?? '');
        navigate(cleanPath.endsWith('?') ? cleanPath.slice(0, -1) : cleanPath, { replace: true });
      }
    }
  };

  const isKeycloakProviderAvailable = isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK) || isAuthProviderAvailable(AUTH_PROVIDER.KEYCLOAK_SSO);
  const isGoogleProviderAvailable = isAuthProviderAvailable(AUTH_PROVIDER.GOOGLE);
  const showDivider = isGoogleProviderAvailable && isKeycloakProviderAvailable;

  const renderKeycloakLogin = () => {
    if (!isKeycloakProviderAvailable) return null;

    return (
      <KeycloakLogin
        authenticating={authenticating}
        inviteCode={inviteCode}
        usedInviteCode={usedInviteCode}
        handleKeycloakLogin={handleKeycloakLogin}
        onInitialized={() => { setKeycloakInitialized(true) }}
        isLoggedOut={keycloakLoggedOut}
        onAuthenticated={(token: string) => {
          setIsCheckingLocalToken(true);
          setKeycloakAuthenticated(true);
          verifyUserToken(token, AUTH_PROVIDER.KEYCLOAK, true);
        }}
      />
    );
  };

  const renderGoogleLogin = () => {
    if (!isGoogleProviderAvailable) return null;

    return (
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
    );
  };

  const renderDivider = () => {
    if (!showDivider) return null;

    return (
      <HStack w="full" spacing={4}>
        <Divider />
        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
          OR
        </Text>
        <Divider />
      </HStack>
    );
  };

  // Show children if authenticated with either method
  if (isAuthenticated) {
    cleanupInviteCodeFromUrl();
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
            {renderKeycloakLogin()}
            {renderDivider()}
            {renderGoogleLogin()}
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

