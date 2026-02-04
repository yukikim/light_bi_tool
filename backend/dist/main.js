"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const env_1 = require("./config/env");
async function bootstrap() {
    const { AppModule } = await import("./app.module.js");
    const env = (0, env_1.getEnv)();
    const app = await core_1.NestFactory.create(AppModule);
    const origin = env.CORS_ORIGIN;
    app.enableCors({
        origin: origin ? origin.split(",").map((s) => s.trim()).filter(Boolean) : true,
        credentials: true,
    });
    await app.listen(env.PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map