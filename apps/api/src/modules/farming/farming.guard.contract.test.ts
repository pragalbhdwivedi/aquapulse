import "reflect-metadata";
import { generateKeyPairSync } from "node:crypto";
import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  ApiAuthService,
  createSignedJwtForTest,
} from "../../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../../common/auth/auth-runtime.config";
import { FarmingGuard } from "./farming.guard";
import { FarmingService, initialFarmWorkspace } from "./farming.service";
import { MemoryFarmWorkspaceStore } from "@aquapulse/database";
const context = (request: Record<string, unknown>) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as ExecutionContext;
const service = (demo = false) =>
  new FarmingService(
    new MemoryFarmWorkspaceStore(initialFarmWorkspace({})),
    demo,
  );
describe("farming authentication fails closed", () => {
  it("blocks disabled, forged local-header and incomplete Keycloak configurations", async () => {
    for (const env of [
      {},
      { AQUAPULSE_AUTH_MODE: "local" },
      { AQUAPULSE_AUTH_MODE: "keycloak" },
    ]) {
      const guard = new FarmingGuard(
        new ApiAuthService({ runtime: readApiAuthRuntimeConfig(env) }),
        service(),
        env,
      );
      await expect(
        guard.canActivate(
          context({
            headers: {
              "x-aquapulse-dev-user": "owner",
              "x-aquapulse-dev-roles": "owner",
            },
          }),
        ),
      ).rejects.toThrow();
    }
  });
  it("permits only explicit non-production disabled-auth demo identity", async () => {
    const auth = new ApiAuthService({ runtime: readApiAuthRuntimeConfig({}) });
    const request: Record<string, unknown> = { headers: {} };
    expect(
      await new FarmingGuard(auth, service(true), {}).canActivate(
        context(request),
      ),
    ).toBe(true);
    expect(request.farmActor).toBe("farm-demo-owner");
    await expect(
      new FarmingGuard(auth, service(true), {
        NODE_ENV: "production",
      }).canActivate(context({})),
    ).rejects.toThrow("production");
  });
  it("requires signed issuer, audience and expiry, including cases accepted by legacy auth", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const runtime = readApiAuthRuntimeConfig({
      AQUAPULSE_AUTH_MODE: "keycloak",
      AQUAPULSE_KEYCLOAK_ISSUER_URL: "https://identity.example/realms/farms",
      AQUAPULSE_KEYCLOAK_REALM: "farms",
      AQUAPULSE_KEYCLOAK_CLIENT_ID: "farms-api",
    });
    const auth = new ApiAuthService({
      runtime,
      fetchImpl: async () =>
        Response.json({
          keys: [{ ...publicKey.export({ format: "jwk" }), kid: "test-kid" }],
        }),
    });
    const guard = new FarmingGuard(auth, service(), {});
    const claims: Record<string, unknown> = {
      sub: "operator",
      iss: runtime.keycloak.issuerUrl,
      aud: "farms-api",
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    const signed = (payload: Record<string, unknown>) =>
      context({
        headers: {
          authorization: `Bearer ${createSignedJwtForTest(payload, { privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString() })}`,
        },
      });
    expect(await guard.canActivate(signed(claims))).toBe(true);
    for (const field of ["iss", "aud", "exp"]) {
      const payload = { ...claims };
      delete payload[field];
      await expect(guard.canActivate(signed(payload))).rejects.toThrow();
    }
    await expect(
      guard.canActivate(signed({ ...claims, aud: "other-api" })),
    ).rejects.toThrow();
    await expect(
      guard.canActivate(signed({ ...claims, exp: 1 })),
    ).rejects.toThrow();
  });
});
