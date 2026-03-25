import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),

  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default("in_the_arsenal"),
  DB_USER: z.string().default("arsenal"),
  DB_PASSWORD: z.string().default("arsenal_secret"),

  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("48h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  OPENROUTER_API_KEY: z.string().default(""),

  GOOGLE_CLIENT_ID: z.string().default(""),

  /** Full URL to FabCube `card-flattened.json` (e.g. develop, PEN, or Omens branch raw GitHub). */
  FABCUBE_CARD_FLATTENED_URL: z.url().optional(),

  /** `cache` = DB only; `goagain` = API only; `hybrid` = DB first, then goagain if empty. */
  CARD_SEARCH_SOURCE: z.enum(["cache", "goagain", "hybrid"]).default("hybrid"),

  EMAIL_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Bootstrap: avoid importing the app logger here (depends on valid env for some paths).
  process.stderr.write(
    "Invalid environment variables:\n" + z.prettifyError(parsed.error) + "\n",
  );
  process.exit(1);
}

export const env = parsed.data;
