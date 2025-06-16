export interface LicenseStatus {
  isValid: boolean;
  isExpiringSoon: boolean;
  expiryDate?: Date;
  daysUntilExpiry?: number;
  warningMessage?: string;
} 