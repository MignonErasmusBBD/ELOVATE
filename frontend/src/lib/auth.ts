import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { betterAuth } from "better-auth";
import { admin, jwt } from "better-auth/plugins";
import { Pool } from "pg";

const repoRootEnvPath = resolve(process.cwd(), "..", ".env");
if (existsSync(repoRootEnvPath)) {
  for (const rawLine of readFileSync(repoRootEnvPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex);
    let value = line.slice(separatorIndex + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function buildDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl !== undefined && databaseUrl !== "") return databaseUrl;

  const jdbcUrl = process.env.FLYWAY_URL;
  const user = process.env.FLYWAY_USER;
  const password = process.env.FLYWAY_PASSWORD;

  if (!jdbcUrl || !user || !password) {
    throw new Error(
      "Database not configured. Set DATABASE_URL or FLYWAY_URL/FLYWAY_USER/FLYWAY_PASSWORD in .env",
    );
  }

  const withoutJdbc = jdbcUrl.startsWith("jdbc:") ? jdbcUrl.slice(5) : jdbcUrl;
  const withoutScheme = withoutJdbc.replace(/^postgresql:\/\//, "");
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${withoutScheme}`;
}

const pool = new Pool({ connectionString: buildDatabaseUrl() });

pool.on("connect", (client) => {
  client.query("SET search_path TO public").catch(console.error);
});

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleSocialProvider =
  googleClientId !== undefined &&
  googleClientId !== "" &&
  googleClientSecret !== undefined &&
  googleClientSecret !== ""
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined;

export const auth = betterAuth({
  database: pool,

  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["http://localhost:3000"],

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  // Map better-auth's camelCase model fields to our snake_case DB columns.
  // user.modelName points better-auth at public.users instead of public.user.
  user: {
    modelName: "users",
    fields: {
      name: "full_name",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  socialProviders:
    googleSocialProvider === undefined ? {} : googleSocialProvider,

  plugins: [
    jwt({
      schema: {
        jwks: {
          fields: {
            publicKey: "public_key",
            privateKey: "private_key",
            createdAt: "created_at",
            expiresAt: "expires_at",
          },
        },
      },
    }),
    admin({
      schema: {
        user: {
          fields: {
            banReason: "ban_reason",
            banExpires: "ban_expires",
          },
        },
        session: {
          fields: {
            impersonatedBy: "impersonated_by",
          },
        },
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await pool.query(
              `INSERT INTO public.user_roles (user_id, role_id)
               SELECT $1, r.role_id FROM public.roles r
               WHERE r.role_name = 'learner'
               ON CONFLICT DO NOTHING`,
              [user.id],
            );
          } catch (err) {
            console.error("[auth] Failed to grant learner role:", err);
          }
        },
      },
    },
  },
});
