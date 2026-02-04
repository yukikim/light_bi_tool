import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  CORS_ORIGIN: z.string().optional(),
  EXECUTE_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  MAX_RESULT_ROWS: z.coerce.number().int().positive().default(1000),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
