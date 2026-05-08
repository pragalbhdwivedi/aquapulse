import type {
  BackendRuntimeProbeDiagnostics,
  FrontendRuntimeDiagnostics
} from "@aquapulse/types";
import { describeAlertsLiveUpdatesState } from "@web/features/alerts-live-updates";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard,
  deriveProtectedReadUiGuard,
  describeAuthAlignedSurface
} from "@web/features/auth-session";
import {
  deriveAlertsEndToEndRuntimeStatus,
  deriveFeedEndToEndRuntimeStatus,
  derivePondsEndToEndRuntimeStatus,
  deriveTasksEndToEndRuntimeStatus,
  deriveWaterQualityEndToEndRuntimeStatus
} from "@web/features/runtime-diagnostics";

export function RuntimeDiagnosticsCard({
  diagnostics,
  backendProbe,
  title = "Runtime Diagnostics"
}: {
  diagnostics: FrontendRuntimeDiagnostics;
  backendProbe?: BackendRuntimeProbeDiagnostics;
  title?: string;
}) {
  const alertsEndToEnd = deriveAlertsEndToEndRuntimeStatus(diagnostics, backendProbe);
  const feedEndToEnd = deriveFeedEndToEndRuntimeStatus(diagnostics, backendProbe);
  const pondsEndToEnd = derivePondsEndToEndRuntimeStatus(diagnostics, backendProbe);
  const tasksEndToEnd = deriveTasksEndToEndRuntimeStatus(diagnostics, backendProbe);
  const waterQualityEndToEnd = deriveWaterQualityEndToEndRuntimeStatus(diagnostics, backendProbe);
  const alertsLiveUpdatesStatus = describeAlertsLiveUpdatesState(
    diagnostics.alertsLiveUpdates,
    diagnostics.alertsLiveUpdates.connectionState
  );
  const listReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.protectedReadGuardedSliceLabel,
    enforcedByBackend: diagnostics.session.protectedReadGuardedSliceEnforced
  });
  const detailReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.secondaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.secondaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.secondaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.secondaryProtectedReadSliceEnforced
  });
  const summaryReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.tertiaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.tertiaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.tertiaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.tertiaryProtectedReadSliceEnforced
  });
  const listReadSurface = describeAuthAlignedSurface({
    surfaceLabel:
      diagnostics.auth.protectedReadSliceLabel ??
      diagnostics.session.protectedReadGuardedSliceLabel ??
      "alerts_list_read",
    exposure: "backend_protected",
    guard: listReadGuard,
    session: diagnostics.session
  });
  const detailReadSurface = describeAuthAlignedSurface({
    surfaceLabel:
      diagnostics.auth.secondaryProtectedReadSliceLabel ??
      diagnostics.session.secondaryProtectedReadGuardedSliceLabel ??
      "alerts_detail_read",
    exposure: "backend_protected",
    guard: detailReadGuard,
    session: diagnostics.session
  });
  const summaryReadSurface = describeAuthAlignedSurface({
    surfaceLabel:
      diagnostics.auth.tertiaryProtectedReadSliceLabel ??
      diagnostics.session.tertiaryProtectedReadGuardedSliceLabel ??
      "alerts_summary_read",
    exposure: "backend_protected",
    guard: summaryReadGuard,
    session: diagnostics.session
  });
  const lifecycleSurface = describeAuthAlignedSurface({
    surfaceLabel: diagnostics.auth.protectedOperatorSliceLabel,
    exposure: "ui_guarded",
    guard: deriveProtectedOperatorUiGuard(diagnostics.session),
    session: diagnostics.session
  });
  const nonAlertOperatorSummary = deriveNonAlertOperatorAccessSummary(diagnostics.session);

  return (
    <section
      style={{
        display: "grid",
        gap: "0.65rem",
        padding: "0.9rem",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "0.75rem"
      }}
    >
      <strong>{title}</strong>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
        <span>Global runtime: {diagnostics.mode.effectiveMode}</span>
        <span>Auth runtime: {diagnostics.auth.effectiveMode}</span>
        <span>Session bootstrap: {diagnostics.session.bootstrapState}</span>
        <span>Session source: {diagnostics.session.sourceOfTruth}</span>
        <span>Auth verification: {diagnostics.auth.verificationState}</span>
        <span>Alerts runtime: {diagnostics.alerts.effectiveMode}</span>
        <span>Ponds runtime: {diagnostics.ponds.effectiveMode}</span>
        <span>Feed runtime: {diagnostics.feed.effectiveMode}</span>
        <span>Tasks runtime: {diagnostics.tasks.effectiveMode}</span>
        <span>Water-quality runtime: {diagnostics.waterQuality.effectiveMode}</span>
        <span>Alerts transport: {diagnostics.alerts.transport}</span>
        <span>Alerts live updates: {alertsLiveUpdatesStatus.label}</span>
        <span>Ponds transport: {diagnostics.ponds.transport}</span>
        <span>Feed transport: {diagnostics.feed.transport}</span>
        <span>Tasks transport: {diagnostics.tasks.transport}</span>
        <span>Water-quality transport: {diagnostics.waterQuality.transport}</span>
        <span>Fallbacks active: {diagnostics.mode.safeFallbackActive ? "yes" : "no"}</span>
      </div>
      <div style={{ display: "grid", gap: "0.25rem", color: "#94a3b8" }}>
        <span>
          Auth requested/effective: {diagnostics.auth.requestedMode} / {diagnostics.auth.effectiveMode}
        </span>
        <span>
          Auth active: {diagnostics.auth.active ? "yes" : "no"} / Bypass active:{" "}
          {diagnostics.auth.bypassActive ? "yes" : "no"}
        </span>
        <span>
          Session present: {diagnostics.session.sessionPresent ? "yes" : "no"} / Forwarded auth:{" "}
          {diagnostics.session.forwardedAuthPresent ? "yes" : "no"}
        </span>
        <span>
          Current-session endpoint: {diagnostics.session.currentSessionEndpointStatus} / Available:{" "}
          {diagnostics.session.currentSessionAvailable ? "yes" : "no"}
        </span>
        <span>
          Session availability: {diagnostics.session.availabilityState}
          {diagnostics.session.currentUser
            ? ` / User: ${diagnostics.session.currentUser.displayName ?? diagnostics.session.currentUser.username ?? diagnostics.session.currentUser.id} / Alerts access: ${diagnostics.session.currentUser.alertsAccessLevel} (${diagnostics.session.currentUser.alertsAccessSource})`
            : ""}
        </span>
        <span>
          Session bootstrap enabled: {diagnostics.session.bootstrapEnabled ? "yes" : "no"} / UI state:{" "}
          {diagnostics.session.protectedOperatorUiState}
        </span>
        <span>
          Auth provider target: {diagnostics.auth.issuerLabel}
          {diagnostics.auth.realm ? ` / realm ${diagnostics.auth.realm}` : ""}
          {diagnostics.auth.clientId ? ` / client ${diagnostics.auth.clientId}` : ""}
        </span>
        <span>Auth JWKS target: {diagnostics.auth.jwksLabel}</span>
        <span>
          First protected slice: {diagnostics.auth.firstProtectedSliceLabel} / Enforced:{" "}
          {diagnostics.auth.firstProtectedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Protected list read slice: {diagnostics.auth.protectedReadSliceLabel ?? diagnostics.session.protectedReadGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.protectedReadSliceEnforced || diagnostics.session.protectedReadGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Protected detail read slice: {diagnostics.auth.secondaryProtectedReadSliceLabel ?? diagnostics.session.secondaryProtectedReadGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.secondaryProtectedReadSliceEnforced || diagnostics.session.secondaryProtectedReadGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Protected summary read slice: {diagnostics.auth.tertiaryProtectedReadSliceLabel ?? diagnostics.session.tertiaryProtectedReadGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.tertiaryProtectedReadSliceEnforced || diagnostics.session.tertiaryProtectedReadGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Protected operator slice: {diagnostics.auth.protectedOperatorSliceLabel} / Enforced:{" "}
          {diagnostics.auth.protectedOperatorSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Secondary operator slice: {diagnostics.auth.secondaryProtectedSliceLabel ?? diagnostics.session.secondaryGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.secondaryProtectedSliceEnforced || diagnostics.session.secondaryGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Third operator slice: {diagnostics.auth.tertiaryProtectedSliceLabel ?? diagnostics.session.tertiaryGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.tertiaryProtectedSliceEnforced || diagnostics.session.tertiaryGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Fourth operator slice: {diagnostics.auth.quaternaryProtectedSliceLabel ?? diagnostics.session.quaternaryGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.quaternaryProtectedSliceEnforced || diagnostics.session.quaternaryGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Non-alert operator summary: {diagnostics.auth.nonAlertsOperatorAccessSummaryLabel ?? diagnostics.session.nonAlertsOperatorAccessSummaryLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.nonAlertsOperatorAccessSummaryEnforced || diagnostics.session.nonAlertsOperatorAccessSummaryEnforced ? "yes" : "no"}
        </span>
        <span>
          Non-alert operator shared state: {nonAlertOperatorSummary.accessState} / Current-session sufficient:{" "}
          {nonAlertOperatorSummary.currentSessionSufficient ? "yes" : "no"} / Forwarding: {nonAlertOperatorSummary.forwardingState}
        </span>
        <span>
          Non-alert protected slice: {diagnostics.auth.nonAlertsProtectedSliceLabel ?? diagnostics.session.nonAlertsGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.nonAlertsProtectedSliceEnforced || diagnostics.session.nonAlertsGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Second non-alert protected slice: {diagnostics.auth.secondaryNonAlertsProtectedSliceLabel ?? diagnostics.session.secondaryNonAlertsGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.secondaryNonAlertsProtectedSliceEnforced || diagnostics.session.secondaryNonAlertsGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Third non-alert protected slice: {diagnostics.auth.tertiaryNonAlertsProtectedSliceLabel ?? diagnostics.session.tertiaryNonAlertsGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.tertiaryNonAlertsProtectedSliceEnforced || diagnostics.session.tertiaryNonAlertsGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Fourth non-alert protected slice: {diagnostics.auth.quaternaryNonAlertsProtectedSliceLabel ?? diagnostics.session.quaternaryNonAlertsGuardedSliceLabel ?? "none"} / Enforced:{" "}
          {diagnostics.auth.quaternaryNonAlertsProtectedSliceEnforced || diagnostics.session.quaternaryNonAlertsGuardedSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Forwarded auth: {diagnostics.auth.forwardedAuthPresent ? "present" : "absent"} / Mode:{" "}
          {diagnostics.auth.forwardingMode}
        </span>
        <span>
          Alerts list read access: {listReadGuard.state} / {listReadGuard.message}
        </span>
        <span>
          Alerts detail read access: {detailReadGuard.state} / {detailReadGuard.message}
        </span>
        <span>
          Alerts summary read access: {summaryReadGuard.state} / {summaryReadGuard.message}
        </span>
        <span>
          Backend-protected reads: {listReadSurface.surfaceLabel} ({listReadSurface.accessState}),{" "}
          {detailReadSurface.surfaceLabel} ({detailReadSurface.accessState}),{" "}
          {summaryReadSurface.surfaceLabel} ({summaryReadSurface.accessState})
        </span>
        <span>
          UI-guarded operator surface: {lifecycleSurface.surfaceLabel} ({lifecycleSurface.accessState})
        </span>
        <span>Local auth user label: {diagnostics.auth.localDevUserLabel}</span>
        <span>Alerts scope: {diagnostics.alerts.scopeLabel}</span>
        <span>Alerts target: {diagnostics.alerts.targetLabel}</span>
        <span>Alerts live target: {diagnostics.alertsLiveUpdates.targetLabel}</span>
        <span>Alerts live transport: {diagnostics.alertsLiveUpdates.subscriptionTransport}</span>
        <span>Alerts live credential mode: {diagnostics.alertsLiveUpdates.credentialMode}</span>
        <span>Alerts live auth mode: {diagnostics.alertsLiveUpdates.authMode}</span>
        <span>Alerts live subscription: {diagnostics.alertsLiveUpdates.subscriptionAuthState}</span>
        <span>Alerts live websocket auth configured: {diagnostics.alertsLiveUpdates.websocketAuthConfigured ? "yes" : "no"}</span>
        <span>
          Alerts live bootstrap: {diagnostics.alertsLiveUpdates.proxyBootstrapPathLabel ?? "not used"} / Available:{" "}
          {diagnostics.alertsLiveUpdates.proxyBootstrapAvailable ? "yes" : "no"}
        </span>
        <span>Alerts live current-session sufficient: {diagnostics.alertsLiveUpdates.currentSessionSufficient ? "yes" : "no"}</span>
        <span>Alerts live fallback: {diagnostics.alertsLiveUpdates.fallbackMode.replace("_", " ")}</span>
        <span>Alerts live status: {alertsLiveUpdatesStatus.helperText}</span>
        <span>Ponds scope: {diagnostics.ponds.scopeLabel}</span>
        <span>Ponds target: {diagnostics.ponds.targetLabel}</span>
        <span>Feed scope: {diagnostics.feed.scopeLabel}</span>
        <span>Feed target: {diagnostics.feed.targetLabel}</span>
        <span>Tasks scope: {diagnostics.tasks.scopeLabel}</span>
        <span>Tasks target: {diagnostics.tasks.targetLabel}</span>
        <span>Water-quality scope: {diagnostics.waterQuality.scopeLabel}</span>
        <span>Water-quality target: {diagnostics.waterQuality.targetLabel}</span>
        <span>Local bridge target: {diagnostics.localBridge.backendTargetLabel}</span>
        <span>Alerts cutover status: {alertsEndToEnd.statusLabel}</span>
        <span>Ponds cutover status: {pondsEndToEnd.statusLabel}</span>
        <span>Feed cutover status: {feedEndToEnd.statusLabel}</span>
        <span>Tasks cutover status: {tasksEndToEnd.statusLabel}</span>
        <span>Water-quality cutover status: {waterQualityEndToEnd.statusLabel}</span>
      </div>
      <div style={{ display: "grid", gap: "0.25rem", color: "#cbd5e1" }}>
        <span>
          Backend probe:{" "}
          {backendProbe
            ? backendProbe.status === "reachable"
              ? "reachable"
              : backendProbe.status === "partial"
                ? "partially reachable"
                : backendProbe.status === "unreachable"
                  ? "not reached"
                  : "disabled"
            : "not requested"}
        </span>
        {backendProbe ? <span>Probe target: {backendProbe.targetLabel}</span> : null}
        {backendProbe?.checkedAt ? <span>Last probe: {backendProbe.checkedAt}</span> : null}
        {backendProbe?.health ? (
          <span>
            Backend health: {backendProbe.health.status} ({backendProbe.health.runtime.mode.effectiveMode})
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend auth: {backendProbe.runtime.auth?.effectiveMode ?? "disabled"} / Requested:{" "}
            {backendProbe.runtime.auth?.requestedMode ?? "disabled"} / Active:{" "}
            {backendProbe.runtime.auth?.active ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend auth validation: {backendProbe.runtime.auth.validationStrategy} / Token mode:{" "}
            {backendProbe.runtime.auth.tokenValidation}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend auth verification: {backendProbe.runtime.auth.verificationStatus} / Available:{" "}
            {backendProbe.runtime.auth.verificationAvailable ? "yes" : "no"} / Last check:{" "}
            {backendProbe.runtime.auth.lastVerificationAt ?? "not yet attempted"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend protected slice: {backendProbe.runtime.auth.firstProtectedSliceLabel} / Enforced:{" "}
            {backendProbe.runtime.auth.firstProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend protected list read slice: {backendProbe.runtime.auth.protectedReadSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.protectedReadSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend protected detail read slice: {backendProbe.runtime.auth.secondaryProtectedReadSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.secondaryProtectedReadSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend protected summary read slice: {backendProbe.runtime.auth.tertiaryProtectedReadSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.tertiaryProtectedReadSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend operator slice: {backendProbe.runtime.auth.protectedOperatorSliceLabel} / Enforced:{" "}
            {backendProbe.runtime.auth.protectedOperatorSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend secondary operator slice: {backendProbe.runtime.auth.secondaryProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.secondaryProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend third operator slice: {backendProbe.runtime.auth.tertiaryProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.tertiaryProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend fourth operator slice: {backendProbe.runtime.auth.quaternaryProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.quaternaryProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend non-alert operator summary: {backendProbe.runtime.auth.nonAlertsOperatorAccessSummaryLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.nonAlertsOperatorAccessSummaryEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend non-alert protected slice: {backendProbe.runtime.auth.nonAlertsProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.nonAlertsProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend second non-alert protected slice: {backendProbe.runtime.auth.secondaryNonAlertsProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.secondaryNonAlertsProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend third non-alert protected slice: {backendProbe.runtime.auth.tertiaryNonAlertsProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.tertiaryNonAlertsProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.auth ? (
          <span>
            Backend fourth non-alert protected slice: {backendProbe.runtime.auth.quaternaryNonAlertsProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {backendProbe.runtime.auth.quaternaryNonAlertsProtectedSliceEnforced ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend DB: {backendProbe.runtime.database.selectedAdapter} / {backendProbe.runtime.database.connectivity.status}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend alerts adapter: {backendProbe.runtime.alerts.effectiveAdapter} / Requested: {backendProbe.runtime.alerts.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.alerts.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates ? (
          <span>
            Backend alerts live bootstrap: {backendProbe.runtime.alertsLiveUpdates.ticketBootstrapPath} / Ticket TTL:{" "}
            {backendProbe.runtime.alertsLiveUpdates.ticketTtlSeconds}s / Credential mode:{" "}
            {backendProbe.runtime.alertsLiveUpdates.credentialMode}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates ? (
          <span>
            Backend alerts live gateway: {backendProbe.runtime.alertsLiveUpdates.enabled ? "enabled" : "disabled"} / Attached: {backendProbe.runtime.alertsLiveUpdates.gatewayAttached ? "yes" : "no"} / Connections: {backendProbe.runtime.alertsLiveUpdates.activeConnections}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates ? (
          <span>
            Backend alerts live subscription policy: {backendProbe.runtime.alertsLiveUpdates.subscriptionPolicy} / Authenticated connections: {backendProbe.runtime.alertsLiveUpdates.authenticatedConnections} / Bypassed connections: {backendProbe.runtime.alertsLiveUpdates.bypassedConnections}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates ? (
          <span>
            Backend alerts live state: {!backendProbe.runtime.alertsLiveUpdates.enabled
              ? "disabled"
              : !backendProbe.runtime.alertsLiveUpdates.gatewayAttached
                ? "pending_attach"
                : backendProbe.runtime.alertsLiveUpdates.activeConnections > 0
                  ? "active"
                  : "idle"}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates ? (
          <span>
            Backend alerts live path: {backendProbe.runtime.alertsLiveUpdates.gatewayPath}
            {backendProbe.runtime.alertsLiveUpdates.lastEventAt
              ? ` / Last event: ${backendProbe.runtime.alertsLiveUpdates.lastEventAt}`
              : ""}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates?.lastSubscriptionState ? (
          <span>
            Backend last live subscription: {backendProbe.runtime.alertsLiveUpdates.lastSubscriptionState}
            {backendProbe.runtime.alertsLiveUpdates.lastSubscriptionAt
              ? ` / ${backendProbe.runtime.alertsLiveUpdates.lastSubscriptionAt}`
              : ""}
            {backendProbe.runtime.alertsLiveUpdates.lastSubscriptionReason
              ? ` / ${backendProbe.runtime.alertsLiveUpdates.lastSubscriptionReason}`
              : ""}
          </span>
        ) : null}
        {backendProbe?.runtime?.alertsLiveUpdates?.lastTicketIssuedState ? (
          <span>
            Backend last live ticket: {backendProbe.runtime.alertsLiveUpdates.lastTicketIssuedState}
            {backendProbe.runtime.alertsLiveUpdates.lastTicketIssuedAt
              ? ` / ${backendProbe.runtime.alertsLiveUpdates.lastTicketIssuedAt}`
              : ""}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend ponds adapter: {backendProbe.runtime.ponds?.effectiveAdapter ?? "unknown"} / Requested: {backendProbe.runtime.ponds?.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.ponds?.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend feed adapter: {backendProbe.runtime.feed?.effectiveAdapter ?? "unknown"} / Requested: {backendProbe.runtime.feed?.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.feed?.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime?.tasks ? (
          <span>
            Backend tasks adapter: {backendProbe.runtime.tasks.effectiveAdapter} / Requested: {backendProbe.runtime.tasks.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.tasks.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend water-quality adapter: {backendProbe.runtime.waterQuality.effectiveAdapter} / Requested: {backendProbe.runtime.waterQuality.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.waterQuality.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Local bridges: {backendProbe.runtime.alerts.localBridgeExpectedPath}, /api/ponds, {backendProbe.runtime.feed?.localBridgeExpectedPath ?? "/api/feed"}, /api/tasks, and {backendProbe.runtime.alerts.localAiExplainBridgeExpectedPath}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            AI explanations: {backendProbe.runtime.aiExplanations.mode} / {backendProbe.runtime.aiExplanations.configured ? "configured" : "fallback only"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            AI cache: {backendProbe.runtime.aiExplanations.cacheEnabled ? "enabled" : "disabled"} / Manual attach: {backendProbe.runtime.aiExplanations.attachmentAvailable ? "available" : "unavailable"} / Feedback: {backendProbe.runtime.aiExplanations.feedbackEnabled ? "enabled" : "disabled"}
          </span>
        ) : null}
        {backendProbe?.errorMessage ? (
          <span style={{ color: "#fca5a5" }}>{backendProbe.errorMessage}</span>
        ) : null}
      </div>
      {diagnostics.warnings.length > 0 ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {diagnostics.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : (
        <span style={{ color: "#86efac" }}>Runtime config is using safe defaults with no active warnings.</span>
      )}
      {backendProbe?.runtime?.alerts.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.alerts.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.runtime?.auth?.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.auth.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.runtime?.alertsLiveUpdates?.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.alertsLiveUpdates.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.runtime?.ponds?.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.ponds.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.runtime?.feed?.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.feed.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.runtime?.tasks?.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.tasks.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.runtime?.waterQuality.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.runtime.waterQuality.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
      {backendProbe?.warnings.length ? (
        <div style={{ display: "grid", gap: "0.25rem", color: "#fbbf24" }}>
          {backendProbe.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`}>{warning.message}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
