import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { getEnv } from "./config/env";

async function bootstrap() {
  const { AppModule } = await import("./app.module.js");
  const env = getEnv();
  const app = await NestFactory.create(AppModule);

  const origin = env.CORS_ORIGIN;
  app.enableCors({
    origin: origin ? origin.split(",").map((s) => s.trim()).filter(Boolean) : true,
    credentials: true,
  });

  await app.listen(env.PORT);
}
bootstrap();
