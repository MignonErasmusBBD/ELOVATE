import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Lazily-initialised so the JWKS URL is read at runtime, not module load.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (jwks === undefined) {
    const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
    // better-auth's JWT plugin exposes public keys at /api/auth/jwks
    jwks = createRemoteJWKSet(new URL(`${baseUrl}/api/auth/jwks`));
  }
  return jwks;
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (authHeader === undefined || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);

    try {
      await jwtVerify(token, getJwks());
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }
}
