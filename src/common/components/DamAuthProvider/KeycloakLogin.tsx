import {
  Box,
  Button,
  Flex,
  Icon,
  Text
} from "@chakra-ui/react";
import { useKeycloak } from "@react-keycloak/web";
import { useEffect } from "react";
import { FiShield } from 'react-icons/fi';

export interface KeycloakLoginType {
  onInitialized: () => void,
  handleKeycloakLogin: () => void,
  onAuthenticated: (token: string) => void,
  isLoggedOut: boolean,
  inviteCode: string | null,
  usedInviteCode: string | null,
  authenticating: boolean
}
export default function KeycloakLogin({
  onInitialized,
  handleKeycloakLogin,
  onAuthenticated,
  isLoggedOut,
  inviteCode,
  usedInviteCode,
  authenticating }: Readonly<KeycloakLoginType>) {

  const { keycloak, initialized } = useKeycloak();

  // Parse Keycloak callback parameters from hash fragment (not query params)
  const getKeycloakCallbackParams = () => {
    const hash = globalThis.location.hash.substring(1); // Remove the # at the beginning
    const params = new URLSearchParams(hash);
    return {
      state: params.get('state'),
      session_state: params.get('session_state'),
      iss: params.get('iss'),
      code: params.get('code')
    };
  };

  const { state, session_state, iss, code } = getKeycloakCallbackParams();
  const hasSession = state && session_state && iss && code;

  useEffect(() => {
    if (initialized) {
      onInitialized();
    }
  }, [initialized, onInitialized]);

  const doLogin = () => {
    const storedInviteCode = localStorage.getItem('pendingInviteCode');
    // If there's an invite code, redirect to a clean URL after login
    const redirectUri = inviteCode || storedInviteCode
      ? globalThis.location.origin + globalThis.location.pathname + '?usedInviteCode=true'
      : globalThis.location.origin + globalThis.location.pathname;

    keycloak?.login({
      redirectUri: redirectUri
    });
    handleKeycloakLogin();
  };

  useEffect(() => {
    if (isLoggedOut) {
      keycloak?.logout({ logoutMethod: 'POST' });
    }
  }, [isLoggedOut]);

  useEffect(() => {
    if (keycloak?.authenticated && keycloak?.token) {
      // If user is authenticated and we have an inviteCode in the URL (not usedInviteCode),
      // it means they came directly with inviteCode and need to logout and re-login
      if (inviteCode && !usedInviteCode) {
        keycloak?.logout({ logoutMethod: 'POST', redirectUri: globalThis.location.origin + globalThis.location.pathname + '?inviteCode=' + inviteCode });
      } else {
        // User is authenticated with a valid token (either fresh login or with usedInviteCode)
        onAuthenticated(keycloak?.token);
      }
    } else if (!keycloak?.authenticated && !hasSession) {
      // User is not authenticated AND there's no active Keycloak session
      // Check if there's an invite code that should trigger login
      const storedInviteCode = localStorage.getItem('pendingInviteCode');
      
      // Only trigger login if we have inviteCode in URL (not usedInviteCode)
      if (inviteCode && !usedInviteCode) {
        doLogin();
      } else if (storedInviteCode && usedInviteCode && !keycloak?.authenticated) {
        // We came back from Keycloak with usedInviteCode but not authenticated yet
        // This is normal, wait for Keycloak to authenticate
      }
    }
    // If hasSession is true, we're in the middle of Keycloak callback processing
    // so we should wait for Keycloak to complete authentication
  }, [keycloak?.authenticated, keycloak?.token, inviteCode, usedInviteCode, hasSession]);
  useEffect(() => {
  }, [authenticating]);
  return (
    <Box w="full">
      <Button
        isLoading={authenticating}
        loadingText="Connecting to Keycloak..."
        onClick={doLogin}
        size="lg"
        w="full"
        h="14"
        colorScheme="brand"
        variant="solid"
        id="btnLogin"
        borderRadius="xl"
        bgGradient="linear(to-r, brand.500, brand.600)"
        _hover={{
          bgGradient: "linear(to-r, brand.600, brand.700)",
          transform: "translateY(-1px)",
          boxShadow: "lg",
        }}
        _active={{
          transform: "translateY(0)",
        }}
        transition="all 0.2s ease-in-out"
        fontWeight="600"
        boxShadow="md"
      >
        {!authenticating && (
          <Flex gap={3} direction={'row'} alignItems={'center'}>
            <Icon as={FiShield} boxSize={5} />
            <Text mb={0}>Login with Keycloak</Text>
          </Flex>
        )}
      </Button>
    </Box>
  )
}