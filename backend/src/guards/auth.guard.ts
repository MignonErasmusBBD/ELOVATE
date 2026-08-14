import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException('JWT not wired yet');
  }
}
