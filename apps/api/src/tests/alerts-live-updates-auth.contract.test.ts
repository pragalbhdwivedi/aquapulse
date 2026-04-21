import { describe, expect, it } from "vitest";
import { generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { ApiAuthService, createSignedJwtForTest } from "../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";
import { AlertsLiveUpdatesService } from "../modules/alerts/live-updates/alerts-live-updates.service";

describe("Alerts live-updates auth awareness", () => {
  it("keeps subscriptions on the bounded bypass path when auth is disabled", async () => {
    const service = new AlertsLiveUpdatesService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "disabled"
        })
      })
    );

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: "/ws/alerts"
    });

    expect(decision.accepted).toBe(true);
    if (decision.accepted) {
      expect(decision.subscriptionAuthState).toBe("bypassed_local");
      expect(decision.authMode).toBe("disabled");
    }
  });

  it("rejects keycloak websocket subscriptions when bearer auth is missing", async () => {
    const service = new AlertsLiveUpdatesService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "keycloak",
          AQUAPULSE_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
          AQUAPULSE_KEYCLOAK_JWKS_URL: "https://id.example.com/jwks",
          AQUAPULSE_KEYCLOAK_REALM: "aquapulse",
          AQUAPULSE_KEYCLOAK_CLIENT_ID: "aquapulse-web"
        })
      })
    );

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: "/ws/alerts"
    });

    expect(decision.accepted).toBe(false);
    if (!decision.accepted) {
      expect(decision.subscriptionState).toBe("rejected_missing_auth");
      expect(decision.statusCode).toBe(401);
    }
  });

  it("accepts authenticated operator websocket subscriptions in keycloak mode", async () => {
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

    const service = new AlertsLiveUpdatesService(
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

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: `/ws/alerts?access_token=${encodeURIComponent(token)}`
    });

    expect(decision.accepted).toBe(true);
    if (decision.accepted) {
      expect(decision.subscriptionAuthState).toBe("authenticated");
      expect(decision.authMode).toBe("keycloak");
    }
  });

  it("rejects websocket subscriptions without bounded operator access in keycloak mode", async () => {
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
        preferred_username: "viewer.user",
        realm_access: { roles: ["viewer"] }
      },
      {
        kid: "test-kid",
        privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString()
      }
    );

    const service = new AlertsLiveUpdatesService(
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

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: `/ws/alerts?access_token=${encodeURIComponent(token)}`
    });

    expect(decision.accepted).toBe(false);
    if (!decision.accepted) {
      expect(decision.subscriptionState).toBe("rejected_insufficient_access");
      expect(decision.statusCode).toBe(403);
    }
  });
});
