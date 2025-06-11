import { USER_ROLE } from "@/constants/enums";
import { passwordRequirements } from "@common/components/DamPasswordInput";
import { Role } from "@models/Role";
import { User } from "@models/User";

export function isAuthorizedPath(path: string, user?: User): boolean {
  if (!user?.roles.length) return false;
  let hasRole: boolean = false;
  if (path == '/') return true;

  user.roles.forEach((role: Role) => {
    const userRole = role.name;
    if (!userRole) return;

    if (path.startsWith('/admin') && userRole == USER_ROLE.ADMIN) {
      hasRole = true;
    }

    if (path.startsWith('/developer') && userRole == USER_ROLE.DEVELOPER) {
      hasRole = true;
    }
    if (path.startsWith('/asset_owner') && userRole == USER_ROLE.ASSET_OWNER) {
      hasRole = true;
    }
    if (path.startsWith('/approver') && userRole == USER_ROLE.APPROVER) {
      hasRole = true;
    }
    if (path.startsWith('/auditor') && userRole == USER_ROLE.AUDITOR) {
      hasRole = true;
    }

    // Add audit trail access for both ADMIN and AUDITOR
    if (path.startsWith('/auditor/audit-trail') && 
        (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.AUDITOR)) {
      hasRole = true;
    }

    if (path.startsWith('/asset_owner') && 
        (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.ASSET_OWNER)) {
      hasRole = true;
    }
  })


  return hasRole;
}

export function userHasRole(user?: User, roleName?: string): boolean {
  if (!user?.roles) {
    return false;
  }
  if (!user?.roles.length) return false;
  let hasRole: boolean = false;
  if (!roleName) return false;

  user.roles.forEach((role: Role) => {
    const userRole = role.name;
    if (!userRole) return;
    if (userRole == roleName) {
      hasRole = true;
    }
  });

  return hasRole;
}

// Add type definition for userAgentData
interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform: string;
  };
}

export function getMetaKeyName(): string {
  if (typeof navigator !== "undefined") {
    const nav = navigator as NavigatorWithUserAgentData;
    // Check if userAgentData is available (modern browsers)
    if (nav.userAgentData?.platform) {
      return nav.userAgentData.platform.toLowerCase().includes('mac') ? "⌘" : "Ctrl";
    }
    // Fallback for older browsers
    return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
  }
  return "Ctrl";
}

const specialKeyMap: Record<string, string> = {
  'BracketLeft': '[',
  'BracketRight': ']',
  'Backslash': '\\',
  'Slash': '/',
  'Period': '.',
  'Comma': ',',
  'Semicolon': ';',
  'Quote': "'",
  'Minus': '-',
  'Equal': '=',
  'Backquote': '`'
};

export function getDisplayedKey(e: KeyboardEvent): string {
  const modifiers = [];
  if (e.metaKey) modifiers.push(getMetaKeyName());
  if (e.ctrlKey) modifiers.push("Ctrl");
  if (e.altKey) modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");
  if (!e.code) return '';
  // First check if it's a special key
  let key = specialKeyMap[e.code];
  // If not a special key, handle regular keys
  if (!key) {
    key = e.code.startsWith("Key") ? e.code.replace("Key", "") : e.key;
  }
  return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
}



/**
 * Generates a secure random password that meets all complexity requirements
 */
/**
 * Cryptographically secure random number generator
 */
function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Cryptographically secure array shuffling using Fisher-Yates algorithm
 */
function secureArrayShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateComplexPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:\'",.<>/?';
  
  // Ensure we have at least one character from each required category
  const requiredChars = [
    uppercase[getSecureRandomInt(uppercase.length)],
    lowercase[getSecureRandomInt(lowercase.length)],
    digits[getSecureRandomInt(digits.length)],
    specialChars[getSecureRandomInt(specialChars.length)]
  ];
  
  // Fill the rest with random characters from all categories
  const allChars = uppercase + lowercase + digits + specialChars;
  const additionalChars = [];
  
  for (let i = 0; i < length - requiredChars.length; i++) {
    additionalChars.push(allChars[getSecureRandomInt(allChars.length)]);
  }
  
  // Combine required and additional characters, then shuffle securely
  const allPasswordChars = [...requiredChars, ...additionalChars];
  return secureArrayShuffle(allPasswordChars).join('');
}

/**
 * Validates a password against all complexity requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  requirements: Record<string, boolean>;
} {
  const requirements: Record<string, boolean> = {};
  
  passwordRequirements.forEach((req) => {
    requirements[req.id] = req.test(password);
  });
  
  const isValid = Object.values(requirements).every(Boolean);
  console.log(isValid);
  return { isValid, requirements };
}
