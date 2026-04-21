import { describe, expect, it } from "vitest";
import { generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { CurrentSessionService } from "../common/auth/current-session.service";
import { ApiAuthService, createSignedJwtForTest } from "../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";

describe("Current session surface", () => {
  it("returns a safe disabled payload when auth is disabled", async () => {
    const service = new CurrentSessionService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "disabled"
        })
      })
    );

    const session = await service.getCurrentSession({ headers: {} });

    expect(session.effectiveMode).toBe("disabled");
    expect(session.availabilityState).toBe("disabled");
    expect(session.sessionPresent).toBe(false);
    expect(session.secondaryProtectedSliceLabel).toBe("alerts_triage_actions");
    expect(session.secondaryProtectedSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedSliceLabel).toBe("alerts_bulk_actions");
    expect(session.tertiaryProtectedSliceEnforced).toBe(false);
    expect(session.user).toBeUndefined();
  });

  it("returns a deterministic local current user in local mode", async () => {
    const service = new CurrentSessionService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "local",
          AQUAPULSE_AUTH_LOCAL_DISPLAY_NAME: "Shift Operator"
        })
      })
    );

    const session = await service.getCurrentSession({
      headers: {
        "x-aquapulse-dev-username": "pond.supervisor"
      }
    });

    expect(session.availabilityState).toBe("local_user");
    expect(session.authSource).toBe("local_dev_headers");
    expect(session.user?.displayName).toBe("Shift Operator");
    expect(session.user?.username).toBe("pond.supervisor");
    expect(session.secondaryProtectedSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedSliceEnforced).toBe(false);
  });

  it("returns a verified keycloak-backed current user when a valid bearer token is supplied", async () => {
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

    const service = new CurrentSessionService(
      new ApiAuthService({
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
      })
    );

    const session = await service.getCurrentSession({
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(session.availabilityState).toBe("authenticated_user");
    expect(session.authSource).toBe("keycloak_bearer");
    expect(session.user?.provider).toBe("keycloak");
    expect(session.user?.roles).toEqual(["operator"]);
    expect(session.secondaryProtectedSliceEnforced).toBe(true);
    expect(session.tertiaryProtectedSliceEnforced).toBe(true);
  });
});
