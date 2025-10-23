// Sample data constants for testing and development

// Email addresses from environment variables with fallbacks  
export const SAMPLE_IPS = {
  IP_1: import.meta.env.VITE_SAMPLE_IP_1 || 'Unknown IP',
  IP_2: import.meta.env.VITE_SAMPLE_IP_2 || 'Unknown IP',
  IP_3: import.meta.env.VITE_SAMPLE_IP_3 || 'Unknown IP'
} as const;

export const SAMPLE_EMAILS = {
  USER_1: 'john.doe@example.com',
  USER_2: 'jane.smith@example.com',
  USER_3: 'admin@example.com'
} as const;

export const SAMPLE_ASSETS = {
  ASSET_1: 'Production Database',
  ASSET_2: 'Staging Database',
  ASSET_3: 'Analytics Database'
} as const;
