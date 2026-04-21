import { describe, expect, it } from "vitest";
import { readResolvedFrontendRuntimeDiagnostics } from "../features/auth-session-server";

describe("Backend-backed frontend auth session resolution", () => {
  it("stays on runtime-derived auth state when backend current-session resolution is not enabled", async () => {
    const diagnostics = await readResolvedFrontendRuntimeDiagnostics({});

    expect(diagnostics.session.sourceOfTruth).toBe("runtime_derived");
    expect(diagnostics.session.currentSessionEndpointStatus).toBe("not_requested");
  });

  it("uses backend-derived current-session data when the endpoint is enabled and reachable", async () => {
    const diagnostics = await readResolvedFrontendRuntimeDiagnostics(
      {
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web",
        AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION: "true"
      },
      (async (input: string | URL) =>
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              requestedMode: "keycloak",
              effectiveMode: "keycloak",
              availabilityState: "authenticated_user",
              authSource: "keycloak_bearer",
              user: {
                id: "verified-user",
                username: "verified.operator",
                displayName: "Verified Operator",
                provider: "keycloak",
                roles: ["operator"],
                permissions: [],
                claimKeys: ["aud", "iss", "preferred_username"]
              },
              sessionPresent: true,
              protectedOperatorSliceLabel: "alerts_lifecycle_actions",
              protectedOperatorSliceEnforced: true,
              verificationState: "verified",
              warnings: []
            }
          }),
          { status: 200 }
        )) as typeof fetch
    );

    expect(diagnostics.session.sourceOfTruth).toBe("backend_session");
    expect(diagnostics.session.currentSessionEndpointStatus).toBe("available");
    expect(diagnostics.session.currentUser?.displayName).toBe("Verified Operator");
    expect(diagnostics.session.protectedOperatorUiState).toBe("enabled");
  });

  it("degrades safely to runtime-derived auth state when the backend current-session endpoint is unreachable", async () => {
    const diagnostics = await readResolvedFrontendRuntimeDiagnostics(
      {
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web",
        AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION: "true"
      },
      (async () => {
        throw new Error("connect ECONNREFUSED");
      }) as typeof fetch
    );

    expect(diagnostics.session.sourceOfTruth).toBe("runtime_derived");
    expect(diagnostics.session.currentSessionEndpointStatus).toBe("unreachable");
    expect(diagnostics.session.warnings.map((warning) => warning.code)).toContain(
      "CURRENT_SESSION_ENDPOINT_UNREACHABLE"
    );
  });
});
