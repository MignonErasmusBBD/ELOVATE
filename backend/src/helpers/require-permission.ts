import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from './auth-user';

export function hasPermission(
  user: AuthUser,
  permissionCodes: string[],
): boolean {
  for (const permissionCode of permissionCodes) {
    if (user.permissionCodes.includes(permissionCode)) {
      return true;
    }
  }
  return false;
}

export function requirePermission(
  user: AuthUser,
  permissionCodes: string[],
): void {
  if (hasPermission(user, permissionCodes) === false) {
    throw new ForbiddenException(
      `Missing permission: ${permissionCodes.join(' or ')}`,
    );
  }
}
