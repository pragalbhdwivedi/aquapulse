import { apiClients } from "@web/clients";
import { PageShell } from "../_components/page-shell";

export default async function AlertsPage() {
  const alerts = await apiClients.alerts.list();
  const explanation = await apiClients.alerts.explain({ alertId: alerts.data.items[0]?.id ?? "alert-1" });

  return (
    <PageShell title="Alerts" description="Placeholder alerts route using the API client layer.">
      <p>Alerts: {alerts.data.items.length}</p>
      <p>AI explanation: {explanation.data.explanation}</p>
    </PageShell>
  );
}
