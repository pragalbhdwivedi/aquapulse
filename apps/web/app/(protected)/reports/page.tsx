import { aiMockAdapter, alertsMockAdapter, pondsMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function ReportsPage() {
  const [ponds, alerts, handover] = await Promise.all([
    pondsMockAdapter.list(),
    alertsMockAdapter.list(),
    aiMockAdapter.generateHandover({ shiftDate: "2026-04-13T00:00:00.000Z" }),
  ]);

  return (
    <PageShell title="Reports" description="Placeholder reports surface with structural summaries only.">
      <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
        <p>Report data points available: {ponds.data.items.length + alerts.data.items.length}</p>
        <p>Handover summary: {handover.data.summary}</p>
      </div>
    </PageShell>
  );
}
