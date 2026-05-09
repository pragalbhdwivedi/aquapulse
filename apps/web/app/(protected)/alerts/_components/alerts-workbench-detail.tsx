"use client";

import type {
  AiAlertsExplainResponse,
  AlertExplanationFeedbackValue,
  FrontendSessionBootstrapStatus,
  AlertReviewState,
  AlertSummary
} from "@aquapulse/types";
import { deriveProtectedOperatorUiGuard } from "@web/features/auth-session";

interface AlertsWorkbenchDetailProps {
  readonly alert: AlertSummary;
  readonly detailReadState?: "enabled" | "loading" | "blocked" | "bypassed" | "error";
  readonly detailReadMessage?: string;
  readonly note: string;
  readonly ownerInput: string;
  readonly reviewLabel: string;
  readonly reviewState: AlertReviewState;
  readonly isSubmitting: boolean;
  readonly activeAlertId: string | null;
  readonly explanation?: AiAlertsExplainResponse;
  readonly explanationError?: string;
  readonly isExplaining: boolean;
  readonly isAttachingExplanation: boolean;
  readonly feedbackNote: string;
  readonly isSubmittingFeedback: boolean;
  readonly session: FrontendSessionBootstrapStatus;
  readonly onNoteChange: (value: string) => void;
  readonly onOwnerChange: (value: string) => void;
  readonly onReviewLabelChange: (value: string) => void;
  readonly onReviewStateChange: (value: AlertReviewState) => void;
  readonly onExplain: () => void;
  readonly onRegenerate: () => void;
  readonly onFeedbackNoteChange: (value: string) => void;
  readonly onSubmitFeedback: (value: AlertExplanationFeedbackValue) => void;
  readonly onAttachExplanation: () => void;
  readonly onAssign: () => void;
  readonly onUnassign: () => void;
  readonly onApplyReviewState: () => void;
  readonly onAcknowledge: () => void;
  readonly onResolve: () => void;
}

const reviewStateOptions: AlertReviewState[] = [
  "unreviewed",
  "under_review",
  "reviewed",
  "deferred"
];

const sectionStyle = {
  display: "grid",
  gap: "0.5rem",
  padding: "0.8rem",
  borderRadius: "0.65rem",
  background: "rgba(15, 23, 42, 0.55)"
} as const;

const mutedTextStyle = {
  margin: 0,
  color: "#94a3b8"
} as const;

