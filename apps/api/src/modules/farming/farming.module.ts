import { Module } from "@nestjs/common";
import { createFarmWorkspaceStore } from "@aquapulse/database";
import { ApiAuthService } from "../../common/auth/api-auth.service";
import { FarmingController } from "./farming.controller";
import { FARMING_ENV, FarmingGuard } from "./farming.guard";
import { FarmingService, initialFarmWorkspace } from "./farming.service";
import { createFarmErpGateway } from "./erp-gateway";

@Module({
  controllers: [FarmingController],
  providers: [
    {
      provide: FarmingService,
      inject: [ApiAuthService],
      useFactory: (auth: ApiAuthService) => {
        const env = process.env;
        if (
          env.NODE_ENV === "production" &&
          (env.AQUAPULSE_FARM_DEMO === "true" ||
            env.AQUAPULSE_FARM_STORAGE !== "postgres")
        ) {
          // Keep legacy routes available; FarmingGuard denies every farming request.
          return new FarmingService(
            createFarmWorkspaceStore({}, initialFarmWorkspace({})),
            false,
          );
        }
        const service = new FarmingService(
          createFarmWorkspaceStore(env, initialFarmWorkspace(env)),
          env.AQUAPULSE_FARM_DEMO === "true" && env.NODE_ENV !== "production",
          createFarmErpGateway(env),
        );
        const authConfig = auth.getRuntimeConfig();
        if (
          env.AQUAPULSE_ERP_WORKER_ENABLED === "true" &&
          authConfig.effectiveMode === "keycloak" &&
          authConfig.keycloak.verificationAvailable &&
          (env.NODE_ENV !== "production" ||
            (authConfig.keycloak.issuerUrl?.startsWith("https://") &&
              authConfig.keycloak.jwksUrl?.startsWith("https://"))) &&
          service.store.mode === "postgres"
        )
          service.startWorker();
        return service;
      },
    },
    { provide: FARMING_ENV, useValue: process.env },
    FarmingGuard,
  ],
})
export class FarmingModule {}
