import Link from "next/link";
import { getReportsPageDataWithHistory } from "@web/queries";
import { PageShell } from "../_components/page-shell";

type ReportsHistoryFilter = NonNullable<Parameters<typeof getReportsPageDataWithHistory>[0]>;

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const task = typeof resolvedSearchParams?.task === "string" ? resolvedSearchParams.task : undefined;
  const mode = typeof resolvedSearchParams?.mode === "string" ? resolvedSearchParams.mode : undefined;
  const reports = await getReportsPageDataWithHistory({
    requestType: task as ReportsHistoryFilter["requestType"],
    providerMode:
      mode === "fallback" || mode === "provider_backed"
        ? mode
        : undefined
  });
  const historyLinks = [
    { href: "/reports", label: "All history" },
    { href: "/reports?mode=fallback", label: "Fallback only" },
    { href: "/reports?mode=provider_backed", label: "Provider-backed only" },
    { href: "/reports?task=incident_draft", label: "Incident drafts" },
    { href: "/reports?task=approval_note_draft", label: "Approval notes" },
    { href: "/reports?task=alerts_explain", label: "Alert explanations" }
  ];

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
        <strong>AI Usage History</strong>
        <p>
          Recent outputs from the bounded AI request/response log seam. Filter: {task ?? "all tasks"} /{" "}
          {mode ?? "all modes"}
        </p>
        <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
          {historyLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <p>
          Entries: {reports.history.page.totalItems} / Showing: {reports.history.items.length}
        </p>
        {reports.history.items.map((item) => (
          <article
            key={item.id}
            style={{
              display: "grid",
              gap: "0.35rem",
              padding: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "0.65rem"
            }}
          >
            <strong>{item.requestType ?? "unknown_task"}</strong>
            <p>
              Mode: {item.providerMode ?? "unknown"} / Path: {item.providerPath ?? "unknown"} / Model: {item.model}
            </p>
            <p>
              Logged: {item.createdAt} / Related records: {item.relatedRecordIds?.join(", ") ?? "none"}
            </p>
            <p>Preview: {item.outputPreview ?? "No preview available."}</p>
            <details>
              <summary>Copy-ready output</summary>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere"
                }}
              >
                {item.outputText}
              </pre>
            </details>
          </article>
        ))}
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
        <strong>Generate Daily Summary</strong>
        <p>{reports.dailySummary.headline}</p>
        {reports.dailySummary.headlineHindi ? <p>Hindi draft: {reports.dailySummary.headlineHindi}</p> : null}
        <p>Highlights: {reports.dailySummary.keyHighlights.join(" | ")}</p>
        <p>Pending actions: {reports.dailySummary.pendingActions.join(" | ")}</p>
        <p>
          Mode: {reports.dailySummary.metadata.mode} / {reports.dailySummary.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output: {reports.dailySummary.metadata.output.outputMode} / Tone: {reports.dailySummary.metadata.output.tone ?? "operator"}
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
        {reports.handover.headlineHindi ? <p>Hindi draft: {reports.handover.headlineHindi}</p> : null}
        <p>Pending items: {reports.handover.pendingItems.join(" | ")}</p>
        <p>Next shift note: {reports.handover.nextShiftNote}</p>
        {reports.handover.nextShiftNoteHindi ? <p>Hindi draft: {reports.handover.nextShiftNoteHindi}</p> : null}
        <p>
          Mode: {reports.handover.metadata.mode} / {reports.handover.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output: {reports.handover.metadata.output.outputMode} / Tone: {reports.handover.metadata.output.tone ?? "operator"}
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
          Mode: {reports.incidentRewrite.metadata.mode} / {reports.incidentRewrite.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output: {reports.incidentRewrite.metadata.output.outputMode} / Tone: {reports.incidentRewrite.metadata.output.tone ?? reports.incidentRewrite.tone}
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
        <strong>Incident Draft</strong>
        <p>{reports.incidentDraft.headline}</p>
        <p>{reports.incidentDraft.incidentSummary}</p>
        <p>Key facts: {reports.incidentDraft.keyFacts.join(" | ")}</p>
        <p>Likely impact: {reports.incidentDraft.likelyImpact}</p>
        <p>Immediate checks: {reports.incidentDraft.immediateActionsSuggested.join(" | ")}</p>
        <p>Escalation: {reports.incidentDraft.escalationNeed}</p>
        <p>Draft: {reports.incidentDraft.draftEnglish}</p>
        {reports.incidentDraft.draftHindi ? <p>Hindi draft: {reports.incidentDraft.draftHindi}</p> : null}
        {reports.incidentDraft.missingInformationNote ? <p>{reports.incidentDraft.missingInformationNote}</p> : null}
        <p>
          Mode: {reports.incidentDraft.metadata.mode} / {reports.incidentDraft.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output: {reports.incidentDraft.metadata.output.outputMode} / Tone: {reports.incidentDraft.metadata.output.tone ?? "operator"}
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
          Mode: {reports.approvalNote.metadata.mode} / {reports.approvalNote.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output: {reports.approvalNote.metadata.output.outputMode} / Tone: {reports.approvalNote.metadata.output.tone ?? "formal"}
        </p>
      </section>
    </PageShell>
  );
}
