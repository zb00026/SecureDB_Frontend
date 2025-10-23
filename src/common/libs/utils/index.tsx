import { AUTH_PROVIDER, USER_ROLE } from "@/constants/enums";
import { passwordRequirements } from "@common/components/DamPasswordInput";
import { getGoogleToken, state } from "@common/index";
import keycloak from "@common/keycloak/keycloak";
import { Role } from "@models/Role";
import { User } from "@models/User";

/**
 * Maps character codes to DOM key codes for terminal input
 * @param char - The character to map
 * @returns The corresponding DOM key code as a string
 */
// Helper function to get special key codes
function getSpecialKeyCode(char: string): string | null {
  const specialKeys: Record<string, string> = {
    '\r': '13',    // Enter
    '\n': '13',    // Enter
    '\u007f': '8', // Backspace
    '\b': '8',     // Backspace
    '\t': '9',     // Tab
    '\u0003': '3'  // Ctrl+C
  };

  return specialKeys[char] || null;
}

// Helper function to get printable character key codes
function getPrintableCharKeyCode(charCode: number): string {
  // Special character mappings (non-pattern based)
  const specialMappings: Record<number, string> = {
    32: '32',   // Space
    33: '49',   // !
    34: '222',  // "
    35: '51',   // #
    36: '52',   // $
    37: '53',   // %
    38: '55',   // &
    39: '222',  // '
    40: '57',   // (
    41: '48',   // )
    42: '56',   // *
    43: '187',  // +
    44: '188',  // ,
    45: '189',  // -
    46: '190',  // .
    47: '191',  // /
    58: '186',  // :
    59: '186',  // ';'
    60: '188',  // <
    61: '187',  // =
    62: '190',  // >
    63: '191',  // '?'
    64: '50',   // @
    91: '219',  // [
    92: '220',  // \
    93: '221',  // ]
    94: '54',   // ^
    95: '189',  // _
    96: '192',  // `
    123: '219', // '{'
    124: '220', // |
    125: '221', // }
    126: '192'  // ~
  };

  // Check special mappings first
  if (specialMappings[charCode]) {
    return specialMappings[charCode];
  }

  // Numbers (48-57): same as charCode
  if (charCode >= 48 && charCode <= 57) {
    return charCode.toString();
  }

  // Uppercase letters (65-90): same as charCode
  if (charCode >= 65 && charCode <= 90) {
    return charCode.toString();
  }

  // Lowercase letters (97-122): same as uppercase
  if (charCode >= 97 && charCode <= 122) {
    return (charCode - 32).toString();
  }

  // Fallback
  return charCode.toString();
}

export function getKeyCode(char: string): string {
  // Handle special keys first
  const specialKeyCode = getSpecialKeyCode(char);
  if (specialKeyCode) {
    return specialKeyCode;
  }

  // Handle printable characters
  if (char >= ' ' && char <= '~') {
    return getPrintableCharKeyCode(char.charCodeAt(0));
  }

  // Other special characters
  return char.charCodeAt(0).toString();
}

export function isAuthorizedPath(path: string, user?: User): boolean {
  if (!user?.roles.length && path !== '/') return false;
  if (path === '/') return true;

  // Define path-role mappings to reduce cognitive complexity
  const pathRoleMappings: Array<{
    pathPrefix: string;
    allowedRoles: string[];
  }> = [
      { pathPrefix: '/admin', allowedRoles: [USER_ROLE.ADMIN] },
      { pathPrefix: '/developer', allowedRoles: [USER_ROLE.DEVELOPER] },
      { pathPrefix: '/approver', allowedRoles: [USER_ROLE.APPROVER] },
      { pathPrefix: '/auditor', allowedRoles: [USER_ROLE.AUDITOR] },
      {
        pathPrefix: '/auditor/audit-trail',
        allowedRoles: [USER_ROLE.ADMIN, USER_ROLE.AUDITOR, USER_ROLE.ASSET_OWNER, USER_ROLE.APPROVER]
      },
      {
        pathPrefix: '/auditor/terminal-audit',
        allowedRoles: [USER_ROLE.ADMIN, USER_ROLE.AUDITOR]
      },
      {
        pathPrefix: '/asset_owner',
        allowedRoles: [USER_ROLE.ADMIN, USER_ROLE.ASSET_OWNER]
      }
    ];

  // Check if user has any role that matches the path requirements
  return user?.roles.some((role: Role) => {
    const userRole = role.name;
    if (!userRole) return false;

    return pathRoleMappings.some(mapping =>
      path.startsWith(mapping.pathPrefix) &&
      mapping.allowedRoles.includes(userRole)
    );
  }) || false;
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
      return nav.userAgentData.platform.toLowerCase().includes('mac') ? "⌘" : "⊞";
    }
    // Fallback for older browsers
    return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "⊞";
  }
  return "⊞";
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
  return { isValid, requirements };
}


export function getAuthToken() {// Get current authentication token and provider
  // Check for Google token first
  const googleToken = getGoogleToken();
  if (googleToken) {
    return { token: googleToken, provider: AUTH_PROVIDER.GOOGLE };
  }

  // Check for Keycloak token
  if (keycloak.token) {
    return { token: keycloak.token, provider: AUTH_PROVIDER.KEYCLOAK };
  }

  // Check for stored token in state
  if (state.storage.token) {
    return { token: state.storage.token, provider: AUTH_PROVIDER.KEYCLOAK }; // Default to Keycloak for stored tokens
  }

  return null;
};

/**
 * Safe string conversion function that handles all value types properly
 * Prevents SonarQube warnings about object stringification
 */
export function convertToString(value: unknown): string {
  // Handle nullish values
  if (value == null) return '';

  // Handle primitive types
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Handle Dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle Maps and Sets
  if (value instanceof Map) {
    return JSON.stringify(Object.fromEntries(value), null, 2);
  }

  if (value instanceof Set) {
    return JSON.stringify(Array.from(value), null, 2);
  }

  // Handle objects safely (including circular references)
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, getCircularReplacer(), 2);
    } catch {
      return '[Unserializable Object]';
    }
  }

  // Handle functions
  if (typeof value === 'function') {
    return `[Function: ${(value as Function).name || 'anonymous'}]`;
  }

  // Fallback for other types (e.g., symbols, bigints)
  try {
    return String(value);
  } catch {
    return '[Unknown Type]';
  }
}

// 🔄 Helper to avoid JSON.stringify circular reference errors
function getCircularReplacer() {
  const seen = new WeakSet();
  return function (_key: string, val: any) {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  };
}