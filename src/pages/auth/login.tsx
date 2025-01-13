import { Flex } from "@chakra-ui/react";
import { useKeycloak } from "@react-keycloak/web";

export default function Login({ children }: { children: React.ReactNode }) {
    const { keycloak, initialized } = useKeycloak();
    console.log('Keycloak initialized:', initialized);
    console.log('Keycloak authenticated:', keycloak.authenticated);

    // Wait until Keycloak is initialized
    if (!initialized) {
        return null;
    }

    if (!keycloak.authenticated) {
        keycloak.login();
        return null;
    }

    return <>{children}</>;
}