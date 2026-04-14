import { getAlertsPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function AlertsPage() {
  const alertsPage = await getAlertsPageData();

  return (
    <PageShell title="Alerts" description="Placeholder alerts route using the repository and query layer.">
      <p>Alerts: {alertsPage.alerts.items.length}</p>
      <p>AI explanation: {alertsPage.explanation}</p>
      <ul>
        {alertsPage.alerts.items.map((alert) => (
          <li key={alert.id}>
            {alert.title} [{alert.severity}] {alert.pondId ? `for ${alert.pondId}` : ""}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
