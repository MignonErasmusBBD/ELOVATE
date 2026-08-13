import {
  CanActivate,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/** AUTH_DEV_BYPASS=true skips JWT. TODO: verify token and load role_permissions. */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return true;
    }
    throw new UnauthorizedException(
      'JWT not wired yet. For local scaffolding set AUTH_DEV_BYPASS=true',
    );
  }
}
