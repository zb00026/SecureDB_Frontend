import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const isSearchable = true;
export const displayName = 'Admin Page';

export function Component() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard since admin navigation is now integrated there
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}