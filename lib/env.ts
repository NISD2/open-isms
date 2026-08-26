import { z } from "zod";

const envSchema = z.object({
  // Required always
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  // Required in production (Google OAuth)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AWS S3 — optional with defaults
  AWS_S3_REGION: z.string().default("eu-north-1"),
  AWS_S3_BUCKET: z.string().default("nisd2-dev-evidence"),
  AWS_ACCESS_KEY_ID: z.string().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().default(""),
  // S3-compatible endpoint override (MinIO in the e2e and self-host stacks).
  // Unset on AWS, so AWS behavior is untouched. This is the PUBLIC address:
  // presigned URLs are signed for its host and the browser must reach it.
  AWS_S3_ENDPOINT: z.string().optional(),
  // Address the server itself uses to reach the object store, when that
  // differs from the public one (object store on the app's container
  // network). Falls back to AWS_S3_ENDPOINT; unset in every AWS deployment.
  AWS_S3_INTERNAL_ENDPOINT: z.string().optional(),

  // Email — optional (features degrade gracefully)
  // Local-dev hard-blocks email by default in send.ts + resend.ts; set
  // ENABLE_EMAIL_IN_DEV=true to exercise the real path in dev.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("noreply@nisd2.eu"),
  // Separate From for the newsletter so lifecycle email can send from a
  // distinct mailbox (e.g. newsletter@nisd2.eu) while auth/transactional
  // email stays on RESEND_FROM_EMAIL. Falls back to RESEND_FROM_EMAIL.
  RESEND_FROM_EMAIL_NEWS: z.string().optional(),
  DISABLE_EMAIL: z.string().optional(),
  ENABLE_EMAIL_IN_DEV: z.string().optional(),


  // AI — optional (LLM features degrade)
  XAI_API_KEY: z.string().optional(),

  // Implisense (German company data via RapidAPI). Company lookup in the
  // applicability wizard degrades to manual entry without it.
  RAPIDAPI_KEY: z.string().optional(),

  // Cron — optional
  CRON_SECRET: z.string().optional(),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().default("https://www.nisd2.eu"),

  // Cal.com booking handle behind the "book a call" surfaces. Either a bare
  // handle ("nisd2") or handle/event-type ("acme/intro").
  // Empty by default on purpose: a self-hosted instance must not embed someone
  // else's calendar. Where it is unset, the booking UI is not rendered at all.
  // Read server-side and passed down as a prop, not NEXT_PUBLIC_: the Dockerfile
  // declares no build args, so a NEXT_PUBLIC_ value set in the deploy platform
  // would never reach the client bundle.
  CAL_LINK: z.string().default(""),

  // Standard
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  // Warn about missing Google OAuth in production
  if (
    result.data.NODE_ENV === "production" &&
    (!result.data.GOOGLE_CLIENT_ID || !result.data.GOOGLE_CLIENT_SECRET)
  ) {
    console.warn(
      "[env] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production for OAuth",
    );
  }

  return result.data;
}

export const env = validateEnv();
