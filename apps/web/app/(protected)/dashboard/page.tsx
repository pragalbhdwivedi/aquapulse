import { getDashboardPageData } from "@web/queries";
import { defaultAlertWorkbenchOwner, deriveOwnerAlertIndicators } from "@web/features/alert-workbench";
import { readFrontendRuntimeDiagnostics } from "@web/features/runtime-diagnostics";
import { PageShell } from "../_components/page-shell";
import { RuntimeDiagnosticsCard } from "../_components/runtime-diagnostics-card";

export default async function DashboardPage() {
  const dashboard = await getDashboardPageData();
  const runtimeDiagnostics = readFrontendRuntimeDiagnostics({
    NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE,
    NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP,
    NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP,
    NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL,
    NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE,
    NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
    NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT,
    NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE,
    NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL,
    NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT,
    AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL
  });
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
