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
    if (path.startsWith('/resource_owner') && userRole == USER_ROLE.RESOURCE_OWNER) {
      hasRole = true;
    }
    if (path.startsWith('/approver') && userRole == USER_ROLE.APPROVER) {
      hasRole = true;
    }
    if (path.startsWith('/auditor') && userRole == USER_ROLE.AUDITOR) {
      hasRole = true;
    }
  })


  return hasRole;

}