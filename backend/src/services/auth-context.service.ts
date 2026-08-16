import { Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { UsersRepository } from '../repositories/users.repository';

const AUTH_CACHE_MS = 30_000;

type CachedAuthUser = {
  user: AuthUser;
  expiresAt: number;
};

@Injectable()
export class AuthContextService {
  private readonly cache = new Map<string, CachedAuthUser>();

  constructor(private readonly users: UsersRepository) {}

  async loadById(id: string): Promise<AuthUser | undefined> {
    const cached = this.cache.get(id);
    if (cached !== undefined && Date.now() < cached.expiresAt) {
      return cached.user;
    }

    const user = await this.users.loadAuthById(id);
    if (user === undefined) {
      this.cache.delete(id);
      return undefined;
    }

    this.cache.set(id, {
      user,
      expiresAt: Date.now() + AUTH_CACHE_MS,
    });
    return user;
  }
}
