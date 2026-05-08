import { getReportsPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function ReportsPage() {
  const reports = await getReportsPageData();

  return (
    <PageShell title="Reports" description="Placeholder reports route using the repository and query layer.">
      <p>Data points: {reports.ponds.items.length + reports.alerts.items.length}</p>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "0.85rem",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "0.75rem"
        }}
      >
        <strong>Generate Daily Summary</strong>
        <p>{reports.dailySummary.headline}</p>
        <p>Highlights: {reports.dailySummary.keyHighlights.join(" | ")}</p>
        <p>Pending actions: {reports.dailySummary.pendingActions.join(" | ")}</p>
        <p>
          Mode: {reports.dailySummary.metadata.mode} / {reports.dailySummary.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"}
        </p>
      </section>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "0.85rem",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "0.75rem"
        }}
      >
        <strong>Generate Shift Handover</strong>
        <p>{reports.handover.headline}</p>
        <p>Pending items: {reports.handover.pendingItems.join(" | ")}</p>
        <p>Next shift note: {reports.handover.nextShiftNote}</p>
        <p>
          Mode: {reports.handover.metadata.mode} / {reports.handover.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"}
        </p>
      </section>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "0.85rem",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "0.75rem"
        }}
      >
        <strong>Incident Rewrite</strong>
        <p>Original: {reports.incidentRewrite.originalText}</p>
        <p>Rewrite: {reports.incidentRewrite.rewrittenEnglish}</p>
        {reports.incidentRewrite.rewrittenHindi ? (
          <p>Hindi draft: {reports.incidentRewrite.rewrittenHindi}</p>
        ) : null}
        {reports.incidentRewrite.clarificationNote ? (
          <p>{reports.incidentRewrite.clarificationNote}</p>
        ) : null}
        <p>
          Mode: {reports.incidentRewrite.metadata.mode} / {reports.incidentRewrite.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"}
        </p>
      </section>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "0.85rem",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "0.75rem"
        }}
      >
        <strong>Approval Note Draft</strong>
        <p>{reports.approvalNote.headline}</p>
        <p>{reports.approvalNote.draftNote}</p>
        <p>Rationale: {reports.approvalNote.rationaleSummary}</p>
        <p>Next checks: {reports.approvalNote.suggestedNextChecks.join(" | ")}</p>
        <p>Review required: {reports.approvalNote.reviewRequired ? "yes" : "no"}</p>
        <p>
          Mode: {reports.approvalNote.metadata.mode} / {reports.approvalNote.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"}
        </p>
      </section>
    </PageShell>
  );
}
