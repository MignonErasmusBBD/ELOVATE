import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export type AuthUser = {
  id: string;
  organizationId: string | undefined;
  organizationName: string | undefined;
  email: string;
  fullName: string | undefined;
  status: string;
  roleNames: string[];
  permissionCodes: string[];
};

export type AuthedRequest = Request & { user?: AuthUser };

export const CurrentUser = createParamDecorator(
  (_data: undefined, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const user = request.user;
    if (user === undefined) {
      throw new UnauthorizedException('Not authenticated');
    }
    return user;
  },
);
