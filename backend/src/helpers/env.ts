import { join } from 'path';

/** Repo-root `.env` first (required). `backend/.env` is only a leftover fallback. */
export const envFilePaths = [
  join(process.cwd(), '..', '.env'),
  join(process.cwd(), '.env'),
];

/**
 * Node Postgres URL from the root env.
 * Prefers DATABASE_URL; otherwise builds one from Flyway JDBC + user/password.
 */
export function postgresUrlFromEnv(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl !== undefined && databaseUrl !== '') {
    return databaseUrl;
  }

  const jdbcUrl = process.env.FLYWAY_URL;
  const flywayUser = process.env.FLYWAY_USER;
  const flywayPassword = process.env.FLYWAY_PASSWORD;
  if (
    jdbcUrl === undefined ||
    jdbcUrl === '' ||
    flywayUser === undefined ||
    flywayUser === '' ||
    flywayPassword === undefined ||
    flywayPassword === ''
  ) {
    return undefined;
  }

  const withoutJdbcPrefix = jdbcUrl.startsWith('jdbc:')
    ? jdbcUrl.slice('jdbc:'.length)
    : jdbcUrl;
  const withoutScheme = withoutJdbcPrefix.replace(/^postgresql:\/\//, '');
  const encodedUser = encodeURIComponent(flywayUser);
  const encodedPassword = encodeURIComponent(flywayPassword);
  return `postgresql://${encodedUser}:${encodedPassword}@${withoutScheme}`;
}
