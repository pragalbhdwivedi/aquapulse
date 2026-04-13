import { getPondDetailPageData } from "@web/queries";
import { PageShell } from "../../_components/page-shell";

export default async function PondDetailPage({ params }: { params: Promise<{ pondId: string }> }) {
  const { pondId } = await params;
  const detail = await getPondDetailPageData(pondId);

  return (
    <PageShell title={detail.pond.name} description="Placeholder pond detail route using the repository and query layer.">
      <p>Code: {detail.pond.code}</p>
      <p>Status: {detail.pond.status}</p>
      <p>Type: {detail.pond.kind}</p>
      <p>Water-quality readings: {detail.waterQuality.items.length}</p>
      <p>AI summary: {detail.summary.summary}</p>
    </PageShell>
  );
}
