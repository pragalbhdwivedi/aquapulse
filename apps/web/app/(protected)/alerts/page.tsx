import { getAlertsPageData } from "@web/queries";
import { buildAlertQueueSummary } from "@aquapulse/types";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import { PageShell } from "../_components/page-shell";
import { AlertsActionList } from "./_components/alerts-action-list";

export default async function AlertsPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const listReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.protectedReadGuardedSliceLabel ??
      diagnostics.auth.protectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.protectedReadGuardedSliceEnforced ||
      diagnostics.auth.protectedReadSliceEnforced
  });
  const detailReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.secondaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.secondaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.secondaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.secondaryProtectedReadSliceEnforced
  });
  const summaryReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.tertiaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.tertiaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.tertiaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.tertiaryProtectedReadSliceEnforced
  });
  const fallbackAlertsPage = {
    alerts: {
      items: [],
      page: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }
    },
    summary: buildAlertQueueSummary([]),
    summarySource: "fallback" as const,
    explanation: detailReadGuard.enabled
      ? "Advisory explanation will be available after the first alert detail is loaded."
      : "Protected alert detail is unavailable until a forwarded auth session is present."
  };
  const alertsPage = listReadGuard.enabled
    ? await getAlertsPageData().catch(() => fallbackAlertsPage)
    : fallbackAlertsPage;
  const initialListReadState =
    listReadGuard.state === "disabled"
      ? "blocked"
      : alertsPage.alerts.items.length > 0 || listReadGuard.state === "enabled"
        ? "enabled"
        : diagnostics.session.bootstrapState === "degraded"
          ? "error"
          : "bypassed";
  const initialListReadMessage =
    listReadGuard.state === "disabled"
      ? `${listReadGuard.message} Alerts queue results are hidden until auth forwarding/session is available.`
      : listReadGuard.state === "bypassed"
        ? `${listReadGuard.message} Alerts queue reads stay usable in disabled/local mode.`
        : "Protected alerts list is available with the current session and forwarding state.";
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
        initialListReadState={initialListReadState}
        initialListReadMessage={initialListReadMessage}
        initialSummaryReadState={initialSummaryReadState}
        initialSummaryReadMessage={initialSummaryReadMessage}
        authDiagnostics={diagnostics.auth}
        session={diagnostics.session}
      />
    </PageShell>
  );
}
