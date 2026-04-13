import { apiClients } from "@web/clients";
import { PageShell } from "../_components/page-shell";

export default async function DashboardPage() {
  const [ponds, alerts, tasks, answer] = await Promise.all([
    apiClients.ponds.list(),
    apiClients.alerts.list(),
    apiClients.tasks.list(),
    apiClients.ai.queryDashboard({ question: "What needs attention today?" })
  ]);

  return (
    <PageShell title="Dashboard" description="Placeholder dashboard routed through API clients.">
      <p>Active ponds: {ponds.data.items.length}</p>
      <p>Open alerts: {alerts.data.items.length}</p>
      <p>Pending tasks: {tasks.data.items.length}</p>
      <p>AI summary: {answer.data.answer}</p>
    </PageShell>
  );
}
