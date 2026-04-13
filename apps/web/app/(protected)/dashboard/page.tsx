import { getDashboardPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function DashboardPage() {
  const dashboard = await getDashboardPageData();

  return (
    <PageShell title="Dashboard" description="Placeholder dashboard routed through repository and query abstractions.">
      <p>Active ponds: {dashboard.ponds.items.length}</p>
      <p>Open alerts: {dashboard.alerts.items.length}</p>
      <p>Pending tasks: {dashboard.tasks.items.length}</p>
      <p>AI summary: {dashboard.answer.answer}</p>
    </PageShell>
  );
}
