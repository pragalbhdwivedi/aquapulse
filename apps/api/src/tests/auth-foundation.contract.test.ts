import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { ApiAuthService, createSignedJwtForTest } from "../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";

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

  it("hydrates a deterministic local operator when local auth mode is enabled", async () => {
    vi.stubEnv("AQUAPULSE_AUTH_MODE", "local");
    vi.stubEnv("AQUAPULSE_AUTH_LOCAL_DISPLAY_NAME", "Shift Operator");
    vi.stubEnv("AQUAPULSE_AUTH_LOCAL_ROLES", "operator,manager");

    const service = new ApiAuthService();
    const user = await service.hydrateRequestUser({
      headers: {
        "x-aquapulse-dev-username": "pond.supervisor"
      }
    });

    expect(user?.provider).toBe("local");
    expect(user?.displayName).toBe("Shift Operator");
    expect(user?.username).toBe("pond.supervisor");
    expect(user?.roles).toEqual(["operator", "manager"]);
  });

  it("verifies a keycloak bearer token against JWKS when verification is available", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048
    });
    const publicJwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
    const token = createSignedJwtForTest(
      {
        sub: "verified-user",
        iss: "https://id.example.com/realms/aquapulse",
        aud: ["aquapulse-web"],
        exp: Math.floor(Date.now() / 1000) + 300,
        preferred_username: "verified.operator",
        realm_access: { roles: ["operator"] }
      },
      {
        kid: "test-kid",
        privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString()
      }
    );

    const service = new ApiAuthService({
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

    const user = await service.hydrateRequestUser({
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(user?.id).toBe("verified-user");
    expect(user?.provider).toBe("keycloak");
    expect(user?.roles).toEqual(["operator"]);
  });
});
