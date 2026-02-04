import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { DbModule } from "./db/db.module";
import { ExecuteModule } from "./execute/execute.module";
import { QueriesModule } from "./queries/queries.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [DbModule, AuthModule, QueriesModule, ExecuteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