export function AlertsWorkbenchDetail({
  alert,
  detailReadState,
  detailReadMessage,
  note,
  ownerInput,
  reviewLabel,
  reviewState,
  isSubmitting,
  activeAlertId,
  explanation,
  explanationError,
  isExplaining,
  isAttachingExplanation,
  feedbackNote,
  isSubmittingFeedback,
  session,
  onNoteChange,
  onOwnerChange,
  onReviewLabelChange,
  onReviewStateChange,
  onExplain,
  onRegenerate,
  onFeedbackNoteChange,
  onSubmitFeedback,
  onAttachExplanation,
  onAssign,
  onUnassign,
  onApplyReviewState,
  onAcknowledge,
  onResolve
}: AlertsWorkbenchDetailProps) {
  const lifecycleGuard = deriveProtectedOperatorUiGuard(session);
  const triageGuard = deriveProtectedOperatorUiGuard(session, {
    sliceLabel: session.secondaryGuardedSliceLabel
  });

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {detailReadState ? (
        <p style={{ margin: 0, color: detailReadState === "error" || detailReadState === "blocked" ? "#fbbf24" : "#94a3b8" }}>
          Detail access: {detailReadState}. {detailReadMessage}
        </p>
      ) : null}
      <div style={sectionStyle}>
        <strong>Alert snapshot</strong>
        <p style={mutedTextStyle}>Use this summary to understand the current owner, review state, and latest note before taking triage actions.</p>
        <div style={{ display: "grid", gap: "0.35rem", color: "#cbd5e1" }}>
          <div>Status: {alert.status}</div>
          <div>Severity: {alert.severity}</div>
          <div>Source: {alert.source}</div>
          <div>Pond: {alert.pondId ?? "Not linked"}</div>
          <div>Owner: {alert.assignedTo ?? "Unassigned"}</div>
          <div>Review state: {alert.reviewState ?? "unreviewed"}</div>
          <div>Review tag: {alert.reviewLabel ?? "None"}</div>
        </div>
        <div style={{ color: "#cbd5e1" }}>
          <strong style={{ color: "#e2e8f0" }}>Latest note:</strong> {alert.latestNote ?? "No operator note attached yet."}
        </div>
      </div>
      <div style={sectionStyle}>
        <strong>Operator triage</strong>
        <p style={mutedTextStyle}>These actions remain manual. Update the note, owner, or review state before acknowledging or resolving.</p>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Operator note</span>
          <input
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Add context for the next operator or reviewer"
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Assign to owner</span>
          <input
            value={ownerInput}
            onChange={(event) => onOwnerChange(event.target.value)}
            placeholder="operator-queue"
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
          />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" disabled={isSubmitting || !triageGuard.enabled} onClick={onAssign} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isSubmitting && activeAlertId === alert.id ? "Working..." : "Assign owner"}
          </button>
          <button type="button" disabled={isSubmitting || !alert.assignedTo || !triageGuard.enabled} onClick={onUnassign} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isSubmitting && activeAlertId === alert.id ? "Working..." : "Return to shared queue"}
          </button>
        </div>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Review state</span>
          <select
            value={reviewState}
            onChange={(event) => onReviewStateChange(event.target.value as AlertReviewState)}
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
          >
            {reviewStateOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Review tag</span>
          <input
            value={reviewLabel}
            onChange={(event) => onReviewLabelChange(event.target.value)}
            placeholder="water-quality, feed, urgent..."
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
          />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" disabled={isSubmitting || !triageGuard.enabled} onClick={onApplyReviewState} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isSubmitting && activeAlertId === alert.id ? "Working..." : "Save review state"}
          </button>
          <button type="button" disabled={isSubmitting || alert.status !== "open" || !lifecycleGuard.enabled} onClick={onAcknowledge} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isSubmitting && activeAlertId === alert.id ? "Working..." : "Acknowledge alert"}
          </button>
          <button type="button" disabled={isSubmitting || alert.status === "resolved" || !lifecycleGuard.enabled} onClick={onResolve} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isSubmitting && activeAlertId === alert.id ? "Working..." : "Resolve alert"}
          </button>
        </div>
      </div>
      {!lifecycleGuard.enabled || !triageGuard.enabled ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          {!lifecycleGuard.enabled ? lifecycleGuard.message : triageGuard.message} Review and explanation data may still be visible, but protected triage actions stay blocked until session and forwarding are sufficient.
        </p>
      ) : null}
      <div style={sectionStyle}>
        <strong>AI advisory explanation</strong>
        <p style={mutedTextStyle}>Use AI output as a review aid only. Confirm observed facts and next checks before changing workflow state.</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" disabled={isExplaining} onClick={onExplain} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isExplaining ? "Explaining..." : "Generate explanation"}
          </button>
          <button type="button" disabled={isExplaining} onClick={onRegenerate} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
            {isExplaining ? "Regenerating..." : "Regenerate explanation"}
          </button>
          <button
            type="button"
            disabled={isAttachingExplanation || !explanation}
            onClick={onAttachExplanation}
            style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
          >
            {isAttachingExplanation ? "Attaching..." : "Save explanation to review history"}
          </button>
        </div>
      </div>
      {explanation ? (
        <div style={sectionStyle}>
          <div>{explanation.headline}</div>
          <div>{explanation.summary}</div>
          <div style={{ color: "#cbd5e1" }}>{explanation.explanation}</div>
          {explanation.explanationHindi ? (
            <div style={{ color: "#bfdbfe" }}>Hindi draft: {explanation.explanationHindi}</div>
          ) : null}
          <div style={{ color: "#94a3b8" }}>
            Mode: {explanation.metadata.mode} / Model: {explanation.metadata.modelLabel} / Output: {explanation.metadata.output.outputMode} / Tone: {explanation.metadata.output.tone ?? "operator"}
          </div>
          <div style={{ color: "#94a3b8" }}>
            Explanation source: {explanation.cache.generation} / Cached at: {explanation.cache.cachedAt}
          </div>
          {explanation.feedbackSummary?.latest ? (
            <div style={{ color: "#94a3b8" }}>
              Latest feedback: {explanation.feedbackSummary.latest.value}
              {explanation.feedbackSummary.latest.note ? ` - ${explanation.feedbackSummary.latest.note}` : ""}
            </div>
          ) : null}
          <div style={{ color: "#fbbf24" }}>{explanation.advisoryDisclaimer}</div>
          <div style={{ color: "#94a3b8" }}>{explanation.confidenceNote}</div>
          {explanation.missingInformationNote ? (
            <div style={{ color: "#fbbf24" }}>{explanation.missingInformationNote}</div>
          ) : null}
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Explanation feedback note</span>
            <input
              value={feedbackNote}
              onChange={(event) => onFeedbackNoteChange(event.target.value)}
              placeholder="Optional note about whether this explanation helped"
              style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={isSubmittingFeedback}
              onClick={() => onSubmitFeedback("useful")}
              style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            >
              {isSubmittingFeedback ? "Saving..." : "Mark useful"}
            </button>
            <button
              type="button"
              disabled={isSubmittingFeedback}
              onClick={() => onSubmitFeedback("not_useful")}
              style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            >
              {isSubmittingFeedback ? "Saving..." : "Mark not useful"}
            </button>
            <button
              type="button"
              disabled={isSubmittingFeedback}
              onClick={() => onSubmitFeedback("neutral")}
              style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            >
              {isSubmittingFeedback ? "Saving..." : "Mark neutral"}
            </button>
          </div>
          {explanation.observedFacts.length ? (
            <div style={{ display: "grid", gap: "0.35rem" }}>
              <strong style={{ color: "#e2e8f0" }}>Observed facts</strong>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {explanation.observedFacts.map((fact) => (
                  <li key={`fact:${fact}`}>{fact}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {explanation.likelyFactors.length ? (
            <div style={{ display: "grid", gap: "0.35rem" }}>
              <strong style={{ color: "#e2e8f0" }}>Likely factors</strong>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {explanation.likelyFactors.map((cause) => (
                  <li key={`${cause.category}:${cause.label}`}>
                    {cause.label} [{cause.likelihood}] - {cause.rationale}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {explanation.immediateChecks.length ? (
            <div style={{ display: "grid", gap: "0.35rem" }}>
              <strong style={{ color: "#e2e8f0" }}>Immediate checks</strong>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {explanation.immediateChecks.map((step) => (
                  <li key={`check:${step.title}`}>
                    {step.title} ({step.priority}) - {step.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {explanation.escalationConsiderations.length ? (
            <div style={{ display: "grid", gap: "0.35rem" }}>
              <strong style={{ color: "#e2e8f0" }}>Escalation considerations</strong>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {explanation.escalationConsiderations.map((item) => (
                  <li key={`escalation:${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {explanation.suggestedActions.length ? (
            <div style={{ display: "grid", gap: "0.35rem" }}>
              <strong style={{ color: "#e2e8f0" }}>Suggested manual actions</strong>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {explanation.suggestedActions.map((step) => (
                  <li key={`action:${step.title}`}>
                    {step.title} ({step.priority}) - {step.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {explanationError ? <p style={{ margin: 0, color: "#fca5a5" }}>{explanationError}</p> : null}
      <div style={sectionStyle}>
        <strong>Action history</strong>
        <p style={mutedTextStyle}>Use this timeline to understand what has already been acknowledged, assigned, or reviewed before taking the next manual step.</p>
        {alert.actionHistory?.length ? (
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {alert.actionHistory.map((item, index) => (
              <li key={`${alert.id}-${item.action}-${item.timestamp}-${index}`}>
                {item.action} at {item.timestamp}
                {item.assignedTo ? ` by/for ${item.assignedTo}` : ""}
                {item.reviewState ? ` [${item.reviewState}]` : ""}
                {item.reviewLabel ? ` (${item.reviewLabel})` : ""}
                {item.note ? ` - ${item.note}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ color: "#94a3b8" }}>No recorded action history is available yet for this alert.</span>
        )}
      </div>
    </div>
  );
}
