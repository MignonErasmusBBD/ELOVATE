import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { postgresUrlFromEnv } from './helpers/env';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private pool: Pool | undefined;

  async onModuleInit() {
    const connectionString = postgresUrlFromEnv();
    if (connectionString === undefined) {
      throw new Error(
        'Postgres is not configured. Set FLYWAY_URL, FLYWAY_USER, and FLYWAY_PASSWORD (or DATABASE_URL) in the repo-root .env',
      );
    }

    this.pool = new Pool({ connectionString });
    await this.pool.query('SELECT 1');
    this.logger.log('Connected to Postgres');
  }

  async onModuleDestroy() {
    if (this.pool !== undefined) {
      await this.pool.end();
    }
  }

  query<T extends Record<string, unknown>>(
    text: string,
  ): Promise<{ rows: T[] }> {
    if (this.pool === undefined) {
      throw new Error('Postgres pool is not ready');
    }
    return this.pool.query<T>(text);
  }
}
