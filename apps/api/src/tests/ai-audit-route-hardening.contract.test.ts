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
import { AiController } from "../modules/ai/ai.controller";
import { AuditController } from "../modules/audit/audit.controller";

const aiProtectedHandlers = [
  "create",
  "list",
  "update",
  "getById",
  "explainAlert",
  "submitAlertExplanationFeedback",
  "summarizePond",
  "generateHandover",
  "rewriteText",
  "queryDashboard",
  "draftIncident",
  "draftApprovalNote"
] as const;

const auditProtectedHandlers = ["create", "list", "update", "getById"] as const;

type AiProtectedHandler = (typeof aiProtectedHandlers)[number];
type AuditProtectedHandler = (typeof auditProtectedHandlers)[number];

function createAiController() {
  return new AiController({ getPlaceholder: async () => ({ ok: true }) } as never, {} as never);
}

function createAuditController() {
  return new AuditController({ getPlaceholder: async () => ({ ok: true }) } as never, {} as never);
}

function createExecutionContext<
  TController extends AiController | AuditController,
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

describe("AI and audit backend route hardening", () => {
  it("marks every AI route as authenticated operator-only", () => {
    const controller = createAiController();

    for (const handlerName of aiProtectedHandlers) {
      const handler = controller[handlerName] as (...args: unknown[]) => unknown;

      expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toEqual(["operator"]);
    }
  });

  it("marks every audit route as authenticated operator-only", () => {
    const controller = createAuditController();

    for (const handlerName of auditProtectedHandlers) {
      const handler = controller[handlerName] as (...args: unknown[]) => unknown;

      expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toEqual(["operator"]);
    }
  });

  it("keeps AI routes usable in local-safe mode", async () => {
    const request: Record<string, unknown> = { headers: {} };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "local"
      })
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(createAiController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(roleGuard.canActivate(context)).toBe(true);
    expect((request as { user?: { roles?: string[]; provider?: string } }).user?.provider).toBe("local");
    expect((request as { user?: { roles?: string[] } }).user?.roles).toContain("operator");
  });

  it("keeps audit routes usable in local-safe mode", async () => {
    const request: Record<string, unknown> = { headers: {} };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "local"
      })
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(createAuditController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(roleGuard.canActivate(context)).toBe(true);
    expect((request as { user?: { roles?: string[]; provider?: string } }).user?.provider).toBe("local");
    expect((request as { user?: { roles?: string[] } }).user?.roles).toContain("operator");
  });

  it("requires an authenticated user on AI routes when keycloak mode is active", async () => {
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
      authGuard.canActivate(createExecutionContext(createAiController(), "list", { headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires an authenticated user on audit routes when keycloak mode is active", async () => {
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
      authGuard.canActivate(createExecutionContext(createAuditController(), "list", { headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires operator access on AI routes in keycloak mode", async () => {
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
    const context = createExecutionContext(createAiController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(() => roleGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("requires operator access on audit routes in keycloak mode", async () => {
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
    const context = createExecutionContext(createAuditController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(() => roleGuard.canActivate(context)).toThrow(ForbiddenException);
  });
});
