import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { PostgresDatabaseConnectionFactory } from "@aquapulse/database";
import { readApiDatabaseRuntimeConfig } from "./common/config/database-runtime.config";
import { setCachedDatabaseConnectionStatus } from "./common/config/database-connectivity-cache";
import { AppModule } from "./app.module";
import { AlertsLiveUpdatesService } from "./modules/alerts/live-updates/alerts-live-updates.service";

async function bootstrap() {
  const runtime = readApiDatabaseRuntimeConfig();

  if (
    runtime.healthcheckOnBoot &&
    runtime.persistence.requestedAdapter === "postgres" &&
    runtime.persistence.postgresEnabled
  ) {
    const connectionFactory = new PostgresDatabaseConnectionFactory();
    const status = await connectionFactory.checkReadiness(runtime.database);
    setCachedDatabaseConnectionStatus(status);
  } else {
    setCachedDatabaseConnectionStatus(undefined);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("json", { limit: "512kb" });
  app.setGlobalPrefix("api");
  app.get(AlertsLiveUpdatesService).attachGateway(app.getHttpServer());
  app.enableShutdownHooks();
  await app.listen(4000, process.env.AQUAPULSE_FARM_DEMO === "true" ? "127.0.0.1" : process.env.AQUAPULSE_API_HOST || "0.0.0.0");
}

void bootstrap();
