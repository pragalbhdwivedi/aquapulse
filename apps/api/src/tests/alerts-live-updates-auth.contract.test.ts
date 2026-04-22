import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { ApiAuthService, createSignedJwtForTest } from "../common/auth/api-auth.service";
import { readApiAuthRuntimeConfig } from "../common/auth/auth-runtime.config";
import { AlertsLiveUpdatesService } from "../modules/alerts/live-updates/alerts-live-updates.service";

describe("Alerts live-updates auth awareness", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("issues a bounded bypass-local ephemeral ticket when auth is disabled", async () => {
    vi.stubEnv("AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES", "true");
    const service = new AlertsLiveUpdatesService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "disabled"
        })
      })
    );

    const bootstrap = await service.issueSubscriptionBootstrap({
      headers: {
        host: "localhost:4000"
      },
      url: "/api/alerts/live-updates/session"
    });

    expect(bootstrap.enabled).toBe(true);
    expect(bootstrap.subscriptionTransport).toBe("local_proxy_bootstrap");
    expect(bootstrap.credentialMode).toBe("ephemeral_ticket");
    expect(bootstrap.ticketIssued).toBe(true);
    expect(bootstrap.subscriptionAuthState).toBe("bypassed_local");
    expect(bootstrap.webSocketUrl).toContain("subscription_ticket=");
  });

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

  it("returns a degraded bootstrap response when keycloak auth is active without a resolved session", async () => {
    vi.stubEnv("AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES", "true");
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

    const bootstrap = await service.issueSubscriptionBootstrap({
      headers: {
        host: "localhost:4000"
      },
      url: "/api/alerts/live-updates/session"
    });

    expect(bootstrap.ticketIssued).toBe(false);
    expect(bootstrap.subscriptionAuthState).toBe("degraded");
    expect(bootstrap.credentialMode).toBe("none");
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

  it("issues an authenticated ephemeral ticket in keycloak mode and accepts the ticket on websocket subscribe", async () => {
    vi.stubEnv("AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES", "true");
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

    const bootstrap = await service.issueSubscriptionBootstrap({
      headers: {
        host: "localhost:4000",
        authorization: `Bearer ${token}`
      },
      url: "/api/alerts/live-updates/session"
    });

    expect(bootstrap.ticketIssued).toBe(true);
    expect(bootstrap.subscriptionAuthState).toBe("authenticated");
    expect(bootstrap.credentialMode).toBe("ephemeral_ticket");

    const ticket = new URL(bootstrap.webSocketUrl ?? "ws://localhost:4000/ws/alerts")
      .searchParams.get("subscription_ticket");
    expect(ticket).toBeTruthy();

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: `/ws/alerts?subscription_ticket=${encodeURIComponent(ticket ?? "")}`
    });

    expect(decision.accepted).toBe(true);
    if (decision.accepted) {
      expect(decision.subscriptionAuthState).toBe("authenticated");
    }
  });

  it("rejects websocket subscriptions when the ephemeral ticket is invalid", async () => {
    const service = new AlertsLiveUpdatesService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "disabled"
        })
      })
    );

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: "/ws/alerts?subscription_ticket=not-a-real-ticket"
    });

    expect(decision.accepted).toBe(false);
    if (!decision.accepted) {
      expect(decision.subscriptionState).toBe("rejected_invalid_ticket");
      expect(decision.statusCode).toBe(401);
    }
  });

  it("rejects websocket subscriptions when the ephemeral ticket has expired", async () => {
    vi.stubEnv("AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES", "true");
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    const service = new AlertsLiveUpdatesService(
      new ApiAuthService({
        runtime: readApiAuthRuntimeConfig({
          AQUAPULSE_AUTH_MODE: "disabled"
        })
      })
    );

    const bootstrap = await service.issueSubscriptionBootstrap({
      headers: {
        host: "localhost:4000"
      },
      url: "/api/alerts/live-updates/session"
    });
    const ticket = new URL(bootstrap.webSocketUrl ?? "ws://localhost:4000/ws/alerts")
      .searchParams.get("subscription_ticket");

    vi.spyOn(Date, "now").mockReturnValue(100_000);

    const decision = await service.resolveSubscriptionDecision({
      headers: {},
      url: `/ws/alerts?subscription_ticket=${encodeURIComponent(ticket ?? "")}`
    });

    expect(decision.accepted).toBe(false);
    if (!decision.accepted) {
      expect(decision.subscriptionState).toBe("rejected_expired_ticket");
      expect(decision.statusCode).toBe(401);
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
