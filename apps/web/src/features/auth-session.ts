import type {
  CurrentSessionPayload,
  FrontendAuthRuntimeDiagnostics,
  FrontendSessionBootstrapStatus,
  RuntimeWarning
} from "@aquapulse/types";

export interface ProtectedSurfaceUiGuard {
  readonly sliceLabel: string;
  readonly enforcedByBackend: boolean;
  readonly state: FrontendSessionBootstrapStatus["protectedOperatorUiState"];
  readonly enabled: boolean;
  readonly message: string;
  readonly warnings: readonly RuntimeWarning[];
}

export type ProtectedOperatorUiGuard = ProtectedSurfaceUiGuard;
export type ProtectedReadUiGuard = ProtectedSurfaceUiGuard;

export interface AuthAlignedSurfaceDescriptor {
  readonly surfaceLabel: string;
  readonly exposure: "public_readable" | "backend_protected" | "ui_guarded";
  readonly accessState: "available" | "auth_required" | "bypassed_local" | "degraded";
  readonly message: string;
}

export function deriveFrontendSessionBootstrap(
  auth: FrontendAuthRuntimeDiagnostics,
  options: {
    readonly currentSession?: CurrentSessionPayload;
    readonly currentSessionEndpointStatus?: FrontendSessionBootstrapStatus["currentSessionEndpointStatus"];
  } = {}
): FrontendSessionBootstrapStatus {
  const currentSessionEndpointStatus = options.currentSessionEndpointStatus ?? "not_requested";
  const currentSession = options.currentSession;
  const bootstrapState: FrontendSessionBootstrapStatus["bootstrapState"] = currentSession
    ? currentSession.availabilityState === "authenticated_user"
      ? "active"
      : currentSession.availabilityState === "local_user" || currentSession.availabilityState === "disabled"
        ? "bypassed"
        : currentSession.availabilityState === "degraded"
          ? "degraded"
          : "unavailable"
    : auth.effectiveMode === "keycloak"
      ? auth.forwardingActive
        ? "active"
        : "unavailable"
      : auth.requestedMode === "keycloak" && auth.effectiveMode === "disabled"
        ? "degraded"
        : "bypassed";
  const warnings = [...auth.warnings, ...(currentSession?.warnings ?? [])];

  if (currentSessionEndpointStatus === "unreachable") {
    warnings.push({
      code: "CURRENT_SESSION_ENDPOINT_UNREACHABLE",
      message:
        "The backend current-session endpoint could not be reached, so the frontend is using runtime-derived auth state."
    });
  }

  if (currentSessionEndpointStatus === "degraded") {
    warnings.push({
      code: "CURRENT_SESSION_ENDPOINT_DEGRADED",
      message:
        "The backend current-session endpoint responded unexpectedly, so the frontend is using runtime-derived auth state."
    });
  }

  return {
    bootstrapEnabled: true,
    bootstrapState,
    sourceOfTruth: currentSession ? "backend_session" : "runtime_derived",
    currentSessionEndpointStatus,
    currentSessionAvailable: Boolean(currentSession),
    availabilityState:
      currentSession?.availabilityState ??
      (auth.requestedMode === "keycloak" && auth.effectiveMode === "disabled"
        ? "degraded"
        : auth.effectiveMode === "keycloak"
          ? auth.forwardedAuthPresent
            ? "authenticated_user"
            : "unauthenticated"
          : auth.effectiveMode === "local"
            ? "local_user"
            : "disabled"),
    requestedMode: auth.requestedMode,
    effectiveMode: auth.effectiveMode,
    sessionPresent:
      currentSession?.sessionPresent ??
      (auth.effectiveMode === "keycloak" ? auth.forwardedAuthPresent : true),
    forwardedAuthPresent: auth.forwardedAuthPresent,
    forwardingActive: auth.forwardingActive,
    forwardingMode: auth.forwardingMode,
    protectedReadGuardedSliceLabel:
      currentSession?.protectedReadSliceLabel ?? auth.protectedReadSliceLabel,
    protectedReadGuardedSliceEnforced:
      currentSession?.protectedReadSliceEnforced ?? auth.protectedReadSliceEnforced,
    secondaryProtectedReadGuardedSliceLabel:
      currentSession?.secondaryProtectedReadSliceLabel ?? auth.secondaryProtectedReadSliceLabel,
    secondaryProtectedReadGuardedSliceEnforced:
      currentSession?.secondaryProtectedReadSliceEnforced ??
      auth.secondaryProtectedReadSliceEnforced,
    tertiaryProtectedReadGuardedSliceLabel:
      currentSession?.tertiaryProtectedReadSliceLabel ?? auth.tertiaryProtectedReadSliceLabel,
    tertiaryProtectedReadGuardedSliceEnforced:
      currentSession?.tertiaryProtectedReadSliceEnforced ??
      auth.tertiaryProtectedReadSliceEnforced,
    protectedOperatorSliceLabel: auth.protectedOperatorSliceLabel,
    protectedOperatorUiState:
      bootstrapState === "active"
        ? "enabled"
        : bootstrapState === "bypassed" || bootstrapState === "degraded"
          ? "bypassed"
          : "disabled",
    secondaryGuardedSliceLabel:
      currentSession?.secondaryProtectedSliceLabel ?? auth.secondaryProtectedSliceLabel,
    secondaryGuardedSliceEnforced:
      currentSession?.secondaryProtectedSliceEnforced ?? auth.secondaryProtectedSliceEnforced,
    tertiaryGuardedSliceLabel:
      currentSession?.tertiaryProtectedSliceLabel ?? auth.tertiaryProtectedSliceLabel,
    tertiaryGuardedSliceEnforced:
      currentSession?.tertiaryProtectedSliceEnforced ?? auth.tertiaryProtectedSliceEnforced,
    quaternaryGuardedSliceLabel:
      currentSession?.quaternaryProtectedSliceLabel ?? auth.quaternaryProtectedSliceLabel,
    quaternaryGuardedSliceEnforced:
      currentSession?.quaternaryProtectedSliceEnforced ?? auth.quaternaryProtectedSliceEnforced,
    nonAlertsOperatorAccessSummaryLabel:
      currentSession?.nonAlertsOperatorAccessSummaryLabel ?? auth.nonAlertsOperatorAccessSummaryLabel,
    nonAlertsOperatorAccessSummaryEnforced:
      currentSession?.nonAlertsOperatorAccessSummaryEnforced ??
      auth.nonAlertsOperatorAccessSummaryEnforced,
    nonAlertsGuardedSliceLabel:
      currentSession?.nonAlertsProtectedSliceLabel ?? auth.nonAlertsProtectedSliceLabel,
    nonAlertsGuardedSliceEnforced:
      currentSession?.nonAlertsProtectedSliceEnforced ?? auth.nonAlertsProtectedSliceEnforced,
    secondaryNonAlertsGuardedSliceLabel:
      currentSession?.secondaryNonAlertsProtectedSliceLabel ??
      auth.secondaryNonAlertsProtectedSliceLabel,
    secondaryNonAlertsGuardedSliceEnforced:
      currentSession?.secondaryNonAlertsProtectedSliceEnforced ??
      auth.secondaryNonAlertsProtectedSliceEnforced,
    currentUser: currentSession?.user,
    warnings
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
  const isPrimarySlice = sliceLabel === session.protectedOperatorSliceLabel;
  const isSecondarySlice = sliceLabel === session.secondaryGuardedSliceLabel;
  const isTertiarySlice = sliceLabel === session.tertiaryGuardedSliceLabel;
  const isQuaternarySlice = sliceLabel === session.quaternaryGuardedSliceLabel;
  const isNonAlertsSlice = sliceLabel === session.nonAlertsGuardedSliceLabel;
  const isSecondaryNonAlertsSlice = sliceLabel === session.secondaryNonAlertsGuardedSliceLabel;
  const enforcedByBackend =
    options.enforcedByBackend ??
    (isPrimarySlice
      ? true
      : isSecondarySlice
        ? session.secondaryGuardedSliceEnforced
        : isTertiarySlice
          ? session.tertiaryGuardedSliceEnforced
          : isQuaternarySlice
            ? session.quaternaryGuardedSliceEnforced
            : isNonAlertsSlice
              ? session.nonAlertsGuardedSliceEnforced
              : isSecondaryNonAlertsSlice
                ? session.secondaryNonAlertsGuardedSliceEnforced
              : false);
  const state =
    isPrimarySlice
      ? session.protectedOperatorUiState
      : isSecondarySlice && enforcedByBackend
        ? session.bootstrapState === "active"
          ? "enabled"
          : session.bootstrapState === "bypassed" || session.bootstrapState === "degraded"
            ? "bypassed"
            : "disabled"
      : isTertiarySlice && enforcedByBackend
        ? session.bootstrapState === "active"
          ? "enabled"
          : session.bootstrapState === "bypassed" || session.bootstrapState === "degraded"
            ? "bypassed"
            : "disabled"
      : isQuaternarySlice && enforcedByBackend
        ? session.bootstrapState === "active"
          ? "enabled"
          : session.bootstrapState === "bypassed" || session.bootstrapState === "degraded"
            ? "bypassed"
            : "disabled"
      : isNonAlertsSlice && enforcedByBackend
        ? session.bootstrapState === "active"
          ? "enabled"
          : session.bootstrapState === "bypassed" || session.bootstrapState === "degraded"
            ? "bypassed"
            : "disabled"
      : isSecondaryNonAlertsSlice && enforcedByBackend
        ? session.bootstrapState === "active"
          ? "enabled"
          : session.bootstrapState === "bypassed" || session.bootstrapState === "degraded"
            ? "bypassed"
            : "disabled"
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

export function deriveProtectedReadUiGuard(
  session: FrontendSessionBootstrapStatus,
  options: {
    readonly sliceLabel?: string;
    readonly enforcedByBackend?: boolean;
  } = {}
): ProtectedReadUiGuard {
  const sliceLabel = options.sliceLabel ?? session.protectedReadGuardedSliceLabel;
  const isPrimarySlice = sliceLabel === session.protectedReadGuardedSliceLabel;
  const isSecondarySlice = sliceLabel === session.secondaryProtectedReadGuardedSliceLabel;
  const isTertiarySlice = sliceLabel === session.tertiaryProtectedReadGuardedSliceLabel;
  const enforcedByBackend =
    options.enforcedByBackend ??
    (isPrimarySlice
      ? session.protectedReadGuardedSliceEnforced
      : isSecondarySlice
        ? session.secondaryProtectedReadGuardedSliceEnforced
        : isTertiarySlice
          ? session.tertiaryProtectedReadGuardedSliceEnforced
          : false);
  const state =
    enforcedByBackend && session.bootstrapState === "unavailable"
      ? "disabled"
      : session.bootstrapState === "active"
        ? "enabled"
        : session.bootstrapState === "bypassed" || session.bootstrapState === "degraded"
          ? "bypassed"
          : enforcedByBackend
            ? "disabled"
            : "bypassed";

  const message =
    state === "enabled"
      ? enforcedByBackend
        ? "Protected alert read is enabled with forwarded auth available."
        : "Alert read is available because backend auth enforcement is bypassed in this bounded stage."
      : state === "bypassed"
        ? session.bootstrapState === "degraded"
          ? "Frontend auth config is degraded, so the bounded alert read surface is staying on the safe local bypass path."
          : "Alert read remains available because auth is disabled or local mode is active."
        : "Protected alert read is unavailable until a forwarded auth session is present.";

  return {
    sliceLabel: sliceLabel ?? "alerts_read_surface",
    enforcedByBackend,
    state,
    enabled: state !== "disabled",
    message,
    warnings: [...session.warnings]
  };
}

export function describeAuthAlignedSurface(options: {
  readonly surfaceLabel: string;
  readonly exposure: AuthAlignedSurfaceDescriptor["exposure"];
  readonly guard?: ProtectedSurfaceUiGuard;
  readonly session?: FrontendSessionBootstrapStatus;
}): AuthAlignedSurfaceDescriptor {
  const { exposure, guard, session, surfaceLabel } = options;

  if (exposure === "public_readable") {
    return {
      surfaceLabel,
      exposure,
      accessState: "available",
      message: "Surface remains readable in this bounded stage without backend auth enforcement."
    };
  }

  if (!guard) {
    return {
      surfaceLabel,
      exposure,
      accessState: "auth_required",
      message: "Surface classification is protected, but no UI guard state was available."
    };
  }

  if (guard.state === "enabled") {
    return {
      surfaceLabel,
      exposure,
      accessState: "available",
      message: guard.message
    };
  }

  if (guard.state === "bypassed") {
    return {
      surfaceLabel,
      exposure,
      accessState: session?.bootstrapState === "degraded" ? "degraded" : "bypassed_local",
      message: guard.message
    };
  }

  return {
    surfaceLabel,
    exposure,
    accessState: "auth_required",
    message: guard.message
  };
}

export function formatFrontendSessionLabel(
  session: FrontendSessionBootstrapStatus
): string {
  return `${session.effectiveMode} / ${session.bootstrapState}`;
}
