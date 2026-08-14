# Elovate API

NestJS API on port **3001**. It **connects to Postgres** from the repo-root `.env`. **Health, users, and RBAC** are implemented. Other routes still return `{ message: "TODO" }`.

This does **not** replace or change the Next.js app in `frontend/`. That still runs on port **3000**.

## Run locally

```powershell
cd backend
npm install
npm run start:dev
```

Copy repo-root `.env.example` to `.env` once. Nest loads that file (no `backend/.env` needed). Startup fails if Postgres is not configured.

- Health: http://localhost:3001/api/health
- Swagger: http://localhost:3001/docs

Guarded routes return 401 until JWT is wired. `GET /api/health` stays public.

## Layout

```
src/
  main.ts
  app.module.ts
  controllers/
  services/
  guards/
  helpers/
```

## Env (repo root `.env` only)

Nest and Flyway share the same file. Nest turns `FLYWAY_URL` + `FLYWAY_USER` + `FLYWAY_PASSWORD` into a Postgres URL (or uses `DATABASE_URL` if you set it).

```
PORT=3001
FLYWAY_URL=jdbc:postgresql://HOST/DB?sslmode=require
FLYWAY_USER=...
FLYWAY_PASSWORD=...
```

## What you still have to implement

Courses, questions, enrollments, quizzes, analytics, lookups, interventions, and auth sync are still `{ message: "TODO" }`.

1. Wire OAuth/Neon JWT in `AuthGuard` and load `user_roles` → `role_permissions` via `AuthContextService`.
2. Check **permission codes from the DB**, never role names.
3. Signup always grants **learner**. Extra roles are additive (union of codes).
4. Persist activate/deactivate for organisations, courses, and questions (users already have `user_statuses` in V8).
5. `course.lesson.write` is seeded but there is **no `lessons` table** yet.

`course.*.delete` and `question.delete` permission codes mean **deactivate**, not HTTP DELETE.

## Permissions (from `migrations/V2`)

Effective access = union of all roles on the user.

| Permission | platform_admin | community_admin | org_admin | educator | learner |
|---|---|---|---|---|---|
| user.create.self | ✓ | ✓ | ✓ | ✓ | ✓ |
| user.read.self | ✓ | ✓ | ✓ | ✓ | ✓ |
| user.update.self | ✓ | ✓ | ✓ | ✓ | ✓ |
| user.read.org | ✓ | | ✓ | ✓ | |
| user.update.org | | | ✓ | | |
| user.deactivate | | | ✓ | | |
| user.read.all | ✓ | | | | |
| role.read | ✓ | | ✓ | | |
| role.assign | ✓ | | ✓ | | |
| role.remove | ✓ | | ✓ | | |
| role.catalogue.write | ✓ | | | | |
| org.create | ✓ | | | | |
| org.read.all | ✓ | | | | |
| org.suspend | ✓ | | | | |
| org.read.self | ✓ | | ✓ | ✓ | ✓ |
| org.update.self | | | ✓ | | |
| course.community.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| course.community.create | | ✓ | ✓ | ✓ | |
| course.community.update | | ✓ | ✓ | ✓ | |
| course.community.publish | | ✓ | ✓ | ✓ | |
| course.community.delete | | ✓ | | | |
| course.private.create | | | ✓ | ✓ | |
| course.private.read | | | ✓ | ✓ | |
| course.private.update | | | ✓ | ✓ | |
| course.private.delete | | | ✓ | ✓ | |
| course.section.write | | ✓ | ✓ | ✓ | |
| course.lesson.write | | ✓ | ✓ | ✓ | |
| enrollment.assign | | | ✓ | | |
| enrollment.read.self | | | | ✓ | ✓ |
| enrollment.withdraw.self | | | | | ✓ |
| question.create / update / delete / metadata.tag | | ✓ | ✓ | ✓ | |
| quiz.attempt | | | | ✓ | ✓ |
| quiz.read.self | | | | ✓ | ✓ |
| quiz.read.org | | | ✓ | ✓ | |
| analytics.read.self | | | ✓ | ✓ | ✓ |
| analytics.read.org / attempts / mastery | | | ✓ | ✓ | |
| intervention.flag.read | | | ✓ | ✓ | |
| intervention.flag.resolve | | | ✓ | | |

Each Swagger operation repeats the code and who grants it.

## Why the JSON files

These are the Nest/npm minimum. They are not app data.

| File | Why |
|---|---|
| `package.json` | Scripts and npm libraries so `npm run start:dev` works |
| `package-lock.json` | Locks exact versions so every machine installs the same tree |
| `nest-cli.json` | Tells the Nest CLI where `src/` is |
| `tsconfig.json` | TypeScript compile settings |
| `tsconfig.build.json` | Same, used by `nest start --watch` (Nest looks for this file by name) |

Do not add `node_modules/`, `dist/`, or `.env` — they are gitignored.

## Production

This folder is safe to merge: it does not touch `frontend/`. It **does** connect to Postgres using the root `.env`.

It is **not** a finished production API. Do not point real users at it until JWT is wired and feature routes are implemented.
