import { describe, expect, it } from "vitest";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveFrontendSessionBootstrap,
  deriveProtectedOperatorUiGuard,
  deriveProtectedReadUiGuard,
  describeAuthAlignedSurface
} from "../features/auth-session";
import { getAuthRuntimeDiagnostics, parseClientRuntimeConfig } from "../clients/runtime-config";

describe("Frontend auth session bootstrap", () => {
  it("keeps session bootstrap on the safe bypass path when auth is disabled", () => {
    const auth = getAuthRuntimeDiagnostics(parseClientRuntimeConfig({}));
    const session = deriveFrontendSessionBootstrap(auth);
    const lifecycleGuard = deriveProtectedOperatorUiGuard(session);

    expect(session.bootstrapEnabled).toBe(true);
    expect(session.bootstrapState).toBe("bypassed");
    expect(session.sourceOfTruth).toBe("runtime_derived");
    expect(session.currentSessionEndpointStatus).toBe("not_requested");
    expect(session.sessionPresent).toBe(true);
    expect(session.protectedReadGuardedSliceLabel).toBe("alerts_list_read");
    expect(session.protectedReadGuardedSliceEnforced).toBe(false);
    expect(session.secondaryProtectedReadGuardedSliceLabel).toBe("alerts_detail_read");
    expect(session.secondaryProtectedReadGuardedSliceEnforced).toBe(false);
    expect(session.tertiaryProtectedReadGuardedSliceLabel).toBe("alerts_summary_read");
    expect(session.tertiaryProtectedReadGuardedSliceEnforced).toBe(false);
    expect(session.protectedOperatorUiState).toBe("bypassed");
    expect(session.secondaryGuardedSliceLabel).toBe("alerts_triage_actions");
    expect(session.secondaryGuardedSliceEnforced).toBe(false);
    expect(session.tertiaryGuardedSliceLabel).toBe("alerts_bulk_actions");
    expect(session.tertiaryGuardedSliceEnforced).toBe(false);
    expect(session.quaternaryGuardedSliceLabel).toBe("alerts_saved_view_mutations");
    expect(session.quaternaryGuardedSliceEnforced).toBe(false);
    expect(session.nonAlertsOperatorAccessSummaryLabel).toBe("non_alert_operator_update_access");
    expect(session.nonAlertsOperatorAccessSummaryEnforced).toBe(false);
    expect(session.nonAlertsGuardedSliceLabel).toBe("tasks_update");
    expect(session.nonAlertsGuardedSliceEnforced).toBe(false);
    expect(session.secondaryNonAlertsGuardedSliceLabel).toBe("feed_update");
    expect(session.secondaryNonAlertsGuardedSliceEnforced).toBe(false);
    expect(session.tertiaryNonAlertsGuardedSliceLabel).toBe("ponds_update");
    expect(session.tertiaryNonAlertsGuardedSliceEnforced).toBe(false);
    expect(session.quaternaryNonAlertsGuardedSliceLabel).toBe("water_quality_create");
    expect(session.quaternaryNonAlertsGuardedSliceEnforced).toBe(false);
    expect(session.quinaryNonAlertsGuardedSliceLabel).toBe("water_quality_update");
    expect(session.quinaryNonAlertsGuardedSliceEnforced).toBe(false);
    expect(lifecycleGuard.enabled).toBe(true);
    expect(lifecycleGuard.enforcedByBackend).toBe(true);
  });

  it("surfaces an active session when keycloak mode has forwarded auth available", () => {
    const config = parseClientRuntimeConfig({
      NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
      NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web"
    });
    const auth = getAuthRuntimeDiagnostics(config, {
      forwardedAuthPresent: true,
      forwardingSource: "env_token"
    });
    const session = deriveFrontendSessionBootstrap(auth);
    const lifecycleGuard = deriveProtectedOperatorUiGuard(session);
    const listReadGuard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.protectedReadGuardedSliceLabel,
      enforcedByBackend: session.protectedReadGuardedSliceEnforced
    });
    const detailReadGuard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.secondaryProtectedReadGuardedSliceLabel,
      enforcedByBackend: session.secondaryProtectedReadGuardedSliceEnforced
    });
    const summaryReadGuard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.tertiaryProtectedReadGuardedSliceLabel,
      enforcedByBackend: session.tertiaryProtectedReadGuardedSliceEnforced
    });
    const triageGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.secondaryGuardedSliceLabel
    });
    const bulkGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.tertiaryGuardedSliceLabel
    });
    const savedViewGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.quaternaryGuardedSliceLabel
    });
    const tasksUpdateGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.nonAlertsGuardedSliceLabel
    });
    const feedUpdateGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.secondaryNonAlertsGuardedSliceLabel
    });
    const pondsUpdateGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.tertiaryNonAlertsGuardedSliceLabel
    });
    const waterQualityCreateGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.quaternaryNonAlertsGuardedSliceLabel
    });
    const waterQualityUpdateGuard = deriveProtectedOperatorUiGuard(session, {
      sliceLabel: session.quinaryNonAlertsGuardedSliceLabel
    });
    const nonAlertSummary = deriveNonAlertOperatorAccessSummary(session);

    expect(session.bootstrapState).toBe("active");
    expect(session.sourceOfTruth).toBe("runtime_derived");
    expect(session.forwardingActive).toBe(true);
    expect(session.sessionPresent).toBe(true);
    expect(listReadGuard.enforcedByBackend).toBe(true);
    expect(listReadGuard.state).toBe("enabled");
    expect(detailReadGuard.enforcedByBackend).toBe(true);
    expect(detailReadGuard.state).toBe("enabled");
    expect(summaryReadGuard.enforcedByBackend).toBe(true);
    expect(summaryReadGuard.state).toBe("enabled");
    expect(lifecycleGuard.state).toBe("enabled");
    expect(triageGuard.enforcedByBackend).toBe(true);
    expect(triageGuard.state).toBe("enabled");
    expect(bulkGuard.enforcedByBackend).toBe(true);
    expect(bulkGuard.state).toBe("enabled");
    expect(savedViewGuard.enforcedByBackend).toBe(true);
    expect(savedViewGuard.state).toBe("enabled");
    expect(tasksUpdateGuard.enforcedByBackend).toBe(true);
    expect(tasksUpdateGuard.state).toBe("enabled");
    expect(feedUpdateGuard.enforcedByBackend).toBe(true);
    expect(feedUpdateGuard.state).toBe("enabled");
    expect(pondsUpdateGuard.enforcedByBackend).toBe(true);
    expect(pondsUpdateGuard.state).toBe("enabled");
    expect(waterQualityCreateGuard.enforcedByBackend).toBe(true);
    expect(waterQualityCreateGuard.state).toBe("enabled");
    expect(waterQualityUpdateGuard.enforcedByBackend).toBe(true);
    expect(waterQualityUpdateGuard.state).toBe("enabled");
    expect(nonAlertSummary.label).toBe("non_alert_operator_update_access");
    expect(nonAlertSummary.protectedSlices).toEqual([
      "tasks_update",
      "feed_update",
      "ponds_update",
      "water_quality_create",
      "water_quality_update"
    ]);
    expect(nonAlertSummary.accessState).toBe("available");
  });

  it("degrades safely when keycloak mode is requested but config is incomplete", () => {
    const auth = getAuthRuntimeDiagnostics(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse"
      })
    );
    const session = deriveFrontendSessionBootstrap(auth);

    expect(session.bootstrapState).toBe("degraded");
    expect(session.availabilityState).toBe("degraded");
    expect(session.protectedOperatorUiState).toBe("bypassed");
    expect(session.warnings.map((warning) => warning.code)).toContain(
      "AUTH_KEYCLOAK_CONFIG_INCOMPLETE"
    );
  });

  it("disables protected operator UI when keycloak mode is active without forwarded auth", () => {
    const auth = getAuthRuntimeDiagnostics(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web"
      })
    );
    const session = deriveFrontendSessionBootstrap(auth);
    const lifecycleGuard = deriveProtectedOperatorUiGuard(session);

    expect(session.bootstrapState).toBe("unavailable");
    expect(session.currentSessionAvailable).toBe(false);
    expect(session.sessionPresent).toBe(false);
    expect(lifecycleGuard.enabled).toBe(false);
    expect(lifecycleGuard.message).toContain("forwarded auth session");
  });

  it("classifies a backend-protected read surface as available when forwarded auth is active", () => {
    const auth = getAuthRuntimeDiagnostics(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web"
      }),
      {
        forwardedAuthPresent: true,
        forwardingSource: "env_token"
      }
    );
    const session = deriveFrontendSessionBootstrap(auth);
    const guard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.protectedReadGuardedSliceLabel,
      enforcedByBackend: session.protectedReadGuardedSliceEnforced
    });
    const surface = describeAuthAlignedSurface({
      surfaceLabel: session.protectedReadGuardedSliceLabel ?? "alerts_list_read",
      exposure: "backend_protected",
      guard,
      session
    });

    expect(surface.accessState).toBe("available");
  });

  it("classifies a backend-protected read surface as auth-required when auth forwarding is unavailable", () => {
    const auth = getAuthRuntimeDiagnostics(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL: "https://id.example.com/realms/aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID: "aquapulse-web"
      })
    );
    const session = deriveFrontendSessionBootstrap(auth);
    const guard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.protectedReadGuardedSliceLabel,
      enforcedByBackend: session.protectedReadGuardedSliceEnforced
    });
    const surface = describeAuthAlignedSurface({
      surfaceLabel: session.protectedReadGuardedSliceLabel ?? "alerts_list_read",
      exposure: "backend_protected",
      guard,
      session
    });

    expect(surface.accessState).toBe("auth_required");
  });

  it("classifies a backend-protected read surface as bypassed in local mode", () => {
    const auth = getAuthRuntimeDiagnostics(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "local"
      })
    );
    const session = deriveFrontendSessionBootstrap(auth);
    const guard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.protectedReadGuardedSliceLabel,
      enforcedByBackend: session.protectedReadGuardedSliceEnforced
    });
    const surface = describeAuthAlignedSurface({
      surfaceLabel: session.protectedReadGuardedSliceLabel ?? "alerts_list_read",
      exposure: "backend_protected",
      guard,
      session
    });

    expect(surface.accessState).toBe("bypassed_local");
  });

  it("classifies a backend-protected read surface as degraded when auth config is malformed", () => {
    const auth = getAuthRuntimeDiagnostics(
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: "keycloak",
        NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM: "aquapulse"
      })
    );
    const session = deriveFrontendSessionBootstrap(auth);
    const guard = deriveProtectedReadUiGuard(session, {
      sliceLabel: session.protectedReadGuardedSliceLabel,
      enforcedByBackend: session.protectedReadGuardedSliceEnforced
    });
    const surface = describeAuthAlignedSurface({
      surfaceLabel: session.protectedReadGuardedSliceLabel ?? "alerts_list_read",
      exposure: "backend_protected",
      guard,
      session
    });

    expect(surface.accessState).toBe("degraded");
  });
});
