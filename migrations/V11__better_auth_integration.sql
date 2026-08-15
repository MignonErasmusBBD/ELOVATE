-- V8__better_auth_integration.sql
-- Makes public.users the single source of truth for both auth and domain data.
-- Drops the separate public.user table created by @better-auth/cli, removes the
-- per-row OAuth coupling (provider + subject move to the account table, which
-- supports multiple providers per user cleanly), and recreates all better-auth
-- supporting tables with snake_case columns pointing at public.users.

-- ── 1. Drop CLI-generated better-auth tables ──────────────────────────────────
DROP TABLE IF EXISTS public.jwks        CASCADE;
DROP TABLE IF EXISTS public.verification CASCADE;
DROP TABLE IF EXISTS public.account     CASCADE;
DROP TABLE IF EXISTS public.session     CASCADE;
DROP TABLE IF EXISTS public."user"      CASCADE;

-- ── 2. Restructure public.users ───────────────────────────────────────────────

-- organization_id is nullable now: users are created without one, then the
-- post-create hook immediately provisions their personal workspace and links it.
ALTER TABLE public.users
    ALTER COLUMN organization_id DROP NOT NULL;

-- OAuth coupling moves to the account table (one row per provider per user).
ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_oauth_provider_id_oauth_id_key,
    DROP COLUMN IF EXISTS oauth_provider_id,
    DROP COLUMN IF EXISTS oauth_id;

-- Fields required by better-auth core and the admin plugin.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email_verified boolean     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS image          text,
    ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS role           varchar(100),
    ADD COLUMN IF NOT EXISTS banned         boolean,
    ADD COLUMN IF NOT EXISTS ban_reason     text,
    ADD COLUMN IF NOT EXISTS ban_expires    timestamptz;

-- ── 3. Recreate better-auth supporting tables (snake_case, FK → public.users) ─

CREATE TABLE public.session (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token           text        NOT NULL UNIQUE,
    expires_at      timestamptz NOT NULL,
    ip_address      text,
    user_agent      text,
    impersonated_by uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.session (user_id);
CREATE INDEX ON public.session (token);

CREATE TABLE public.account (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id               text        NOT NULL,
    provider_id              text        NOT NULL,
    access_token             text,
    refresh_token            text,
    id_token                 text,
    access_token_expires_at  timestamptz,
    refresh_token_expires_at timestamptz,
    scope                    text,
    password                 text,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider_id, account_id)
);
CREATE INDEX ON public.account (user_id);

CREATE TABLE public.verification (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier  text        NOT NULL,
    value       text        NOT NULL,
    expires_at  timestamptz NOT NULL,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

CREATE TABLE public.jwks (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    public_key  text        NOT NULL,
    private_key text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz
);
