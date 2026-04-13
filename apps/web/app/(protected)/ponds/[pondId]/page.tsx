import { apiClients } from "@web/clients";
import { PageShell } from "../../_components/page-shell";

export default async function PondDetailPage({ params }: { params: Promise<{ pondId: string }> }) {
  const { pondId } = await params;
  const [pond, readings] = await Promise.all([apiClients.ponds.getById(pondId), apiClients.waterQuality.listByPond(pondId)]);

  return (
    <PageShell title={pond.data.name} description="Placeholder pond detail using typed API clients.">
      <p>Code: {pond.data.code}</p>
      <p>Status: {pond.data.status}</p>
      <p>Water quality readings: {readings.data.items.length}</p>
    </PageShell>
  );
}
