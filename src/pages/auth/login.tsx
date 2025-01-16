import { Flex, Box, Button } from "@chakra-ui/react";
import { request, setGoogleToken, useMyToast, getGoogleToken, clearGoogleToken, stateActions } from "@common/index";
import colors from "@common/libs/chakra/colors";
import { useKeycloak } from "@react-keycloak/web";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";

export default function Login({ children }: { children: React.ReactNode }) {
    const { showError } = useMyToast();
    const navigate = (path: string) => {
        window.location.href = path;
    };
    const { keycloak, initialized } = useKeycloak();
    const [authenticating, setAuthenticating] = useState<boolean>(false);
    const [isValidToken, setIsValidToken] = useState<boolean>(false);
    const [isCheckingLocalToken, setIsCheckingLocalToken] = useState<boolean>(false);
    const intl = useIntl();

    useEffect(() => {
        // Check if there's a stored Google token and verify it
        const storedToken = getGoogleToken();
        if (storedToken) {
            setIsCheckingLocalToken(true);
            verifyUserToken(storedToken, 'GOOGLE', true);
        }
    }, []);

    // Handle Keycloak authentication changes
    useEffect(() => {
        if (keycloak.authenticated && keycloak.token) {
            setIsCheckingLocalToken(true);
            verifyUserToken(keycloak.token, 'KEYCLOAK', true);
        }
    }, [keycloak.authenticated, keycloak.token]);

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
        request(`api/auth/verifyToken`, {
            method: 'POST',
            data: {
                token,
                authProvider: authProvider
            }
        }).then((res: any) => {
            stateActions.subLoading();
            if (res.authorized) {
                setIsValidToken(true);
                if (!isLocalToken) {
                    if (authProvider === 'GOOGLE') {
                        setGoogleToken(token);
                    }
                    navigate('/');
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
        if (authProvider === 'KEYCLOAK') {
            keycloak.logout({ logoutMethod: 'POST' });
        } else if (authProvider === 'GOOGLE') {
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
        keycloak.login();
    };

    const handleGoogleSuccess = (credentialResponse: any) => {
        const token = credentialResponse.credential;
        verifyUserToken(token, 'GOOGLE');
    };

    // Show children if authenticated with either method
    if (isValidToken && (keycloak.authenticated || getGoogleToken())) {
        return <>{children}</>;
    }

    // Show loading state or login buttons
    return (
        (isCheckingLocalToken || authenticating || !initialized) ? (
            <></>
        ) : (
            <Flex direction="column" align="center" justify="center" height="100vh">
                <Box mb="5">
                    <Button
                        isLoading={authenticating}
                        onClick={handleKeycloakLogin}
                        size="lg"
                        color="white"
                        backgroundColor={colors.blue[60]}
                        width="158"
                        borderRadius="10"
                    >
                        Login with Keycloak
                    </Button>
                </Box>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        setAuthenticating(false);
                        setIsValidToken(false);
                    }}
                    useOneTap
                />
            </Flex>
        )
    );
}

