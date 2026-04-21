import type {
  FrontendAuthRuntimeDiagnostics,
  FrontendSessionBootstrapStatus,
  RuntimeWarning
} from "@aquapulse/types";

export interface ProtectedOperatorUiGuard {
  readonly sliceLabel: string;
  readonly enforcedByBackend: boolean;
  readonly state: FrontendSessionBootstrapStatus["protectedOperatorUiState"];
  readonly enabled: boolean;
  readonly message: string;
  readonly warnings: readonly RuntimeWarning[];
}

export function deriveFrontendSessionBootstrap(
  auth: FrontendAuthRuntimeDiagnostics
): FrontendSessionBootstrapStatus {
  const bootstrapState: FrontendSessionBootstrapStatus["bootstrapState"] =
    auth.effectiveMode === "keycloak"
      ? auth.forwardingActive
        ? "active"
        : "unavailable"
      : auth.requestedMode === "keycloak" && auth.effectiveMode === "disabled"
        ? "degraded"
        : "bypassed";

  return {
    bootstrapEnabled: true,
    bootstrapState,
    requestedMode: auth.requestedMode,
    effectiveMode: auth.effectiveMode,
    sessionPresent:
      auth.effectiveMode === "keycloak" ? auth.forwardedAuthPresent : true,
    forwardedAuthPresent: auth.forwardedAuthPresent,
    forwardingActive: auth.forwardingActive,
    forwardingMode: auth.forwardingMode,
    protectedOperatorSliceLabel: auth.protectedOperatorSliceLabel,
    protectedOperatorUiState:
      bootstrapState === "active"
        ? "enabled"
        : bootstrapState === "bypassed" || bootstrapState === "degraded"
          ? "bypassed"
          : "disabled",
    secondaryGuardedSliceLabel: "alerts_triage_actions",
    secondaryGuardedSliceEnforced: false,
    warnings: [...auth.warnings]
  };
}

export function deriveProtectedOperatorUiGuard(
  session: FrontendSessionBootstrapStatus,
  options: {
    readonly sliceLabel?: string;
    readonly enforcedByBackend?: boolean;
  } = {}
): ProtectedOperatorUiGuard {
  const sliceLabel = options.sliceLabel ?? session.protectedOperatorSliceLabel;
  const enforcedByBackend = options.enforcedByBackend ?? sliceLabel === session.protectedOperatorSliceLabel;
  const state =
    sliceLabel === session.protectedOperatorSliceLabel
      ? session.protectedOperatorUiState
      : session.bootstrapState === "unavailable"
        ? "disabled"
        : session.bootstrapState === "active"
          ? "enabled"
          : "bypassed";

  const message =
    state === "enabled"
      ? enforcedByBackend
        ? "Protected operator action is enabled with forwarded auth available."
        : "Guarded operator UI is enabled for this bounded slice."
      : state === "bypassed"
        ? session.bootstrapState === "degraded"
          ? "Frontend auth config is degraded, so the guarded operator UI is staying on the safe local bypass path."
          : "Protected operator UI is bypassed because auth is disabled or local mode is active."
        : "Protected operator action is unavailable until a forwarded auth session is present.";

  return {
    sliceLabel,
    enforcedByBackend,
    state,
    enabled: state !== "disabled",
    message,
    warnings: [...session.warnings]
  };
}

export function formatFrontendSessionLabel(
  session: FrontendSessionBootstrapStatus
): string {
  return `${session.effectiveMode} / ${session.bootstrapState}`;
}
