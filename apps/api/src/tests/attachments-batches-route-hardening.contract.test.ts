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
import { AttachmentsController } from "../modules/attachments/attachments.controller";
import { BatchesController } from "../modules/batches/batches.controller";

const attachmentsProtectedHandlers = ["create", "list", "update", "getById"] as const;
const batchesProtectedHandlers = ["create", "list", "update", "getById"] as const;

function createAttachmentsController() {
  return new AttachmentsController({ getPlaceholder: async () => ({ ok: true }) } as never, {} as never);
}

function createBatchesController() {
  return new BatchesController({ getPlaceholder: async () => ({ ok: true }) } as never, {} as never);
}

function createExecutionContext<
  TController extends AttachmentsController | BatchesController,
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

describe("Attachments and batches backend route hardening", () => {
  it("marks every attachments route as authenticated operator-only", () => {
    const controller = createAttachmentsController();

    for (const handlerName of attachmentsProtectedHandlers) {
      const handler = controller[handlerName] as (...args: unknown[]) => unknown;

      expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toEqual(["operator"]);
    }
  });

  it("marks every batches route as authenticated operator-only", () => {
    const controller = createBatchesController();

    for (const handlerName of batchesProtectedHandlers) {
      const handler = controller[handlerName] as (...args: unknown[]) => unknown;

      expect(Reflect.getMetadata(AUTH_REQUIRED_METADATA_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(AUTH_ROLE_METADATA_KEY, handler)).toEqual(["operator"]);
    }
  });

  it("keeps attachments routes usable in local-safe mode", async () => {
    const request: Record<string, unknown> = { headers: {} };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "local"
      })
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(createAttachmentsController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(roleGuard.canActivate(context)).toBe(true);
    expect((request as { user?: { roles?: string[]; provider?: string } }).user?.provider).toBe("local");
    expect((request as { user?: { roles?: string[] } }).user?.roles).toContain("operator");
  });

  it("keeps batches routes usable in local-safe mode", async () => {
    const request: Record<string, unknown> = { headers: {} };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "local"
      })
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(createBatchesController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(roleGuard.canActivate(context)).toBe(true);
    expect((request as { user?: { roles?: string[]; provider?: string } }).user?.provider).toBe("local");
    expect((request as { user?: { roles?: string[] } }).user?.roles).toContain("operator");
  });

  it("requires an authenticated user on attachments routes when keycloak mode is active", async () => {
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
      authGuard.canActivate(createExecutionContext(createAttachmentsController(), "list", { headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires an authenticated user on batches routes when keycloak mode is active", async () => {
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
      authGuard.canActivate(createExecutionContext(createBatchesController(), "list", { headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires operator access on attachments routes in keycloak mode", async () => {
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
    const context = createExecutionContext(createAttachmentsController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(() => roleGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("requires operator access on batches routes in keycloak mode", async () => {
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
    const context = createExecutionContext(createBatchesController(), "list", request);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(() => roleGuard.canActivate(context)).toThrow(ForbiddenException);
  });
});
