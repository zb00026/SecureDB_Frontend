import { useNavigate } from "react-router-dom";
import { clearGoogleToken, state } from "@common/index"; // Ensure these are correctly imported
import keycloak from "@common/keycloak/keycloak";

const useLogout = () => {
    const navigate = useNavigate();

    const logout = () => {
        clearGoogleToken();
        keycloak.logout();
        state.storage.isLogin = false;
        state.storage.token = '';
        navigate('/'); // Navigate after logging out
    };

    return logout;
};

export default useLogout;