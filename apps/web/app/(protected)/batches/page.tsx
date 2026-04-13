import { batchesMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function BatchesPage() {
  const batches = await batchesMockAdapter.list();

  return (
    <PageShell title="Batches" description="Placeholder batch list using typed mock adapter data.">
      <p>Batch records available: {batches.data.items.length}</p>
    </PageShell>
  );
}
