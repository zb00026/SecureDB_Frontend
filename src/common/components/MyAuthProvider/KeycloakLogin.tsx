import { Box, Button } from "@chakra-ui/react";
import colors from "@common/libs/chakra/colors";
import { useKeycloak } from "@react-keycloak/web";
import { useEffect } from "react";

export interface KeycloakLoginType {
  onInitialized: () => void,
  handleKeycloakLogin: () => void,
  onAuthenticated: (token: string) => void,
  isLoggedOut: boolean,
  authenticating: boolean
}
export default function KeycloakLogin({
  onInitialized,
  handleKeycloakLogin,
  onAuthenticated,
  isLoggedOut,
  authenticating }: KeycloakLoginType) {

  const { keycloak, initialized } = useKeycloak();
  useEffect(() => {
    if (initialized) {
      onInitialized();
    }
  }, [initialized, onInitialized]);

  useEffect(() => {
    if (isLoggedOut) {
      keycloak?.logout({ logoutMethod: 'POST' });
    }
  }, [isLoggedOut]);

  useEffect(() => {
    if (keycloak?.authenticated && keycloak?.token) {
      onAuthenticated(keycloak?.token);
    }
  }, [keycloak?.authenticated, keycloak?.token]);
  useEffect(() => {
    console.log('authenticating', authenticating);
  }, [authenticating]);
  return (
    <Box mb="5">
      <Button
        isLoading={authenticating}
        onClick={() => {
          keycloak?.login();
          handleKeycloakLogin();
        }}
        size="lg"
        color="white"
        backgroundColor={colors.blue[60]}
        width="158"
        borderRadius="10"
      >
        Login with Keycloak
      </Button>
    </Box>
  )
}