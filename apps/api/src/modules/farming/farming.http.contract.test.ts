import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { describe, expect, it } from "vitest";
import { ApiAuthService } from "../../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../../common/auth/auth-runtime.config";
import { MemoryFarmWorkspaceStore } from "@aquapulse/database";
import { FarmingService, initialFarmWorkspace } from "./farming.service";
import { FarmingController } from "./farming.controller";
import { FARMING_ENV, FarmingGuard } from "./farming.guard";

describe("real Nest HTTP farming routing and guard injection", () => {
  it("creates and reads farm resources through the registered guard", async () => {
    const farming = new FarmingService(
      new MemoryFarmWorkspaceStore(
        initialFarmWorkspace({ AQUAPULSE_FARM_DEMO: "true" }),
      ),
      true,
    );
    @Module({
      controllers: [FarmingController],
      providers: [
        { provide: FarmingService, useValue: farming },
        {
          provide: ApiAuthService,
          useValue: new ApiAuthService({
            runtime: readApiAuthRuntimeConfig({}),
          }),
        },
        { provide: FARMING_ENV, useValue: {} },
        FarmingGuard,
      ],
    })
    class HttpTestModule {}
    const app = await NestFactory.create<NestExpressApplication>(
      HttpTestModule,
      { logger: false },
    );
    app.setGlobalPrefix("api");
    try {
      await app.listen(0, "127.0.0.1");
      const base = await app.getUrl();
      const initial = await fetch(`${base}/api/farming/workspace`);
      expect(initial.status).toBe(200);
      expect(
        ((await initial.json()) as { data: { actorId: string } }).data.actorId,
      ).toBe("farm-demo-owner");
      const created = await fetch(`${base}/api/farming/legal-entities`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "HTTP Test Entity",
          state: "Madhya Pradesh",
        }),
      });
      expect(created.status).toBe(201);
      const workspace = (await (
        await fetch(`${base}/api/farming/workspace`)
      ).json()) as { data: { legalEntities: { name: string }[] } };
      expect(workspace.data.legalEntities[0].name).toBe("HTTP Test Entity");
      const invalid = await fetch(`${base}/api/farming/legal-entities`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "HTTP Test Entity",
          state: "Madhya Pradesh",
          role: "owner",
        }),
      });
      expect(invalid.status).toBe(400);
    } finally {
      await app.close();
    }
  });
});
