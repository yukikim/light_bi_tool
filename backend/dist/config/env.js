"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_EXPIRES_IN: zod_1.z.string().min(1).default("7d"),
    CORS_ORIGIN: zod_1.z.string().optional(),
    EXECUTE_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(5000),
    MAX_RESULT_ROWS: zod_1.z.coerce.number().int().positive().default(1000),
});
let cachedEnv = null;
function getEnv() {
    if (cachedEnv)
        return cachedEnv;
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
}
//# sourceMappingURL=env.js.map