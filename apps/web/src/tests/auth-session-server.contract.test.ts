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
                claimKeys: ["aud", "iss", "preferred_username"],
                alertsAccessLevel: "operator",
                operatorAccess: true,
                alertsAccessSource: "operator_role"
              },
              sessionPresent: true,
              protectedReadSliceLabel: "alerts_list_read",
              protectedReadSliceEnforced: true,
              secondaryProtectedReadSliceLabel: "alerts_detail_read",
              secondaryProtectedReadSliceEnforced: true,
              tertiaryProtectedReadSliceLabel: "alerts_summary_read",
              tertiaryProtectedReadSliceEnforced: true,
              protectedOperatorSliceLabel: "alerts_lifecycle_actions",
              protectedOperatorSliceEnforced: true,
              secondaryProtectedSliceLabel: "alerts_triage_actions",
              secondaryProtectedSliceEnforced: true,
              tertiaryProtectedSliceLabel: "alerts_bulk_actions",
              tertiaryProtectedSliceEnforced: true,
              quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
              quaternaryProtectedSliceEnforced: true,
              nonAlertsOperatorAccessSummaryLabel: "non_alert_operator_update_access",
              nonAlertsOperatorAccessSummaryEnforced: true,
              nonAlertsReadAccessSummaryLabel: "non_alert_read_access",
              nonAlertsReadAccessSummaryEnforced: true,
              nonAlertsProtectedReadSliceLabel: "water_quality_detail_read",
              nonAlertsProtectedReadSliceEnforced: true,
              nonAlertsProtectedSliceLabel: "tasks_update",
              nonAlertsProtectedSliceEnforced: true,
              secondaryNonAlertsProtectedSliceLabel: "feed_update",
              secondaryNonAlertsProtectedSliceEnforced: true,
              tertiaryNonAlertsProtectedSliceLabel: "ponds_update",
              tertiaryNonAlertsProtectedSliceEnforced: true,
              quaternaryNonAlertsProtectedSliceLabel: "water_quality_create",
              quaternaryNonAlertsProtectedSliceEnforced: true,
              quinaryNonAlertsProtectedSliceLabel: "water_quality_update",
              quinaryNonAlertsProtectedSliceEnforced: true,
              senaryNonAlertsProtectedSliceLabel: "feed_create",
              senaryNonAlertsProtectedSliceEnforced: true,
              septenaryNonAlertsProtectedSliceLabel: "tasks_create",
              septenaryNonAlertsProtectedSliceEnforced: true,
              octonaryNonAlertsProtectedSliceLabel: "ponds_create",
              octonaryNonAlertsProtectedSliceEnforced: true,
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
    expect(diagnostics.session.protectedReadGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.secondaryProtectedReadGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.tertiaryProtectedReadGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.protectedOperatorUiState).toBe("enabled");
    expect(diagnostics.session.secondaryGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.tertiaryGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.quaternaryGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.nonAlertsOperatorAccessSummaryLabel).toBe("non_alert_operator_update_access");
    expect(diagnostics.session.nonAlertsOperatorAccessSummaryEnforced).toBe(true);
    expect(diagnostics.session.nonAlertsReadAccessSummaryLabel).toBe("non_alert_read_access");
    expect(diagnostics.session.nonAlertsReadAccessSummaryEnforced).toBe(true);
    expect(diagnostics.session.nonAlertsReadGuardedSliceLabel).toBe("water_quality_detail_read");
    expect(diagnostics.session.nonAlertsReadGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.nonAlertsGuardedSliceLabel).toBe("tasks_update");
    expect(diagnostics.session.nonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.secondaryNonAlertsGuardedSliceLabel).toBe("feed_update");
    expect(diagnostics.session.secondaryNonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.tertiaryNonAlertsGuardedSliceLabel).toBe("ponds_update");
    expect(diagnostics.session.tertiaryNonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.quaternaryNonAlertsGuardedSliceLabel).toBe("water_quality_create");
    expect(diagnostics.session.quaternaryNonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.quinaryNonAlertsGuardedSliceLabel).toBe("water_quality_update");
    expect(diagnostics.session.quinaryNonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.senaryNonAlertsGuardedSliceLabel).toBe("feed_create");
    expect(diagnostics.session.senaryNonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.septenaryNonAlertsGuardedSliceLabel).toBe("tasks_create");
    expect(diagnostics.session.septenaryNonAlertsGuardedSliceEnforced).toBe(true);
    expect(diagnostics.session.octonaryNonAlertsGuardedSliceLabel).toBe("ponds_create");
    expect(diagnostics.session.octonaryNonAlertsGuardedSliceEnforced).toBe(true);
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
