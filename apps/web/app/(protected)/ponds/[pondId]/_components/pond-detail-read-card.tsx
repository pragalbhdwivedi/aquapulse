import type { FrontendSessionBootstrapStatus, PondSummary } from "@aquapulse/types";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveNonAlertReadAccessSummary,
  deriveProtectedReadUiGuard
} from "@web/features/auth-session";

interface PondDetailReadCardProps {
  readonly pondPreview: PondSummary;
  readonly pondDetail?: PondSummary;
  readonly session: FrontendSessionBootstrapStatus;
}

export function PondDetailReadCard({
  pondPreview,
  pondDetail,
  session
}: PondDetailReadCardProps) {
  const readGuard = deriveProtectedReadUiGuard(session, {
    sliceLabel: session.tertiaryNonAlertsReadGuardedSliceLabel ?? "ponds_detail_read",
    enforcedByBackend: session.tertiaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const readSummary = deriveNonAlertReadAccessSummary(session);
  const operatorSummary = deriveNonAlertOperatorAccessSummary(session);
  const displayedPond = pondDetail ?? pondPreview;
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Pond Detail Access</h2>
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
          Pond detail auth: {readGuard.sliceLabel} / {readGuard.state}
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
        Pond: {displayedPond.name} / Code: {displayedPond.code}
        {pondDetail ? "" : " (bounded preview only while detail read is blocked or unavailable)"}
      </p>
      <p style={{ margin: 0 }}>
        Type: {displayedPond.kind} / Status: {displayedPond.status}
      </p>
      {!pondDetail && !readGuard.enabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Pond detail read is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded non-alert read can load the full single-record detail surface.
        </p>
      ) : null}
      {!pondDetail && readSummary.accessState === "degraded" ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          Pond detail read is staying readable through the bounded preview path because auth/session
          configuration is degraded.
        </p>
      ) : null}
    </section>
  );
}
