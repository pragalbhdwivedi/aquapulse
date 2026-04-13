import { pondsMockAdapter, waterQualityMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../../_components/page-shell";

type PondDetailPageProps = {
  params: Promise<{ pondId: string }>;
};

export default async function PondDetailPage({ params }: PondDetailPageProps) {
  const { pondId } = await params;
  const [pond, readings] = await Promise.all([
    pondsMockAdapter.getById(pondId),
    waterQualityMockAdapter.listByPond(pondId),
  ]);

  return (
    <PageShell title={pond.data.name} description="Placeholder pond detail route using typed mock adapters.">
      <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
        <p>Code: {pond.data.code}</p>
        <p>Status: {pond.data.status}</p>
        <p>Water quality samples: {readings.data.items.length}</p>
      </div>
    </PageShell>
  );
}
