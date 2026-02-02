import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const isSearchable = true;
export const displayName = 'Accessor Page';

export function Component() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to assets page since there's only one action available
    navigate('/accessor/assets', { replace: true });
  }, [navigate]);

  // This component will redirect immediately, so no UI is rendered
  return null;
}