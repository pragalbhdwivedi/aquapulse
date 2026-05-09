import type { FeedEntry, FrontendSessionBootstrapStatus } from "@aquapulse/types";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveNonAlertReadAccessSummary,
  deriveProtectedReadUiGuard
} from "@web/features/auth-session";

interface FeedDetailReadCardProps {
  readonly entryPreview: FeedEntry;
  readonly entryDetail?: FeedEntry;
  readonly session: FrontendSessionBootstrapStatus;
}

export function FeedDetailReadCard({
  entryPreview,
  entryDetail,
  session
}: FeedDetailReadCardProps) {
  const readGuard = deriveProtectedReadUiGuard(session, {
    sliceLabel: session.secondaryNonAlertsReadGuardedSliceLabel ?? "feed_detail_read",
    enforcedByBackend: session.secondaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const readSummary = deriveNonAlertReadAccessSummary(session);
  const operatorSummary = deriveNonAlertOperatorAccessSummary(session);
  const displayedEntry = entryDetail ?? entryPreview;
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Latest Feed Detail</h2>
      <p style={{ margin: 0, color: "#94a3b8" }}>
        This card shows the best available feed snapshot first, then explains whether the full protected detail surface is available, bypassed locally, or waiting on auth/session state.
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
          Feed detail access: {readGuard.sliceLabel} / {readGuard.state}
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
        Feed type: {displayedEntry.feedType} / Quantity: {displayedEntry.quantityKg} kg
        {entryDetail ? "" : " (bounded preview only while detail read is blocked or unavailable)"}
      </p>
      <p style={{ margin: 0 }}>
        Fed at: {displayedEntry.fedAt} / Batch: {displayedEntry.batchId ?? "n/a"}
      </p>
      <p style={{ margin: 0 }}>
        Pond: {displayedEntry.pondId ?? "n/a"}
      </p>
      <p style={{ margin: 0, color: "#94a3b8" }}>
        What to check next: confirm quantity, time, and pond link before deciding whether the next manual step is a new feed entry or an update to this one.
      </p>
      {!entryDetail && !readGuard.enabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Feed detail read is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded single-record detail surface can load.
        </p>
      ) : null}
      {!entryDetail && readSummary.accessState === "degraded" ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          Feed detail read is staying readable through the bounded preview path because auth/session
          configuration is degraded. This is a safe fallback, not a broken page.
        </p>
      ) : null}
    </section>
  );
}
