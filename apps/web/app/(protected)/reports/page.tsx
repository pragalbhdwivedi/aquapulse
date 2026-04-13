import { apiClients } from "@web/clients";
import { PageShell } from "../_components/page-shell";

export default async function ReportsPage() {
  const [ponds, alerts, handover] = await Promise.all([
    apiClients.ponds.list(),
    apiClients.alerts.list(),
    apiClients.ai.generateHandover({ shiftDate: "2026-04-13T00:00:00.000Z" })
  ]);

  return (
    <PageShell title="Reports" description="Placeholder reports route using the API client layer.">
      <p>Data points: {ponds.data.items.length + alerts.data.items.length}</p>
      <p>Handover: {handover.data.summary}</p>
    </PageShell>
  );
}
