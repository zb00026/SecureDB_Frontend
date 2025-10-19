import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const isSearchable = true;
export const displayName = 'Developer Page';

export function Component() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to assets page since there's only one action available
    navigate('/developer/assets', { replace: true });
  }, [navigate]);

  // This component will redirect immediately, so no UI is rendered
  return null;
}