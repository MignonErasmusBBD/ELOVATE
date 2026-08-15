import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { AuthedRequest } from '../helpers/auth-user';
import { isUuid } from '../helpers/values';
import { AuthContextService } from '../services/auth-context.service';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksSource: string | undefined;

const logger = new Logger('AuthGuard');

function stripTrailingSlash(url: string): string {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}

function betterAuthBaseUrl(): string {
  const configured = process.env.BETTER_AUTH_URL;
  if (
    configured !== undefined &&
    configured !== '' &&
    configured.includes('localhost') === false
  ) {
    return stripTrailingSlash(configured);
  }
  if (process.env.RAILWAY_ENVIRONMENT !== undefined) {
    return 'https://elovate-web-production.up.railway.app';
  }
  if (configured !== undefined && configured !== '') {
    return stripTrailingSlash(configured);
  }
  return 'http://localhost:3000';
}

function getJwks() {
  if (jwks === undefined) {
    const baseUrl = betterAuthBaseUrl();
    jwksSource = `${baseUrl}/api/auth/jwks`;
    logger.log(`Verifying JWTs with JWKS at ${jwksSource}`);
    jwks = createRemoteJWKSet(new URL(jwksSource));
  }
  return jwks;
}

function userIdFromPayload(payload: JWTPayload): string | undefined {
  const candidates = [payload.sub, payload.id];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isUuid(candidate)) {
      return candidate;
    }
  }
  return undefined;
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
      userId = userIdFromPayload(verified.payload);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      logger.warn(`JWT verify failed via ${jwksSource}: ${detail}`);
      throw new UnauthorizedException(
        `Invalid or expired JWT (${detail}). elovate-api BETTER_AUTH_URL must be https://elovate-web-production.up.railway.app`,
      );
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
