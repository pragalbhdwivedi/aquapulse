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

export function AlertsWorkbenchDetail({
  alert,
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
    sliceLabel: session.secondaryGuardedSliceLabel,
    enforcedByBackend: false
  });

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div>Status: {alert.status}</div>
      <div>Source: {alert.source}</div>
      <div>Pond: {alert.pondId ?? "N/A"}</div>
      <div>Owner: {alert.assignedTo ?? "Unassigned"}</div>
      <div>Review state: {alert.reviewState ?? "unreviewed"}</div>
      <div>Review label: {alert.reviewLabel ?? "N/A"}</div>
      <div>Latest note: {alert.latestNote ?? "None"}</div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Review note</span>
        <input
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Optional operator note"
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Assign owner</span>
        <input
          value={ownerInput}
          onChange={(event) => onOwnerChange(event.target.value)}
          placeholder="operator-queue"
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" disabled={isExplaining} onClick={onExplain} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isExplaining ? "Explaining..." : "Explain alert"}
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
          {isAttachingExplanation ? "Attaching..." : "Attach explanation to history"}
        </button>
        <button type="button" disabled={isSubmitting || !triageGuard.enabled} onClick={onAssign} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Assign"}
        </button>
        <button type="button" disabled={isSubmitting || !alert.assignedTo || !triageGuard.enabled} onClick={onUnassign} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Unassign"}
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
        <span>Review label</span>
        <input
          value={reviewLabel}
          onChange={(event) => onReviewLabelChange(event.target.value)}
          placeholder="water-quality, feed, urgent..."
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" disabled={isSubmitting || !triageGuard.enabled} onClick={onApplyReviewState} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Apply review state"}
        </button>
        <button type="button" disabled={isSubmitting || alert.status !== "open" || !lifecycleGuard.enabled} onClick={onAcknowledge} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Acknowledge"}
        </button>
        <button type="button" disabled={isSubmitting || alert.status === "resolved" || !lifecycleGuard.enabled} onClick={onResolve} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Resolve"}
        </button>
      </div>
      {!lifecycleGuard.enabled || !triageGuard.enabled ? (
        <p style={{ margin: 0, color: "#fbbf24" }}>
          {!lifecycleGuard.enabled ? lifecycleGuard.message : triageGuard.message}
        </p>
      ) : null}
      {explanation ? (
        <div style={{ display: "grid", gap: "0.35rem", padding: "0.8rem", borderRadius: "0.65rem", background: "rgba(15, 23, 42, 0.55)" }}>
          <strong>AI advisory explanation</strong>
          <div>{explanation.summary}</div>
          <div style={{ color: "#cbd5e1" }}>{explanation.explanation}</div>
          <div style={{ color: "#94a3b8" }}>
            Mode: {explanation.metadata.mode} / Model: {explanation.metadata.modelLabel}
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
          {explanation.likelyCauses.length ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {explanation.likelyCauses.map((cause) => (
                <li key={`${cause.category}:${cause.label}`}>
                  {cause.label} [{cause.likelihood}] - {cause.rationale}
                </li>
              ))}
            </ul>
          ) : null}
          {explanation.recommendedChecks.length ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {explanation.recommendedChecks.map((step) => (
                <li key={`check:${step.title}`}>
                  Check: {step.title} ({step.priority}) - {step.detail}
                </li>
              ))}
            </ul>
          ) : null}
          {explanation.suggestedActions.length ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {explanation.suggestedActions.map((step) => (
                <li key={`action:${step.title}`}>
                  Action: {step.title} ({step.priority}) - {step.detail}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {explanationError ? <p style={{ margin: 0, color: "#fca5a5" }}>{explanationError}</p> : null}
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
      ) : null}
    </div>
  );
}
