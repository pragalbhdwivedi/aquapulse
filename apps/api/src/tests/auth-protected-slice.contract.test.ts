import { generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { ApiAuthService, createSignedJwtForTest } from "../common/auth/api-auth.service";
import { RequireAuthentication } from "../common/auth/auth-slice.decorator";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";
import { PlaceholderAuthGuard } from "../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../common/auth/placeholder-role.guard";
import { RequireRoles } from "../common/auth/require-roles.decorator";

class ProtectedRuntimeDiagnosticsHandler {
  @RequireAuthentication()
  run() {
    return true;
  }
}

class ProtectedAlertLifecycleHandler {
  @RequireAuthentication()
  @RequireRoles("operator")
  run() {
    return true;
  }
}

class ProtectedAlertTriageHandler {
  @RequireAuthentication()
  @RequireRoles("operator")
  run() {
    return true;
  }
}

class ProtectedAlertBulkHandler {
  @RequireAuthentication()
  @RequireRoles("operator")
  run() {
    return true;
  }
}

class ProtectedAlertSavedViewMutationHandler {
  @RequireAuthentication()
  @RequireRoles("operator")
  run() {
    return true;
  }
}

function createExecutionContext(
  request: Record<string, unknown>,
  HandlerClass:
    | typeof ProtectedRuntimeDiagnosticsHandler
    | typeof ProtectedAlertLifecycleHandler
    | typeof ProtectedAlertTriageHandler
    | typeof ProtectedAlertBulkHandler
    | typeof ProtectedAlertSavedViewMutationHandler =
    ProtectedRuntimeDiagnosticsHandler
): ExecutionContext {
  const handlerClass = new HandlerClass();

  return {
    getClass: () => HandlerClass,
    getHandler: () => handlerClass.run,
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as unknown as ExecutionContext;
}

describe("First protected auth slice", () => {
  it("keeps the protected slice open in disabled mode", async () => {
    const guard = new PlaceholderAuthGuard(
      new Reflector(),
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "disabled"
        })
      })
    );

    await expect(guard.canActivate(createExecutionContext({ headers: {} }))).resolves.toBe(true);
  });

  it("keeps the protected slice usable in local mode with a deterministic local user", async () => {
    const request: Record<string, unknown> = {
      headers: {}
    };
    const guard = new PlaceholderAuthGuard(
      new Reflector(),
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "local"
        })
      })
    );

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);
    expect((request as { user?: { provider?: string } }).user?.provider).toBe("local");
  });

  it("requires an authenticated keycloak user on the first protected slice when keycloak mode is active", async () => {
    const guard = new PlaceholderAuthGuard(
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

    await expect(guard.canActivate(createExecutionContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("keeps the alerts lifecycle operator slice usable in local mode", async () => {
    const request: Record<string, unknown> = {
      headers: {}
    };
    const authService = new ApiAuthService({
      runtime: readApiAuthRuntimeConfig({
        AQUAPULSE_AUTH_MODE: "local"
      })
    });
    const authGuard = new PlaceholderAuthGuard(new Reflector(), authService);
    const roleGuard = new PlaceholderRoleGuard(new Reflector(), authService);
    const context = createExecutionContext(request, ProtectedAlertLifecycleHandler);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(roleGuard.canActivate(context)).toBe(true);
    expect((request as { user?: { roles?: string[] } }).user?.roles).toContain("operator");
  });

  it("requires an operator role on the alerts lifecycle slice when keycloak mode is active", async () => {
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
      })
      ,
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
    const context = createExecutionContext(request, ProtectedAlertLifecycleHandler);

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(() => roleGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("requires an authenticated operator on the alerts triage slice when keycloak mode is active", async () => {
    const guard = new PlaceholderAuthGuard(
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
      guard.canActivate(createExecutionContext({ headers: {} }, ProtectedAlertTriageHandler))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires an authenticated operator on the alerts bulk slice when keycloak mode is active", async () => {
    const guard = new PlaceholderAuthGuard(
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
      guard.canActivate(createExecutionContext({ headers: {} }, ProtectedAlertBulkHandler))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires an authenticated operator on the alerts saved-view mutation slice when keycloak mode is active", async () => {
    const guard = new PlaceholderAuthGuard(
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
      guard.canActivate(
        createExecutionContext({ headers: {} }, ProtectedAlertSavedViewMutationHandler)
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
