import type {
  BackendRuntimeProbeDiagnostics,
  FrontendRuntimeDiagnostics
} from "@aquapulse/types";
import { deriveAlertsEndToEndRuntimeStatus } from "@web/features/runtime-diagnostics";

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
        <span>Alerts runtime: {diagnostics.alerts.effectiveMode}</span>
        <span>Alerts transport: {diagnostics.alerts.transport}</span>
        <span>Fallbacks active: {diagnostics.mode.safeFallbackActive ? "yes" : "no"}</span>
      </div>
      <div style={{ display: "grid", gap: "0.25rem", color: "#94a3b8" }}>
        <span>Alerts scope: {diagnostics.alerts.scopeLabel}</span>
        <span>Alerts target: {diagnostics.alerts.targetLabel}</span>
        <span>Local bridge target: {diagnostics.localBridge.backendTargetLabel}</span>
        <span>Alerts cutover status: {alertsEndToEnd.statusLabel}</span>
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
            Backend DB: {backendProbe.runtime.database.selectedAdapter} / {backendProbe.runtime.database.connectivity.status}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend alerts adapter: {backendProbe.runtime.alerts.effectiveAdapter} / Requested: {backendProbe.runtime.alerts.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.alerts.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Backend water-quality adapter: {backendProbe.runtime.waterQuality.effectiveAdapter} / Requested: {backendProbe.runtime.waterQuality.requestedAdapter ?? "default"} / Cutover active: {backendProbe.runtime.waterQuality.cutoverActive ? "yes" : "no"}
          </span>
        ) : null}
        {backendProbe?.runtime ? (
          <span>
            Local bridges: {backendProbe.runtime.alerts.localBridgeExpectedPath} and {backendProbe.runtime.alerts.localAiExplainBridgeExpectedPath}
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
