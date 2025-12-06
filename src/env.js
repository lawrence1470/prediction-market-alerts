import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    EMAIL_FROM: z.string().email().default("alerts@kalshitracker.com"),
    SUPERFEEDR_LOGIN:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    SUPERFEEDR_TOKEN:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    SUPERFEEDR_TIMEOUT_MS: z.coerce.number().default(10000),
    RESEND_TIMEOUT_MS: z.coerce.number().default(5000),
    OPENAI_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    // Twilio SMS
    TWILIO_ACCOUNT_SID:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    TWILIO_AUTH_TOKEN:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    TWILIO_PHONE_NUMBER:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    TWILIO_TIMEOUT_MS: z.coerce.number().default(5000),
    // Stripe
    STRIPE_SECRET_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_WEBHOOK_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
    STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SUPERFEEDR_LOGIN: process.env.SUPERFEEDR_LOGIN,
    SUPERFEEDR_TOKEN: process.env.SUPERFEEDR_TOKEN,
    SUPERFEEDR_TIMEOUT_MS: process.env.SUPERFEEDR_TIMEOUT_MS,
    RESEND_TIMEOUT_MS: process.env.RESEND_TIMEOUT_MS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    TWILIO_TIMEOUT_MS: process.env.TWILIO_TIMEOUT_MS,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
