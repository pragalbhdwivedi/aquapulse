import { pondsRepository } from "@web/repositories";
import { PageShell } from "../../_components/page-shell";

export default async function PondDetailPage({ params }: { params: Promise<{ pondId: string }> }) {
  const { pondId } = await params;
  const pond = await pondsRepository.getById(pondId);

  return (
    <PageShell title={pond.data.name} description="Placeholder pond detail route restored for workspace stability.">
      <p>Code: {pond.data.code}</p>
      <p>Status: {pond.data.status}</p>
      <p>Type: {pond.data.kind}</p>
    </PageShell>
  );
}
