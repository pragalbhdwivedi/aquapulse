import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { readApiDatabaseRuntimeConfig } from "./common/config/database-runtime.config";
import { AppModule } from "./app.module";

async function bootstrap() {
  // TODO: Use the parsed DB runtime config once adapter activation and health checks are enabled at boot.
  void readApiDatabaseRuntimeConfig();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(4000);
}

void bootstrap();
