"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const env_1 = require("./config/env");
const app_exception_filter_1 = require("./common/app-exception.filter");
const request_logger_1 = require("./common/request-logger");
async function bootstrap() {
    const { AppModule } = await import("./app.module.js");
    const env = (0, env_1.getEnv)();
    const app = await core_1.NestFactory.create(AppModule);
    app.use(request_logger_1.requestLogger);
    app.useGlobalFilters(new app_exception_filter_1.AppExceptionFilter());
    const origin = env.CORS_ORIGIN;
    app.enableCors({
        origin: origin ? origin.split(",").map((s) => s.trim()).filter(Boolean) : true,
        credentials: true,
    });
    await app.listen(env.PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map