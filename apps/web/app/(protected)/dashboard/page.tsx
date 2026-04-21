import { getDashboardPageData } from "@web/queries";
import { defaultAlertWorkbenchOwner, deriveOwnerAlertIndicators } from "@web/features/alert-workbench";
import { readFrontendRuntimeDiagnostics } from "@web/features/runtime-diagnostics";
import { PageShell } from "../_components/page-shell";
import { RuntimeDiagnosticsCard } from "../_components/runtime-diagnostics-card";

export default async function DashboardPage() {
  const dashboard = await getDashboardPageData();
  const runtimeDiagnostics = readFrontendRuntimeDiagnostics();
  const ownerIndicators = deriveOwnerAlertIndicators(
    dashboard.alertSummary,
    defaultAlertWorkbenchOwner
  );

  return (
    <PageShell title="Dashboard" description="Placeholder dashboard routed through repository and query abstractions.">
      <p>Active ponds: {dashboard.ponds.items.length}</p>
      <p>Open alerts: {dashboard.alerts.items.length}</p>
      <p>Assigned alerts: {dashboard.alertSummary.assignmentCounts.assigned}</p>
      <p>Under review: {dashboard.alertSummary.reviewStateCounts.underReview}</p>
      <p>{ownerIndicators.ownerId} assigned: {ownerIndicators.assignedAlerts}</p>
      <p>Pending tasks: {dashboard.tasks.items.length}</p>
      <p>AI summary: {dashboard.answer.answer}</p>
      <RuntimeDiagnosticsCard diagnostics={runtimeDiagnostics} />
    </PageShell>
  );
}
