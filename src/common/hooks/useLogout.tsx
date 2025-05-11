import { clearGoogleToken, state } from "@common/index"; // Ensure these are correctly imported
import keycloak from "@common/keycloak/keycloak";

const useLogout = () => {

    const logout = () => {
        state.storage.isLogin = false;
        state.storage.token = '';
        clearGoogleToken();
        keycloak.logout({ redirectUri: window.location.origin });
    };

    return logout;
};

export default useLogout;