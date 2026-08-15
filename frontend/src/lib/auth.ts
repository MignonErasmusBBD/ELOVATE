import { betterAuth } from "better-auth";
import { admin, jwt } from "better-auth/plugins";
import { Pool } from "pg";

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

export const auth = betterAuth({
  database: pool,

  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

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

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

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
          const emailLocal = user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          const slug = `${emailLocal}-${user.id.slice(0, 8)}`;

          try {
            // 1. Create a personal workspace org
            const orgInsert = await pool.query<{ id: string }>(
              `INSERT INTO public.organizations (name, slug)
               VALUES ($1, $2)
               ON CONFLICT (slug) DO NOTHING
               RETURNING id`,
              [`${user.name ?? user.email}'s Workspace`, slug],
            );

            let orgId = orgInsert.rows[0]?.id;
            if (orgId === undefined) {
              const existing = await pool.query<{ id: string }>(
                `SELECT id FROM public.organizations WHERE slug = $1`,
                [slug],
              );
              orgId = existing.rows[0]?.id;
            }

            if (orgId === undefined) return;

            // 2. Link the user to their new org
            await pool.query(
              `UPDATE public.users SET organization_id = $1 WHERE id = $2`,
              [orgId, user.id],
            );

            // 3. Grant the base learner role
            await pool.query(
              `INSERT INTO public.user_roles (user_id, role_id)
               SELECT $1, r.role_id FROM public.roles r
               WHERE r.role_name = 'learner'
               ON CONFLICT DO NOTHING`,
              [user.id],
            );
          } catch (err) {
            console.error("[auth] Failed to provision user workspace:", err);
          }
        },
      },
    },
  },
});
