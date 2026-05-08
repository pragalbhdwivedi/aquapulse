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
    expect(session.protectedReadSliceLabel).toBe("alerts_list_read");
    expect(session.protectedReadSliceEnforced).toBe(false);
    expect(session.secondaryProtectedReadSliceLabel).toBe("alerts_detail_read");
    expect(session.secondaryProtectedReadSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedReadSliceLabel).toBe("alerts_summary_read");
    expect(session.tertiaryProtectedReadSliceEnforced).toBe(false);
    expect(session.secondaryProtectedSliceLabel).toBe("alerts_triage_actions");
    expect(session.secondaryProtectedSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedSliceLabel).toBe("alerts_bulk_actions");
    expect(session.tertiaryProtectedSliceEnforced).toBe(false);
    expect(session.quaternaryProtectedSliceLabel).toBe("alerts_saved_view_mutations");
    expect(session.quaternaryProtectedSliceEnforced).toBe(false);
    expect(session.nonAlertsOperatorAccessSummaryLabel).toBe("non_alert_operator_update_access");
    expect(session.nonAlertsOperatorAccessSummaryEnforced).toBe(false);
    expect(session.nonAlertsProtectedSliceLabel).toBe("tasks_update");
    expect(session.nonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.secondaryNonAlertsProtectedSliceLabel).toBe("feed_update");
    expect(session.secondaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.tertiaryNonAlertsProtectedSliceLabel).toBe("ponds_update");
    expect(session.tertiaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.quaternaryNonAlertsProtectedSliceLabel).toBe("water_quality_create");
    expect(session.quaternaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.quinaryNonAlertsProtectedSliceLabel).toBe("water_quality_update");
    expect(session.quinaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.senaryNonAlertsProtectedSliceLabel).toBe("feed_create");
    expect(session.senaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.septenaryNonAlertsProtectedSliceLabel).toBe("tasks_create");
    expect(session.septenaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.octonaryNonAlertsProtectedSliceLabel).toBe("ponds_create");
    expect(session.octonaryNonAlertsProtectedSliceEnforced).toBe(false);
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
    expect(session.user?.alertsAccessLevel).toBe("operator");
    expect(session.user?.operatorAccess).toBe(true);
    expect(session.user?.alertsAccessSource).toBe("operator_role");
    expect(session.protectedReadSliceEnforced).toBe(false);
    expect(session.secondaryProtectedReadSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedReadSliceEnforced).toBe(false);
    expect(session.secondaryProtectedSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedSliceEnforced).toBe(false);
    expect(session.quaternaryProtectedSliceEnforced).toBe(false);
    expect(session.nonAlertsOperatorAccessSummaryEnforced).toBe(false);
    expect(session.nonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.secondaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.tertiaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.quaternaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.quinaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.senaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.septenaryNonAlertsProtectedSliceEnforced).toBe(false);
    expect(session.octonaryNonAlertsProtectedSliceEnforced).toBe(false);
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
    expect(session.user?.alertsAccessLevel).toBe("operator");
    expect(session.user?.operatorAccess).toBe(true);
    expect(session.user?.alertsAccessSource).toBe("operator_role");
    expect(session.protectedReadSliceEnforced).toBe(true);
    expect(session.secondaryProtectedReadSliceEnforced).toBe(true);
    expect(session.tertiaryProtectedReadSliceEnforced).toBe(true);
    expect(session.secondaryProtectedSliceEnforced).toBe(true);
    expect(session.tertiaryProtectedSliceEnforced).toBe(true);
    expect(session.quaternaryProtectedSliceEnforced).toBe(true);
    expect(session.nonAlertsOperatorAccessSummaryEnforced).toBe(true);
    expect(session.nonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.secondaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.tertiaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.quaternaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.quinaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.senaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.septenaryNonAlertsProtectedSliceEnforced).toBe(true);
    expect(session.octonaryNonAlertsProtectedSliceEnforced).toBe(true);
  });

  it("derives operator access from alerts:operate permission when the role is not present", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048
    });
    const publicJwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
    const token = createSignedJwtForTest(
      {
        sub: "permission-user",
        iss: "https://id.example.com/realms/aquapulse",
        aud: ["aquapulse-web"],
        exp: Math.floor(Date.now() / 1000) + 300,
        preferred_username: "permission.operator",
        realm_access: { roles: ["viewer"] },
        permissions: ["alerts:operate"]
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

    expect(session.user?.alertsAccessLevel).toBe("operator");
    expect(session.user?.operatorAccess).toBe(true);
    expect(session.user?.alertsAccessSource).toBe("alerts_operate_permission");
  });
});
