import { getFeedPageData } from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { FeedEntryForm } from "./_components/feed-entry-form";
import { FeedUpdateForm } from "./_components/feed-update-form";

export default async function FeedPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const feed = await getFeedPageData();

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
      <FeedEntryForm pondId={feed.items[0]?.pondId} batchId={feed.items[0]?.batchId} />
      {feed.items[0] ? <FeedUpdateForm feedEntry={feed.items[0]} session={diagnostics.session} /> : null}
    </PageShell>
  );
}
