# Database Migrations

Migrations are managed with [Flyway](https://flywaydb.org/) and target a PostgreSQL database. Files follow the `V{n}__{description}.sql` naming convention and are applied in version order.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (local testing)
- Flyway CLI or Docker image `flyway/flyway:10-alpine` (NeonDB deployment)

---

## Environment setup (one-time)

All configuration lives in a single `.env` file. Copy the example and leave the defaults for local testing:

```bash
cp .env.example .env
```

`.env` is gitignored — never commit it. `.env.example` is committed and shows every required variable.

---

## Local testing

Spins up a local Postgres 16 container and runs all migrations against it.

```bash
docker compose up --abort-on-container-exit
```

Flyway exits once all migrations are applied; the Postgres container stays running so you can connect to it on `localhost:5432` with the values from your `.env` (defaults below):

| Field    | Value      |
|----------|------------|
| Host     | localhost  |
| Port     | 5432       |
| Database | `$POSTGRES_DB` (default: `elovate`) |
| User     | `$POSTGRES_USER` (default: `elovate`) |
| Password | `$POSTGRES_PASSWORD` (default: `elovate`) |

**Reset and re-run from scratch** (drops all data):

```bash
docker compose down -v && docker compose up --abort-on-container-exit
```

**Run migrations only** (Postgres already running):

```bash
docker compose run --rm flyway
```

---

## Adding a new migration

1. Create a new file in `migrations/` following the naming pattern: `V{next}__{short_description}.sql`
   - Example: `V8__add_notifications.sql`
2. Write idempotent SQL — Flyway checksums every file, so never edit an already-applied migration.
3. Test locally with `docker compose up --abort-on-container-exit` before pushing.

---

## Deploying to NeonDB

### Get your connection string

From the NeonDB project dashboard, copy the connection string:

```
postgres://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
```

Convert it to a JDBC URL for Flyway (move credentials out, keep `sslmode=require`):

```
jdbc:postgresql://<host>.neon.tech/<dbname>?sslmode=require
```

> `sslmode=require` is mandatory — NeonDB enforces TLS on all connections.

### Local deploy (via .env)

Update the three Flyway variables in your `.env`:

```env
FLYWAY_URL=jdbc:postgresql://<host>.neon.tech/<dbname>?sslmode=require
FLYWAY_USER=<neon-user>
FLYWAY_PASSWORD=<neon-password>
```

Then run (no Postgres container needed):

```bash
docker run --rm \
  --env-file .env \
  -v "$(pwd)/migrations:/flyway/sql" \
  flyway/flyway:10-alpine migrate
```

Or with the Flyway CLI (reads `flyway.conf` which picks up env vars automatically):

```bash
flyway migrate
```

### Via CI/CD (GitHub Actions)

Set the following as repository secrets (`Settings → Secrets and variables → Actions`):

| Secret           | Value |
|------------------|-------|
| `FLYWAY_URL`     | `jdbc:postgresql://<host>.neon.tech/<dbname>?sslmode=require` |
| `FLYWAY_USER`    | Your NeonDB role |
| `FLYWAY_PASSWORD`| Your NeonDB password |

The workflow at `.github/workflows/flyway-migrate.yml` runs automatically on any push to `main` that changes a migration file.

---

## Useful Flyway commands

Replace `migrate` with any of the following:

| Command    | What it does                                              |
|------------|-----------------------------------------------------------|
| `migrate`  | Apply all pending migrations                              |
| `info`     | Show migration status (applied, pending, failed)          |
| `validate` | Verify applied migrations match local SQL checksums       |
| `repair`   | Fix a failed migration entry in the schema history table  |
| `clean`    | **Drop all objects** in the schema — never use on NeonDB  |
