import type { FrontendRuntimeDiagnostics } from "@aquapulse/types";

export function RuntimeDiagnosticsCard({
  diagnostics,
  title = "Runtime Diagnostics"
}: {
  diagnostics: FrontendRuntimeDiagnostics;
  title?: string;
}) {
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
    </section>
  );
}
