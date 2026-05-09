import { getFeedDetailPageData, getFeedPageData } from "@web/queries";
import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { FeedDetailReadCard } from "./_components/feed-detail-read-card";
import { FeedEntryForm } from "./_components/feed-entry-form";
import { FeedRecentReadCard } from "./_components/feed-recent-read-card";
import { FeedUpdateForm } from "./_components/feed-update-form";

export default async function FeedPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const feedRecentGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.senaryNonAlertsReadGuardedSliceLabel ?? "feed_recent_read",
    enforcedByBackend: diagnostics.session.senaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const feed = feedRecentGuard.enabled ? await getFeedPageData().catch(() => undefined) : undefined;
  const latestEntry = feed?.items[0];
  const feedReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.secondaryNonAlertsReadGuardedSliceLabel ?? "feed_detail_read",
    enforcedByBackend: diagnostics.session.secondaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const latestEntryDetail =
    latestEntry && feedReadGuard.enabled
      ? await getFeedDetailPageData(latestEntry.id).catch(() => undefined)
      : undefined;

  return (
    <PageShell
      title="Feed"
      description="Recent feed activity with bounded protected reads and operator create/update actions that stay local-safe by default."
    >
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.35)"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Feed workflow overview</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Start with the recent history list, review the selected latest entry, then decide whether the next manual step is a new feed entry or an update to the current one.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
          <span>Recent entries: {feed?.items.length ?? 0}</span>
          <span>Selected detail: {latestEntryDetail ? "full detail loaded" : latestEntry ? "preview only" : "no entry yet"}</span>
          <span>Next action: {latestEntry ? "check quantity, pond link, and time" : "record the first feed entry"}</span>
        </div>
      </section>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Recent feed list</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Use this history to explain what was fed most recently before opening the selected detail.
        </p>
        <ul>
          {(feed?.items ?? []).map((entry) => (
            <li key={entry.id}>
              {entry.feedType} - {entry.quantityKg} kg
            </li>
          ))}
        </ul>
      </section>
      <FeedRecentReadCard entries={feed} session={diagnostics.session} />
      {latestEntry ? (
        <FeedDetailReadCard
          entryPreview={latestEntry}
          entryDetail={latestEntryDetail}
          session={diagnostics.session}
        />
      ) : null}
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Manual feed actions</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          These forms stay manual and review-first. Protected create and update actions may require a forwarded session in active auth mode, while disabled/local modes keep the bounded bypass path readable.
        </p>
      </section>
      <FeedEntryForm pondId={latestEntry?.pondId} batchId={latestEntry?.batchId} session={diagnostics.session} />
      {latestEntry ? <FeedUpdateForm feedEntry={latestEntry} session={diagnostics.session} /> : null}
    </PageShell>
  );
}
