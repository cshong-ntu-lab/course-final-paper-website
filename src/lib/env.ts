import { z } from "zod";

// Server-only env vars (must not be read from client bundles).
const serverSchema = z.object({
  APP_MODE: z.enum(["production", "staging"]).default("production"),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((s) =>
      s
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  FIREBASE_ADMIN_PRIVATE_KEY_JSON: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  BACKUP_BUCKET: z.string().optional(),
  GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().optional(),
  // OAuth2 user credentials — preferred over SA for personal My Drive access
  GOOGLE_DRIVE_CLIENT_ID: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_DRIVE_REFRESH_TOKEN: z.string().optional(),
});

// Client-safe env vars (NEXT_PUBLIC_*). Inlined at build time.
const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

const isServer = typeof window === "undefined";

// During Phase 0 some .env values may be missing; we use safeParse and surface
// a clear runtime error only when an env-dependent code path actually runs.
function parseOrFallback<S extends z.ZodTypeAny>(schema: S, source: Record<string, unknown>) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error,
      get data(): z.infer<S> {
        throw new Error(
          `Environment validation failed:\n${parsed.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n")}`,
        );
      },
    };
  }
  return { ok: true as const, data: parsed.data as z.infer<S> };
}

const serverEnv = isServer
  ? parseOrFallback(serverSchema, process.env)
  : {
      ok: false as const,
      error: null,
      get data(): z.infer<typeof serverSchema> {
        throw new Error("Server env accessed from client bundle.");
      },
    };

// Client env values are inlined at build time via process.env.NEXT_PUBLIC_*.
const clientEnv = parseOrFallback(clientSchema, {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

export const env = {
  get server() {
    return serverEnv.data;
  },
  get client() {
    return clientEnv.data;
  },
  /** Cheap accessor for code that runs in both environments. */
  APP_MODE: (process.env.APP_MODE === "staging" ? "staging" : "production") as
    | "production"
    | "staging",
  get isStaging() {
    return this.APP_MODE === "staging";
  },
  get isProduction() {
    return this.APP_MODE === "production";
  },
};
