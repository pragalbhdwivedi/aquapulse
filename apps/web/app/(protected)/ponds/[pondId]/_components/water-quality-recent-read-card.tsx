import type {
  FrontendSessionBootstrapStatus,
  ListResponse,
  WaterQualityReading
} from "@aquapulse/types";
import {
  deriveNonAlertReadAccessSummary,
  deriveProtectedReadUiGuard
} from "@web/features/auth-session";

interface WaterQualityRecentReadCardProps {
  readonly readings?: ListResponse<WaterQualityReading>;
  readonly session: FrontendSessionBootstrapStatus;
}

export function WaterQualityRecentReadCard({
  readings,
  session
}: WaterQualityRecentReadCardProps) {
  const readGuard = deriveProtectedReadUiGuard(session, {
    sliceLabel: session.quinaryNonAlertsReadGuardedSliceLabel ?? "water_quality_recent_read",
    enforcedByBackend: session.quinaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const readSummary = deriveNonAlertReadAccessSummary(session);
  const latestReading = readings?.items[0];
  const readStatusLabel =
    readSummary.accessState === "available"
      ? "read available"
      : readSummary.accessState === "bypassed_local"
        ? "read allowed in disabled/local modes"
        : readSummary.accessState === "degraded"
          ? "read on degraded local-bypass path"
          : "read protected/auth-required";

  return (
    <section
      style={{
        display: "grid",
        gap: "0.5rem",
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "0.75rem"
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Recent Water-Quality Readings</h2>
      <p style={{ margin: 0, color: "#94a3b8" }}>
        Use recent history to decide whether the latest reading is enough context or whether this pond needs a new reading before any manual update.
      </p>
      <div
        style={{
          display: "grid",
          gap: "0.25rem",
          padding: "0.65rem 0.8rem",
          borderRadius: "0.65rem",
          background: "rgba(30, 41, 59, 0.45)",
          color: "#cbd5e1"
        }}
      >
        <span>
          Water-quality recent access: {readGuard.sliceLabel} / {readGuard.state}
        </span>
        <span style={{ color: readGuard.enabled ? "#94a3b8" : "#fca5a5" }}>
          Non-alert read summary: {readSummary.label} / {readStatusLabel}
        </span>
        <span style={{ color: readGuard.enabled ? "#94a3b8" : "#fca5a5" }}>
          {readSummary.message}
        </span>
        <span style={{ color: "#94a3b8" }}>
          Current-session sufficient: {readSummary.currentSessionSufficient ? "yes" : "no"} /
          Forwarding: {readSummary.forwardingState}
        </span>
      </div>
      <p style={{ margin: 0 }}>
        Recent readings loaded: {readings?.items.length ?? 0}
        {latestReading ? ` / Latest recorded at: ${latestReading.recordedAt}` : ""}
      </p>
      {readings?.items.length ? (
        <div style={{ display: "grid", gap: "0.35rem", color: "#cbd5e1" }}>
          {readings.items.slice(0, 3).map((reading) => (
            <span key={reading.id}>
              {reading.recordedAt}: Temp {reading.temperatureC ?? "n/a"} C / pH {reading.ph ?? "n/a"}
            </span>
          ))}
        </div>
      ) : null}
      {!readings && readGuard.enabled ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          No recent history is visible on this load. That can mean the protected recent-read path returned no data or the bounded fetch was unavailable for this request.
        </p>
      ) : null}
      {!readings && !readGuard.enabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Recent water-quality reads are backend-protected in active auth mode. Forwarded auth and
          a resolved current-session must be available before this bounded recent-history surface can
          load.
        </p>
      ) : null}
      {!readings && readSummary.accessState === "degraded" ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          Recent water-quality reads are staying off the protected path because auth/session
          configuration is degraded. This is a safe limited state, not an unexpected failure.
        </p>
      ) : null}
    </section>
  );
}
