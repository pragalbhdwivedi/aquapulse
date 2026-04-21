import { describe, expect, it } from "vitest";

const verifierModulePath = "../../../../scripts/lib/auth-runtime-verifier.mjs";

async function loadVerifierModule() {
  return (await import(verifierModulePath)) as {
    createVerifierRequestHeaders: (
      config: Record<string, unknown>,
      extraHeaders?: Record<string, string>
    ) => Record<string, string>;
    deriveProtectedExpectation: (input: {
      readonly effectiveAuthMode: "disabled" | "local" | "keycloak";
      readonly sessionAvailabilityState:
        | "disabled"
        | "local_user"
        | "authenticated_user"
        | "unauthenticated"
        | "degraded";
    }) => "success" | "unauthorized";
    readAuthRuntimeVerificationConfig: (
      env?: Record<string, string | undefined>
    ) => {
      readonly webBaseUrl: string;
      readonly backendBaseUrl: string;
      readonly expectedAuthMode: "auto" | "disabled" | "local" | "keycloak";
      readonly bearerToken?: string;
      readonly alertId: string;
      readonly verificationOwner: string;
      readonly enableMutations: boolean;
    };
  };
}

describe("Auth runtime verifier config", () => {
  it("keeps bounded verifier defaults safe and local-development friendly", async () => {
    const { readAuthRuntimeVerificationConfig } = await loadVerifierModule();
    const config = readAuthRuntimeVerificationConfig({});

    expect(config.webBaseUrl).toBe("http://localhost:3000");
    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(config.expectedAuthMode).toBe("auto");
    expect(config.bearerToken).toBeUndefined();
    expect(config.alertId).toBe("alert-1");
    expect(config.verificationOwner).toBe("operator-verification");
    expect(config.enableMutations).toBe(false);
  });

  it("accepts explicit verifier env overrides without changing unrelated defaults", async () => {
    const { readAuthRuntimeVerificationConfig } = await loadVerifierModule();
    const config = readAuthRuntimeVerificationConfig({
      AQUAPULSE_AUTH_VERIFY_WEB_BASE_URL: "http://localhost:3100",
      AQUAPULSE_AUTH_VERIFY_API_BASE_URL: "http://localhost:4100",
      AQUAPULSE_AUTH_VERIFY_EXPECT_AUTH_MODE: "keycloak",
      AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN: "test-token",
      AQUAPULSE_AUTH_VERIFY_ALERT_ID: "alert-9",
      AQUAPULSE_AUTH_VERIFY_OWNER: "operator.auth",
      AQUAPULSE_AUTH_VERIFY_ENABLE_MUTATIONS: "true"
    });

    expect(config.webBaseUrl).toBe("http://localhost:3100");
    expect(config.backendBaseUrl).toBe("http://localhost:4100");
    expect(config.expectedAuthMode).toBe("keycloak");
    expect(config.bearerToken).toBe("test-token");
    expect(config.alertId).toBe("alert-9");
    expect(config.verificationOwner).toBe("operator.auth");
    expect(config.enableMutations).toBe(true);
  });

  it("derives protected-slice expectations from auth mode and current-session state", async () => {
    const { deriveProtectedExpectation } = await loadVerifierModule();
    expect(
      deriveProtectedExpectation({
        effectiveAuthMode: "disabled",
        sessionAvailabilityState: "disabled"
      })
    ).toBe("success");
    expect(
      deriveProtectedExpectation({
        effectiveAuthMode: "local",
        sessionAvailabilityState: "local_user"
      })
    ).toBe("success");
    expect(
      deriveProtectedExpectation({
        effectiveAuthMode: "keycloak",
        sessionAvailabilityState: "authenticated_user"
      })
    ).toBe("success");
    expect(
      deriveProtectedExpectation({
        effectiveAuthMode: "keycloak",
        sessionAvailabilityState: "unauthenticated"
      })
    ).toBe("unauthorized");
  });

  it("builds verifier request headers with an optional bearer token", async () => {
    const { createVerifierRequestHeaders, readAuthRuntimeVerificationConfig } =
      await loadVerifierModule();
    const withoutToken = createVerifierRequestHeaders(readAuthRuntimeVerificationConfig({}));
    const withToken = createVerifierRequestHeaders(
      readAuthRuntimeVerificationConfig({
        AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN: "bounded-token"
      }),
      {
        "content-type": "application/json"
      }
    );

    expect(withoutToken).toEqual({
      accept: "application/json"
    });
    expect(withToken).toEqual({
      accept: "application/json",
      "content-type": "application/json",
      authorization: "Bearer bounded-token"
    });
  });
});
