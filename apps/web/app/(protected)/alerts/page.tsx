import { getAlertsPageData } from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { deriveProtectedOperatorUiGuard } from "@web/features/auth-session";
import { PageShell } from "../_components/page-shell";
import { AlertsActionList } from "./_components/alerts-action-list";

export default async function AlertsPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const alertsPage = await getAlertsPageData();
  const summaryReadGuard = deriveProtectedOperatorUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.secondaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.secondaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.secondaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.secondaryProtectedReadSliceEnforced
  });
  const initialSummaryReadState =
    alertsPage.summarySource === "backend"
      ? "enabled"
      : summaryReadGuard.state === "disabled"
        ? "blocked"
        : "bypassed";
  const initialSummaryReadMessage =
    alertsPage.summarySource === "backend"
      ? "Protected alerts summary is available with the current session and forwarding state."
      : summaryReadGuard.state === "disabled"
        ? `${summaryReadGuard.message} Showing a queue-derived fallback summary.`
        : "Summary reads are staying on the safe bypass path. Showing a queue-derived fallback summary.";

  return (
    <PageShell title="Alerts" description="Placeholder alerts route using the repository and query layer.">
      <p>Alerts: {alertsPage.alerts.items.length}</p>
      <p>AI explanation: {alertsPage.explanation}</p>
      <AlertsActionList
        initialAlerts={alertsPage.alerts.items}
        initialSummary={alertsPage.summary}
        initialSummaryReadState={initialSummaryReadState}
        initialSummaryReadMessage={initialSummaryReadMessage}
        authDiagnostics={diagnostics.auth}
        session={diagnostics.session}
      />
    </PageShell>
  );
}
