import type {
  BackendRuntimeProbeDiagnostics,
  FrontendRuntimeDiagnostics
} from "@aquapulse/types";
import {
  deriveAlertsEndToEndRuntimeStatus,
  deriveFeedEndToEndRuntimeStatus,
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
  const tasksEndToEnd = deriveTasksEndToEndRuntimeStatus(diagnostics, backendProbe);
  const waterQualityEndToEnd = deriveWaterQualityEndToEndRuntimeStatus(diagnostics, backendProbe);

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
        <span>Auth verification: {diagnostics.auth.verificationState}</span>
        <span>Alerts runtime: {diagnostics.alerts.effectiveMode}</span>
        <span>Feed runtime: {diagnostics.feed.effectiveMode}</span>
        <span>Tasks runtime: {diagnostics.tasks.effectiveMode}</span>
        <span>Water-quality runtime: {diagnostics.waterQuality.effectiveMode}</span>
        <span>Alerts transport: {diagnostics.alerts.transport}</span>
        <span>Alerts live updates: {diagnostics.alertsLiveUpdates.connectionState}</span>
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
          Protected operator slice: {diagnostics.auth.protectedOperatorSliceLabel} / Enforced:{" "}
          {diagnostics.auth.protectedOperatorSliceEnforced ? "yes" : "no"}
        </span>
        <span>
          Forwarded auth: {diagnostics.auth.forwardedAuthPresent ? "present" : "absent"} / Mode:{" "}
          {diagnostics.auth.forwardingMode}
        </span>
        <span>Local auth user label: {diagnostics.auth.localDevUserLabel}</span>
        <span>Alerts scope: {diagnostics.alerts.scopeLabel}</span>
        <span>Alerts target: {diagnostics.alerts.targetLabel}</span>
        <span>Alerts live target: {diagnostics.alertsLiveUpdates.targetLabel}</span>
        <span>Feed scope: {diagnostics.feed.scopeLabel}</span>
        <span>Feed target: {diagnostics.feed.targetLabel}</span>
        <span>Tasks scope: {diagnostics.tasks.scopeLabel}</span>
        <span>Tasks target: {diagnostics.tasks.targetLabel}</span>
        <span>Water-quality scope: {diagnostics.waterQuality.scopeLabel}</span>
        <span>Water-quality target: {diagnostics.waterQuality.targetLabel}</span>
        <span>Local bridge target: {diagnostics.localBridge.backendTargetLabel}</span>
        <span>Alerts cutover status: {alertsEndToEnd.statusLabel}</span>
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
            Backend operator slice: {backendProbe.runtime.auth.protectedOperatorSliceLabel} / Enforced:{" "}
            {backendProbe.runtime.auth.protectedOperatorSliceEnforced ? "yes" : "no"}
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
            Backend alerts live gateway: {backendProbe.runtime.alertsLiveUpdates.enabled ? "enabled" : "disabled"} / Attached: {backendProbe.runtime.alertsLiveUpdates.gatewayAttached ? "yes" : "no"} / Connections: {backendProbe.runtime.alertsLiveUpdates.activeConnections}
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
            Local bridges: {backendProbe.runtime.alerts.localBridgeExpectedPath}, {backendProbe.runtime.feed?.localBridgeExpectedPath ?? "/api/feed"}, /api/tasks, and {backendProbe.runtime.alerts.localAiExplainBridgeExpectedPath}
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
