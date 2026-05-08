import { getFeedDetailPageData, getFeedPageData } from "@web/queries";
import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { FeedDetailReadCard } from "./_components/feed-detail-read-card";
import { FeedEntryForm } from "./_components/feed-entry-form";
import { FeedUpdateForm } from "./_components/feed-update-form";

export default async function FeedPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const feed = await getFeedPageData();
  const latestEntry = feed.items[0];
  const feedReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.secondaryNonAlertsReadGuardedSliceLabel ?? "feed_detail_read",
    enforcedByBackend: diagnostics.session.secondaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const latestEntryDetail =
    latestEntry && feedReadGuard.enabled
      ? await getFeedDetailPageData(latestEntry.id).catch(() => undefined)
      : undefined;

  return (
    <PageShell title="Feed" description="Minimal feed route with the third write vertical slice wired in.">
      <p>Entries: {feed.items.length}</p>
      <ul>
        {feed.items.map((entry) => (
          <li key={entry.id}>
            {entry.feedType} - {entry.quantityKg} kg
          </li>
        ))}
      </ul>
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
