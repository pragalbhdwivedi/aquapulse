import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { ApiAuthService } from "../common/auth/api-auth.service";
import { RequireAuthentication } from "../common/auth/auth-slice.decorator";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";
import { PlaceholderAuthGuard } from "../common/auth/placeholder-auth.guard";

class ProtectedRuntimeDiagnosticsHandler {
  @RequireAuthentication()
  run() {
    return true;
  }
}

function createExecutionContext(request: Record<string, unknown>): ExecutionContext {
  const handlerClass = new ProtectedRuntimeDiagnosticsHandler();

  return {
    getClass: () => ProtectedRuntimeDiagnosticsHandler,
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
});
