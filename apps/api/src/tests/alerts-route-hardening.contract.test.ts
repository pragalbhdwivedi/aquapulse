import { generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { ApiAuthService, createSignedJwtForTest } from "../common/auth/api-auth.service";
import { AUTH_REQUIRED_METADATA_KEY } from "../common/auth/auth-slice.decorator";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";
import { PlaceholderAuthGuard } from "../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../common/auth/placeholder-role.guard";
import { AUTH_ROLE_METADATA_KEY } from "../common/auth/require-roles.decorator";
import { AlertsController } from "../modules/alerts/alerts.controller";

const alreadyProtectedHandlers = [
  "list",
  "summary",
  "saveSavedView",
  "removeSavedView",
  "bulkAcknowledge",
  "bulkResolve",
  "bulkAssign",
  "bulkSetReviewState",
  "acknowledge",
  "resolve",
  "assign",
  "unassign",
  "setReviewState",
  "getById"
] as const;

const newlyProtectedHandlers = ["create", "listSavedViews", "attachExplanation", "update"] as const;

function createAlertsController() {
  return new AlertsController(
    { getPlaceholder: async () => ({ ok: true }) } as never,
    {} as never,
    {} as never
  );
}

function createExecutionContext<
  TController extends AlertsController,
  TMethodName extends keyof TController
>(
  controller: TController,
  methodName: TMethodName,
  request: Record<string, unknown>
): ExecutionContext {
  return {
    getClass: () => controller.constructor,
    getHandler: () => controller[methodName] as (...args: unknown[]) => unknown,
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as unknown as ExecutionContext;
}

describe("Alerts backend route hardening", () => {
  it("keeps the already-protected alerts handlers on authenticated operator metadata", () => {
    const controller = createAlertsController();

    for (const handlerName of alreadyProtectedHandlers) {
      const handler = controller[handlerName] as (...args: unknown[]) => unknown;

      expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toEqual(["operator"]);
    }
  });

  it("marks the remaining partial alerts handlers as authenticated operator-only", () => {
    const controller = createAlertsController();

    for (const handlerName of newlyProtectedHandlers) {
      const handler = controller[handlerName] as (...args: unknown[]) => unknown;

      expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toEqual(["operator"]);
    }
  });

  it("keeps the live-updates session route intentionally untouched", () => {
    const controller = createAlertsController();
    const handler = controller.issueLiveUpdatesSession as (...args: unknown[]) => unknown;

    expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toBeUndefined();
  });

  it("keeps newly protected alerts routes usable in local-safe mode", async () => {
    const request: Record<string, unknown> = { headers: {} };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "local"
      })
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(createAlertsController(), "create", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(roleGuard.canActivate(context)).toBe(true);
    expect((request as { user?: { roles?: string[]; provider?: string } }).user?.provider).toBe("local");
    expect((request as { user?: { roles?: string[] } }).user?.roles).toContain("operator");
  });

  it("requires an authenticated user on newly protected alerts routes when keycloak mode is active", async () => {
    const authGuard = new PlaceholderAuthGuard(
      new Reflector(),
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "keycloak",
          AQUAPULSE_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
          AQUAPULSE_KEYCLOAK_JWKS_URL: "https://id.example.com/jwks",
          AQUAPULSE_KEYCLOAK_REALM: "aquapulse",
          AQUAPULSE_KEYCLOAK_CLIENT_ID: "aquapulse-web"
        }),
        fetchImpl: (async () => new Response(JSON.stringify({ keys: [] }), { status: 200 })) as typeof fetch
      })
    );

    await expect(
      authGuard.canActivate(createExecutionContext(createAlertsController(), "create", { headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires operator access on newly protected alerts routes in keycloak mode", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048
    });
    const publicJwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
    const token = createSignedJwtForTest(
      {
        sub: "viewer-user",
        iss: "https://id.example.com/realms/aquapulse",
        aud: ["aquapulse-web"],
        exp: Math.floor(Date.now() / 1000) + 300,
        preferred_username: "aquapulse.viewer",
        realm_access: { roles: ["viewer"] }
      },
      {
        kid: "test-kid",
        privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString()
      }
    );
    const request: Record<string, unknown> = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "keycloak",
        AQUAPULSE_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        AQUAPULSE_KEYCLOAK_JWKS_URL: "https://id.example.com/jwks",
        AQUAPULSE_KEYCLOAK_REALM: "aquapulse",
        AQUAPULSE_KEYCLOAK_CLIENT_ID: "aquapulse-web"
      }),
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            keys: [{ ...publicJwk, kid: "test-kid", use: "sig", alg: "RS256" }]
          }),
          { status: 200 }
        )) as typeof fetch
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(createAlertsController(), "create", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(() => roleGuard.canActivate(context)).toThrow(ForbiddenException);
  });
});
