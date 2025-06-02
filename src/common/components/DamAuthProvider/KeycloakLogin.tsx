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
  authenticating: boolean
}
export default function KeycloakLogin({
  onInitialized,
  handleKeycloakLogin,
  onAuthenticated,
  isLoggedOut,
  inviteCode,
  authenticating }: Readonly<KeycloakLoginType>) {

  const { keycloak, initialized } = useKeycloak();

  const params = new URLSearchParams(window.location.hash);
  const state = params.get('state');
  const session_state = params.get('session_state');
  const iss = params.get('iss');
  const code = params.get('code');
  const hasSession = state && session_state && iss && code;
  
  useEffect(() => {
    if (initialized) {
      onInitialized();
    }
  }, [initialized, onInitialized]);

  const doLogin = () => {
    keycloak?.login();
    handleKeycloakLogin();
  };

  useEffect(() => {
    if (isLoggedOut) {
      keycloak?.logout({ logoutMethod: 'POST' });
    }
  }, [isLoggedOut]);

  useEffect(() => {
    if (keycloak?.authenticated && keycloak?.token) {
      onAuthenticated(keycloak?.token);
    } else if (inviteCode && !hasSession) {
      doLogin();
    }
  }, [keycloak?.authenticated, keycloak?.token, inviteCode]);
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