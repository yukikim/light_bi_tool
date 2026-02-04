import { z } from "zod";
declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    CORS_ORIGIN: z.ZodOptional<z.ZodString>;
    EXECUTE_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    MAX_RESULT_ROWS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare function getEnv(): Env;
export {};
