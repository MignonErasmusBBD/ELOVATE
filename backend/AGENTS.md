# Elovate backend conventions

Follow these when editing this API:

- The API **connects to Postgres** at startup (`PostgresService`) using the repo-root `.env`. Swagger (`/docs`) is still the contract for routes until services are written.
- Check **permission codes** from the DB (`permissions.permission_code` via `user_roles` → `role_permissions`), never role name strings. The seed lives in `migrations/V2__identity_and_access.sql` — do not duplicate it in TypeScript.
- Signup always grants **learner**. Extra roles are additive (union of permission codes). Unassign extras with `POST /rbac/assignments/remove`; never remove `learner` or delete seeded roles.
- Never hard-delete users, organisations, courses, or questions. Use activate/deactivate (orgs: suspend/activate) so history stays. `*.delete` permission codes mean deactivate, not HTTP DELETE.
- Use descriptive names (`organizationId`, `courseVisibilityId`, `oauthProviderId`). Match Flyway column names in comments and DTOs.
- Prefer `undefined` over `null` for absent DTO fields and optional query filters. Do not mix `null` and `undefined`.
- Do not coerce with casts (`as SomeType`, `Boolean(x)`, `!!value`, `Number(...)`, `String(...)`). Use explicit checks (`value !== undefined`).
- Group by type: `src/controllers/`, `src/services/`, `src/guards/`, `src/helpers/`. Keep one controller per area. Add services only when implementing a TODO.
- Every new/changed route needs `@ApiOperation` with: what table it uses, the permission code, and which roles grant it.
- Load env from the repo-root `.env`. Do not add a second secrets file under `backend/`.
- Connect with `DATABASE_URL`, or with `FLYWAY_URL` + `FLYWAY_USER` + `FLYWAY_PASSWORD` (`PostgresService`). Schema changes belong in `/migrations` (Flyway).
- `AUTH_DEV_BYPASS=true` is local scaffolding only. Never enable it in a real deploy.
