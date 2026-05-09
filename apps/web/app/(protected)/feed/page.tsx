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
      <p>
        Recent feed log: {feed?.items.length ?? 0} item(s). Review the latest entry, confirm the recent history, then add or revise feed notes manually.
      </p>
      <ul>
        {(feed?.items ?? []).map((entry) => (
          <li key={entry.id}>
            {entry.feedType} - {entry.quantityKg} kg
          </li>
        ))}
      </ul>
      <FeedRecentReadCard entries={feed} session={diagnostics.session} />
      {latestEntry ? (
        <FeedDetailReadCard
          entryPreview={latestEntry}
          entryDetail={latestEntryDetail}
          session={diagnostics.session}
        />
      ) : null}
      <FeedEntryForm pondId={latestEntry?.pondId} batchId={latestEntry?.batchId} session={diagnostics.session} />
      {latestEntry ? <FeedUpdateForm feedEntry={latestEntry} session={diagnostics.session} /> : null}
    </PageShell>
  );
}
