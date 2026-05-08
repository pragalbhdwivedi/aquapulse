import type {
  FrontendSessionBootstrapStatus,
  WaterQualityReading
} from "@aquapulse/types";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveNonAlertReadAccessSummary,
  deriveProtectedReadUiGuard
} from "@web/features/auth-session";

interface WaterQualityDetailReadCardProps {
  readonly readingPreview: WaterQualityReading;
  readonly readingDetail?: WaterQualityReading;
  readonly session: FrontendSessionBootstrapStatus;
}

export function WaterQualityDetailReadCard({
  readingPreview,
  readingDetail,
  session
}: WaterQualityDetailReadCardProps) {
  const readGuard = deriveProtectedReadUiGuard(session, {
    sliceLabel: session.nonAlertsReadGuardedSliceLabel ?? "water_quality_detail_read",
    enforcedByBackend: session.nonAlertsReadGuardedSliceEnforced ?? false
  });
  const readSummary = deriveNonAlertReadAccessSummary(session);
  const operatorSummary = deriveNonAlertOperatorAccessSummary(session);
  const displayedReading = readingDetail ?? readingPreview;
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Latest Water-Quality Detail</h2>
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
          Water-quality detail auth: {readGuard.sliceLabel} / {readGuard.state}
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
        <span style={{ color: "#94a3b8" }}>
          Paired mutation summary: {operatorSummary.label} / {operatorSummary.accessState}
        </span>
      </div>
      <p style={{ margin: 0 }}>
        Recorded at: {displayedReading.recordedAt}
        {readingDetail ? "" : " (bounded preview only while detail read is blocked or unavailable)"}
      </p>
      <p style={{ margin: 0 }}>
        Temperature: {displayedReading.temperatureC ?? "n/a"} C / pH: {displayedReading.ph ?? "n/a"}
      </p>
      {!readingDetail && !readGuard.enabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Water-quality detail read is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded non-alert read can load the full single-record detail surface.
        </p>
      ) : null}
      {!readingDetail && readSummary.accessState === "degraded" ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          Water-quality detail read is staying readable through the bounded preview path because auth/session
          configuration is degraded.
        </p>
      ) : null}
    </section>
  );
}
