import type {
  FeedEntry,
  FrontendSessionBootstrapStatus,
  ListResponse
} from "@aquapulse/types";
import {
  deriveNonAlertReadAccessSummary,
  deriveProtectedReadUiGuard
} from "@web/features/auth-session";

interface FeedRecentReadCardProps {
  readonly entries?: ListResponse<FeedEntry>;
  readonly session: FrontendSessionBootstrapStatus;
}

export function FeedRecentReadCard({
  entries,
  session
}: FeedRecentReadCardProps) {
  const readGuard = deriveProtectedReadUiGuard(session, {
    sliceLabel: session.senaryNonAlertsReadGuardedSliceLabel ?? "feed_recent_read",
    enforcedByBackend: session.senaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const readSummary = deriveNonAlertReadAccessSummary(session);
  const latestEntry = entries?.items[0];
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Recent Feed History</h2>
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
          Feed recent auth: {readGuard.sliceLabel} / {readGuard.state}
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
        Recent entries loaded: {entries?.items.length ?? 0}
        {latestEntry ? ` / Latest feed at: ${latestEntry.fedAt}` : ""}
      </p>
      {!entries && !readGuard.enabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Feed recent/history reads are backend-protected in active auth mode. Forwarded auth and a
          resolved current-session must be available before this bounded feed history surface can load.
        </p>
      ) : null}
      {!entries && readSummary.accessState === "degraded" ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          Feed recent/history reads are staying off the protected path because auth/session
          configuration is degraded.
        </p>
      ) : null}
    </section>
  );
}
