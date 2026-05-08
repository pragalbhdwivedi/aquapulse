import { getDashboardPageData } from "@web/queries";
import { defaultAlertWorkbenchOwner, deriveOwnerAlertIndicators } from "@web/features/alert-workbench";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { RuntimeDiagnosticsCard } from "../_components/runtime-diagnostics-card";

export default async function DashboardPage() {
  const dashboard = await getDashboardPageData();
  const runtimeDiagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const ownerIndicators = deriveOwnerAlertIndicators(
    dashboard.alertSummary,
    defaultAlertWorkbenchOwner
  );

  return (
    <PageShell title="Dashboard" description="Operational overview with a bounded read-only dashboard assistant.">
      <p>Active ponds: {dashboard.ponds.items.length}</p>
      <p>Open alerts: {dashboard.alerts.items.length}</p>
      <p>Assigned alerts: {dashboard.alertSummary.assignmentCounts.assigned}</p>
      <p>Under review: {dashboard.alertSummary.reviewStateCounts.underReview}</p>
      <p>{ownerIndicators.ownerId} assigned: {ownerIndicators.assignedAlerts}</p>
      <p>Pending tasks: {dashboard.tasks.items.length}</p>
      <section aria-label="Dashboard assistant">
        <h2>{dashboard.answer.headline}</h2>
        <p>{dashboard.answer.directAnswer}</p>
        <p>
          Assistant mode: {dashboard.answer.metadata.mode} /{" "}
          {dashboard.answer.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"}
        </p>
        {dashboard.answer.priorityItems.length > 0 ? (
          <ul>
            {dashboard.answer.priorityItems.map((item) => (
              <li key={`${item.pondId ?? "farm"}-${item.label}`}>
                {item.label}: {item.detail}
              </li>
            ))}
          </ul>
        ) : null}
        {dashboard.answer.missingInformationNote ? (
          <p>{dashboard.answer.missingInformationNote}</p>
        ) : null}
      </section>
      <RuntimeDiagnosticsCard diagnostics={runtimeDiagnostics} />
    </PageShell>
  );
}
