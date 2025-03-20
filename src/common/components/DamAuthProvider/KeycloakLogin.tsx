import { Box, Button } from "@chakra-ui/react";
import colors from "@common/libs/chakra/colors";
import { useKeycloak } from "@react-keycloak/web";
import { useEffect } from "react";

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
    <Box mb="5">
      <Button
        isLoading={authenticating}
        onClick={doLogin}
        size="lg"
        color="white"
        backgroundColor={colors.blue[60]}
        width="158"
        id="btnLogin"
        borderRadius="10"
      >
        Login with Keycloak
      </Button>
    </Box>
  )
}