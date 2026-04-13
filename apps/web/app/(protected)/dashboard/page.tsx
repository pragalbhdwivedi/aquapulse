import { aiMockAdapter, alertsMockAdapter, pondsMockAdapter, tasksMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function DashboardPage() {
  const [ponds, alerts, tasks, dashboardAnswer] = await Promise.all([
    pondsMockAdapter.list(),
    alertsMockAdapter.list(),
    tasksMockAdapter.list(),
    aiMockAdapter.queryDashboard({ question: "What needs attention today?" }),
  ]);

  return (
    <PageShell
      title="Dashboard"
      description="Placeholder dashboard consuming typed mock adapters instead of live APIs."
    >
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
          <strong>Active Ponds</strong>
          <p>{ponds.data.items.length}</p>
        </div>
        <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
          <strong>Open Alerts</strong>
          <p>{alerts.data.items.length}</p>
        </div>
        <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
          <strong>Pending Tasks</strong>
          <p>{tasks.data.items.length}</p>
        </div>
      </div>
      <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
        <strong>AI Query</strong>
        <p>{dashboardAnswer.data.answer}</p>
      </div>
    </PageShell>
  );
}
