import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { PostgresDatabaseConnectionFactory } from "@aquapulse/database";
import { readApiDatabaseRuntimeConfig } from "./common/config/database-runtime.config";
import { setCachedDatabaseConnectionStatus } from "./common/config/database-connectivity-cache";
import { AppModule } from "./app.module";

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
  await app.listen(4000);
}

void bootstrap();
