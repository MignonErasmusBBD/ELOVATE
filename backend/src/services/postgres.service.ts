import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { postgresUrlFromEnv } from '../helpers/env';
import { SqlParameter, SqlQuery } from '../helpers/values';

export type { SqlQuery };

function queryOn(runner: Pool | PoolClient): SqlQuery {
  return <T extends object>(text: string, values?: SqlParameter[]) => {
    if (values === undefined) {
      return runner.query<T>(text);
    }
    return runner.query<T>(text, values);
  };
}

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

  query<T extends object>(
    text: string,
    values?: SqlParameter[],
  ): Promise<{ rows: T[] }> {
    if (this.pool === undefined) {
      throw new Error('Postgres pool is not ready');
    }
    return queryOn(this.pool)<T>(text, values);
  }

  async withTransaction<T>(run: (query: SqlQuery) => Promise<T>): Promise<T> {
    if (this.pool === undefined) {
      throw new Error('Postgres pool is not ready');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await run(queryOn(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
