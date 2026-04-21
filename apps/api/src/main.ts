import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
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

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.get(AlertsLiveUpdatesService).attachGateway(app.getHttpServer());
  await app.listen(4000);
}

void bootstrap();
