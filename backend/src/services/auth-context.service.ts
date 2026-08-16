import { Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class AuthContextService {
  constructor(private readonly users: UsersRepository) {}

  loadById(id: string): Promise<AuthUser | undefined> {
    return this.users.loadAuthById(id);
  }
}
