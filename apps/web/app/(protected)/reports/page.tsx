import Link from "next/link";
import type {
  AiHistoryCompareResult,
  AiHistoryReuseDestination,
  AiHistoryReusePrefillPayload
} from "@aquapulse/types";
import { encodeAiHistoryReusePrefill, getAiHistoryReusePrefill } from "@web/features/ai-history-reuse";
import { getReportsPageDataWithHistory } from "@web/queries";
import { PageShell } from "../_components/page-shell";

type ReportsHistoryFilter = NonNullable<Parameters<typeof getReportsPageDataWithHistory>[0]>;
type ReportsSearchParams = Record<string, string | string[] | undefined>;

function getSingleSearchParam(
  searchParams: ReportsSearchParams | undefined,
  key: string
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

function toSupportedDestination(value: string | undefined): AiHistoryReuseDestination | undefined {
  if (
    value === "incident_rewrite" ||
    value === "incident_draft" ||
    value === "approval_note_draft"
  ) {
    return value;
  }

  return undefined;
}

function buildSelectedPrefill(searchParams: ReportsSearchParams | undefined): AiHistoryReusePrefillPayload | undefined {
  const destinationType = toSupportedDestination(
    getSingleSearchParam(searchParams, "reuseDestination")
  );
  const sourceHistoryId = getSingleSearchParam(searchParams, "reuseSourceHistoryId");

  if (!destinationType || !sourceHistoryId) {
    return undefined;
  }

  if (destinationType === "incident_rewrite") {
    const originalText = getSingleSearchParam(searchParams, "rewriteText");
    return originalText
      ? {
          sourceHistoryId,
          sourceTaskType: "incident_rewrite",
          destinationType,
          originalText,
          advisoryOnly: true
        }
      : undefined;
  }

  if (destinationType === "incident_draft") {
    const rawOperatorNotes = getSingleSearchParam(searchParams, "incidentNotes");
    return rawOperatorNotes
      ? {
          sourceHistoryId,
          sourceTaskType: "incident_draft",
          destinationType,
          rawOperatorNotes,
          advisoryOnly: true
        }
      : undefined;
  }

  const promptNote = getSingleSearchParam(searchParams, "approvalPrompt");
  return promptNote
    ? {
        sourceHistoryId,
        sourceTaskType: "approval_note_draft",
        destinationType,
        promptNote,
        advisoryOnly: true
      }
    : undefined;
}

function buildReportsHref(
  base: {
    task?: string;
    mode?: string;
  },
  extra?: URLSearchParams
): string {
  const params = new URLSearchParams();

  if (base.task) {
    params.set("task", base.task);
  }

  if (base.mode) {
    params.set("mode", base.mode);
  }

  if (extra) {
    for (const [key, value] of extra.entries()) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query.length > 0 ? `/reports?${query}` : "/reports";
}

function destinationLabel(destination: AiHistoryReuseDestination): string {
  switch (destination) {
    case "incident_rewrite":
      return "Incident Rewrite";
    case "incident_draft":
      return "Incident Draft";
    case "approval_note_draft":
      return "Approval Note Draft";
  }
}

function getCurrentDraftTextForDestination(
  destination: AiHistoryReuseDestination,
  values: {
    rewriteText: string;
    incidentNotes: string;
    approvalPrompt: string;
  }
): string {
  switch (destination) {
    case "incident_rewrite":
      return values.rewriteText;
    case "incident_draft":
      return values.incidentNotes;
    case "approval_note_draft":
      return values.approvalPrompt;
  }
}

function renderComparePanel(compare: AiHistoryCompareResult) {
  return (
    <section
      style={{
        display: "grid",
        gap: "0.5rem",
        padding: "0.75rem",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        borderRadius: "0.65rem",
        background: "rgba(15, 23, 42, 0.2)"
      }}
    >
      <strong>Compare Current Draft vs Reused History Draft</strong>
      <p>
        Destination: {destinationLabel(compare.destinationType)} / Source history:{" "}
        {compare.sourceHistory.sourceHistoryId} / Changed: {compare.changed ? "yes" : "no"}
      </p>
      <p>
        Shared lines: {compare.sharedLines.length} / Current only: {compare.currentOnlyLines.length} / Reused only:{" "}
        {compare.reusedOnlyLines.length}
      </p>
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <strong>Current draft</strong>
          <p>Length: {compare.currentDraft.textLength}</p>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {compare.currentDraft.text}
          </pre>
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <strong>Reused history draft</strong>
          <p>Length: {compare.reusedHistoryDraft.textLength}</p>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {compare.reusedHistoryDraft.text}
          </pre>
        </div>
      </div>
      {compare.currentOnlyLines.length > 0 ? (
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <strong>Current-only lines</strong>
          {compare.currentOnlyLines.map((line) => (
            <span key={`current:${line}`}>{line}</span>
          ))}
        </div>
      ) : null}
      {compare.reusedOnlyLines.length > 0 ? (
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <strong>Reused-only lines</strong>
          {compare.reusedOnlyLines.map((line) => (
            <span key={`reused:${line}`}>{line}</span>
          ))}
        </div>
      ) : null}
      {compare.sharedLines.length > 0 ? (
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <strong>Shared lines</strong>
          {compare.sharedLines.map((line) => (
            <span key={`shared:${line}`}>{line}</span>
          ))}
        </div>
      ) : null}
      <p>Compare view is advisory-only. Keep editing, copy text manually, or regenerate manually.</p>
    </section>
  );
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const task = getSingleSearchParam(resolvedSearchParams, "task");
  const mode = getSingleSearchParam(resolvedSearchParams, "mode");
  const selectedPrefill = buildSelectedPrefill(resolvedSearchParams);
  const compareRequested = getSingleSearchParam(resolvedSearchParams, "compare") === "1";
  const rewriteText =
    getSingleSearchParam(resolvedSearchParams, "rewriteText") ??
    "night shift saw oxygen warning at north pond checked aerator and logged repeat sample";
  const incidentNotes =
    getSingleSearchParam(resolvedSearchParams, "incidentNotes") ??
    "night shift saw oxygen warning at north pond checked aerator and logged repeat sample";
  const approvalPrompt =
    getSingleSearchParam(resolvedSearchParams, "approvalPrompt") ??
    "Need wording for supervisor follow-up before approval.";

  const reports = await getReportsPageDataWithHistory({
    requestType: task as ReportsHistoryFilter["requestType"],
    providerMode:
      mode === "fallback" || mode === "provider_backed"
        ? mode
        : undefined,
    prefill: selectedPrefill,
    compareCurrentDraftText:
      compareRequested && selectedPrefill
        ? getCurrentDraftTextForDestination(selectedPrefill.destinationType, {
            rewriteText,
            incidentNotes,
            approvalPrompt
          })
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

  const filterBase = {
    task,
    mode
  };
  const clearPrefillHref = buildReportsHref(filterBase);
  const selectedCompare = reports.selectedCompare;

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
        {reports.history.items.map((item) => {
          const reusablePrefill = getAiHistoryReusePrefill(item);

          return (
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
              {reusablePrefill ? (
                <p>
                  <Link
                    href={buildReportsHref(
                      filterBase,
                      encodeAiHistoryReusePrefill(reusablePrefill)
                    )}
                  >
                    Reuse in {destinationLabel(reusablePrefill.destinationType)}
                  </Link>{" "}
                  <span>Prefill only. Review and submit manually.</span>
                </p>
              ) : (
                <p>Reuse helper not available for this task type.</p>
              )}
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
          );
        })}
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
          Mode: {reports.dailySummary.metadata.mode} /{" "}
          {reports.dailySummary.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output:{" "}
          {reports.dailySummary.metadata.output.outputMode} / Tone:{" "}
          {reports.dailySummary.metadata.output.tone ?? "operator"}
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
          Mode: {reports.handover.metadata.mode} /{" "}
          {reports.handover.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output:{" "}
          {reports.handover.metadata.output.outputMode} / Tone:{" "}
          {reports.handover.metadata.output.tone ?? "operator"}
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
        {selectedPrefill?.destinationType === "incident_rewrite" ? (
          <p>
            Prefilled from history item {selectedPrefill.sourceHistoryId}. Advisory-only and still editable.{" "}
            <Link href={clearPrefillHref}>Clear prefill</Link>
          </p>
        ) : null}
        <form method="get" style={{ display: "grid", gap: "0.45rem" }}>
          {task ? <input type="hidden" name="task" value={task} /> : null}
          {mode ? <input type="hidden" name="mode" value={mode} /> : null}
          <input type="hidden" name="reuseDestination" value="incident_rewrite" />
          {selectedPrefill?.destinationType === "incident_rewrite" ? (
            <input type="hidden" name="reuseSourceHistoryId" value={selectedPrefill.sourceHistoryId} />
          ) : null}
          <label>
            <span>Editable source text</span>
            <textarea
              name="rewriteText"
              defaultValue={rewriteText}
              rows={4}
              style={{ width: "100%" }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit">Regenerate rewrite from this input</button>
            {selectedPrefill?.destinationType === "incident_rewrite" ? (
              <button type="submit" name="compare" value="1">
                Compare current vs reused draft
              </button>
            ) : null}
          </div>
        </form>
        {selectedCompare?.destinationType === "incident_rewrite"
          ? renderComparePanel(selectedCompare)
          : null}
        <p>Original: {reports.incidentRewrite.originalText}</p>
        <p>Rewrite: {reports.incidentRewrite.rewrittenEnglish}</p>
        {reports.incidentRewrite.rewrittenHindi ? (
          <p>Hindi draft: {reports.incidentRewrite.rewrittenHindi}</p>
        ) : null}
        {reports.incidentRewrite.clarificationNote ? (
          <p>{reports.incidentRewrite.clarificationNote}</p>
        ) : null}
        <p>
          Mode: {reports.incidentRewrite.metadata.mode} /{" "}
          {reports.incidentRewrite.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output:{" "}
          {reports.incidentRewrite.metadata.output.outputMode} / Tone:{" "}
          {reports.incidentRewrite.metadata.output.tone ?? reports.incidentRewrite.tone}
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
        {selectedPrefill?.destinationType === "incident_draft" ? (
          <p>
            Prefilled from history item {selectedPrefill.sourceHistoryId}. Advisory-only and still editable.{" "}
            <Link href={clearPrefillHref}>Clear prefill</Link>
          </p>
        ) : null}
        <form method="get" style={{ display: "grid", gap: "0.45rem" }}>
          {task ? <input type="hidden" name="task" value={task} /> : null}
          {mode ? <input type="hidden" name="mode" value={mode} /> : null}
          <input type="hidden" name="reuseDestination" value="incident_draft" />
          {selectedPrefill?.destinationType === "incident_draft" ? (
            <input type="hidden" name="reuseSourceHistoryId" value={selectedPrefill.sourceHistoryId} />
          ) : null}
          <label>
            <span>Editable operator notes</span>
            <textarea
              name="incidentNotes"
              defaultValue={incidentNotes}
              rows={4}
              style={{ width: "100%" }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit">Regenerate incident draft from this input</button>
            {selectedPrefill?.destinationType === "incident_draft" ? (
              <button type="submit" name="compare" value="1">
                Compare current vs reused draft
              </button>
            ) : null}
          </div>
        </form>
        {selectedCompare?.destinationType === "incident_draft"
          ? renderComparePanel(selectedCompare)
          : null}
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
          Mode: {reports.incidentDraft.metadata.mode} /{" "}
          {reports.incidentDraft.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output:{" "}
          {reports.incidentDraft.metadata.output.outputMode} / Tone:{" "}
          {reports.incidentDraft.metadata.output.tone ?? "operator"}
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
        {selectedPrefill?.destinationType === "approval_note_draft" ? (
          <p>
            Prefilled from history item {selectedPrefill.sourceHistoryId}. Advisory-only and still editable.{" "}
            <Link href={clearPrefillHref}>Clear prefill</Link>
          </p>
        ) : null}
        <form method="get" style={{ display: "grid", gap: "0.45rem" }}>
          {task ? <input type="hidden" name="task" value={task} /> : null}
          {mode ? <input type="hidden" name="mode" value={mode} /> : null}
          <input type="hidden" name="reuseDestination" value="approval_note_draft" />
          {selectedPrefill?.destinationType === "approval_note_draft" ? (
            <input type="hidden" name="reuseSourceHistoryId" value={selectedPrefill.sourceHistoryId} />
          ) : null}
          <label>
            <span>Editable prompt note</span>
            <textarea
              name="approvalPrompt"
              defaultValue={approvalPrompt}
              rows={3}
              style={{ width: "100%" }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit">Regenerate approval note draft from this input</button>
            {selectedPrefill?.destinationType === "approval_note_draft" ? (
              <button type="submit" name="compare" value="1">
                Compare current vs reused draft
              </button>
            ) : null}
          </div>
        </form>
        {selectedCompare?.destinationType === "approval_note_draft"
          ? renderComparePanel(selectedCompare)
          : null}
        <p>{reports.approvalNote.headline}</p>
        <p>{reports.approvalNote.draftNote}</p>
        <p>Rationale: {reports.approvalNote.rationaleSummary}</p>
        <p>Next checks: {reports.approvalNote.suggestedNextChecks.join(" | ")}</p>
        <p>Review required: {reports.approvalNote.reviewRequired ? "yes" : "no"}</p>
        <p>
          Mode: {reports.approvalNote.metadata.mode} /{" "}
          {reports.approvalNote.metadata.usedLiveOpenAi ? "provider-backed" : "fallback"} / Output:{" "}
          {reports.approvalNote.metadata.output.outputMode} / Tone:{" "}
          {reports.approvalNote.metadata.output.tone ?? "formal"}
        </p>
      </section>
    </PageShell>
  );
}
