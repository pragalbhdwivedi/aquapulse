import { getFeedPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";
import { FeedEntryForm } from "./_components/feed-entry-form";

export default async function FeedPage() {
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
    </PageShell>
  );
}
