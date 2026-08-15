import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthedRequest } from '../helpers/auth-user';
import { isUuid } from '../helpers/values';
import { AuthContextService } from '../services/auth-context.service';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (jwks === undefined) {
    const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
    jwks = createRemoteJWKSet(new URL(`${baseUrl}/api/auth/jwks`));
  }
  return jwks;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authContext: AuthContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const authorizationHeader = request.headers.authorization;
    if (
      authorizationHeader === undefined ||
      authorizationHeader.startsWith('Bearer ') === false
    ) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    if (token === '') {
      throw new UnauthorizedException('Missing Bearer token');
    }

    let userId: string | undefined;
    try {
      const verified = await jwtVerify(token, getJwks());
      const subject = verified.payload.sub;
      if (subject !== undefined && isUuid(subject)) {
        userId = subject;
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }

    if (userId === undefined) {
      throw new UnauthorizedException('JWT is missing a user subject');
    }

    const user = await this.authContext.loadById(userId);
    if (user === undefined) {
      throw new UnauthorizedException('User not found or inactive');
    }

    request.user = user;
    return true;
  }
}
