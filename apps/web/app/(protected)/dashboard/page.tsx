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
    <PageShell
      title="Dashboard"
      description="Operational overview for operator walkthroughs, with a bounded advisory assistant and safe local fallback behavior."
    >
      <section
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
        }}
      >
        {[
          { label: "Active ponds", value: dashboard.ponds.items.length, note: "Current monitored ponds" },
          { label: "Open alerts", value: dashboard.alerts.items.length, note: "Items needing review or action" },
          { label: "Assigned alerts", value: dashboard.alertSummary.assignmentCounts.assigned, note: "Already owned by operators" },
          { label: "Under review", value: dashboard.alertSummary.reviewStateCounts.underReview, note: "Triage already in progress" },
          { label: "Pending tasks", value: dashboard.tasks.items.length, note: "Manual follow-up still open" },
          { label: `${ownerIndicators.ownerId} assigned`, value: ownerIndicators.assignedAlerts, note: "Current owner workload snapshot" }
        ].map((item) => (
          <article
            key={item.label}
            style={{
              display: "grid",
              gap: "0.25rem",
              padding: "0.85rem",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "0.75rem"
            }}
          >
            <strong>{item.label}</strong>
            <span style={{ fontSize: "1.6rem", lineHeight: 1.1 }}>{item.value}</span>
            <span style={{ color: "#94a3b8" }}>{item.note}</span>
          </article>
        ))}
      </section>
      <section
        aria-label="Dashboard assistant"
        style={{
          display: "grid",
          gap: "0.6rem",
          padding: "0.95rem",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "0.85rem"
        }}
      >
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <strong>Dashboard Assistant</strong>
          <span style={{ color: "#94a3b8" }}>
            Advisory-only guidance for operator review. Use it to decide what to check first, then confirm in the live workflow.
          </span>
        </div>
        <h2 style={{ margin: 0 }}>{dashboard.answer.headline}</h2>
        {dashboard.answer.headlineHindi ? <p>Hindi draft: {dashboard.answer.headlineHindi}</p> : null}
        <p>{dashboard.answer.directAnswer}</p>
        {dashboard.answer.directAnswerHindi ? <p>Hindi draft: {dashboard.answer.directAnswerHindi}</p> : null}
        <p style={{ color: "#cbd5e1" }}>
          Mode: {dashboard.answer.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Provider path:{" "}
          {dashboard.answer.metadata.providerPath} / Output: {dashboard.answer.metadata.output.outputMode} / Tone:{" "}
          {dashboard.answer.metadata.output.tone ?? "operator"}
        </p>
        {dashboard.answer.priorityItems.length > 0 ? (
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <strong>What needs attention first</strong>
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {dashboard.answer.priorityItems.map((item) => (
                <li key={`${item.pondId ?? "farm"}-${item.label}`}>
                  {item.label}: {item.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {dashboard.answer.missingInformationNote ? (
          <p style={{ color: "#fbbf24" }}>{dashboard.answer.missingInformationNote}</p>
        ) : null}
      </section>
      <RuntimeDiagnosticsCard diagnostics={runtimeDiagnostics} />
    </PageShell>
  );
}
