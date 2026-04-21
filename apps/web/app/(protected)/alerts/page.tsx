import { getAlertsPageData } from "@web/queries";
import { readFrontendRuntimeDiagnostics } from "@web/features/runtime-diagnostics";
import { PageShell } from "../_components/page-shell";
import { AlertsActionList } from "./_components/alerts-action-list";

export default async function AlertsPage() {
  const alertsPage = await getAlertsPageData();
  const diagnostics = readFrontendRuntimeDiagnostics();

  return (
    <PageShell title="Alerts" description="Placeholder alerts route using the repository and query layer.">
      <p>Alerts: {alertsPage.alerts.items.length}</p>
      <p>AI explanation: {alertsPage.explanation}</p>
      <AlertsActionList
        initialAlerts={alertsPage.alerts.items}
        initialSummary={alertsPage.summary}
        authDiagnostics={diagnostics.auth}
        session={diagnostics.session}
      />
    </PageShell>
  );
}
