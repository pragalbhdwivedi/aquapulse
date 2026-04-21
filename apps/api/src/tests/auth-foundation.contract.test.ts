import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiAuthService } from "../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";

function createJwtPayloadToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }))
    .toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}

describe("Auth foundation contracts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to disabled auth mode with safe local fallback metadata", () => {
    const runtime = readApiAuthRuntimeConfig({});

    expect(runtime.requestedMode).toBe("disabled");
    expect(runtime.effectiveMode).toBe("disabled");
    expect(runtime.keycloak.configured).toBe(false);
    expect(runtime.localUser.displayName).toBe("Local Operator");
    expect(runtime.localUser.roles).toEqual(["operator"]);
  });

  it("keeps incomplete keycloak config on a safe disabled fallback", () => {
    const runtime = readApiAuthRuntimeConfig({
      AQUAPULSE_AUTH_MODE: "keycloak",
      AQUAPULSE_KEYCLOAK_REALM: "aquapulse"
    });

    expect(runtime.requestedMode).toBe("keycloak");
    expect(runtime.effectiveMode).toBe("disabled");
    expect(runtime.warnings.map((warning) => warning.code)).toContain(
      "AUTH_KEYCLOAK_CONFIG_INCOMPLETE"
    );
  });

  it("hydrates a deterministic local operator when local auth mode is enabled", () => {
    vi.stubEnv("AQUAPULSE_AUTH_MODE", "local");
    vi.stubEnv("AQUAPULSE_AUTH_LOCAL_DISPLAY_NAME", "Shift Operator");
    vi.stubEnv("AQUAPULSE_AUTH_LOCAL_ROLES", "operator,manager");

    const service = new ApiAuthService();
    const user = service.hydrateRequestUser({
      headers: {
        "x-aquapulse-dev-username": "pond.supervisor"
      }
    });

    expect(user?.provider).toBe("local");
    expect(user?.displayName).toBe("Shift Operator");
    expect(user?.username).toBe("pond.supervisor");
    expect(user?.roles).toEqual(["operator", "manager"]);
  });

  it("hydrates a claims-based keycloak user without mutating lifecycle state", () => {
    vi.stubEnv("AQUAPULSE_AUTH_MODE", "keycloak");
    vi.stubEnv("AQUAPULSE_KEYCLOAK_ISSUER_URL", "https://id.example.com/realms/aquapulse");
    vi.stubEnv("AQUAPULSE_KEYCLOAK_REALM", "aquapulse");
    vi.stubEnv("AQUAPULSE_KEYCLOAK_CLIENT_ID", "aquapulse-web");

    const service = new ApiAuthService();
    const token = createJwtPayloadToken({
      sub: "user-123",
      iss: "https://id.example.com/realms/aquapulse",
      aud: ["aquapulse-web"],
      preferred_username: "aquapulse.operator",
      name: "AquaPulse Operator",
      email: "operator@example.com",
      realm_access: {
        roles: ["operator"]
      },
      resource_access: {
        "aquapulse-web": {
          roles: ["reviewer"]
        }
      },
      scope: "alerts:read alerts:write"
    });

    const user = service.hydrateRequestUser({
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(user?.provider).toBe("keycloak");
    expect(user?.id).toBe("user-123");
    expect(user?.roles).toEqual(["operator", "reviewer"]);
    expect(user?.permissions).toEqual(["alerts:read", "alerts:write"]);
  });
});
