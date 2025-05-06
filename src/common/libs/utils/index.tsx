import { USER_ROLE } from "@/constants/enums";
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

  // First check if it's a special key
  let key = specialKeyMap[e.code];
  // If not a special key, handle regular keys
  if (!key) {
    key = e.code.startsWith("Key") ? e.code.replace("Key", "") : e.key;
  }
  return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
}