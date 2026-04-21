"use client";

import type {
  AiAlertsExplainResponse,
  AlertExplanationFeedbackValue,
  FrontendSessionBootstrapStatus,
  AlertReviewState,
  AlertSummary
} from "@aquapulse/types";
import { AlertsWorkbenchDetail } from "./alerts-workbench-detail";

interface AlertsWorkbenchQueueProps {
  readonly alerts: AlertSummary[];
  readonly detailAlerts: Record<string, AlertSummary | undefined>;
  readonly detailReadStates: Record<string, "enabled" | "loading" | "blocked" | "bypassed" | "error" | undefined>;
  readonly detailReadMessages: Record<string, string | undefined>;
  readonly detailAlertId: string | null;
  readonly selectedAlertIds: string[];
  readonly isSubmitting: boolean;
  readonly activeAlertId: string | null;
  readonly notes: Record<string, string>;
  readonly ownerInputs: Record<string, string>;
  readonly reviewLabels: Record<string, string>;
  readonly reviewStates: Record<string, AlertReviewState>;
  readonly explanations: Record<string, AiAlertsExplainResponse | undefined>;
  readonly explanationErrors: Record<string, string | undefined>;
  readonly explainingAlertId: string | null;
  readonly attachingExplanationAlertId: string | null;
  readonly feedbackNotes: Record<string, string>;
  readonly submittingFeedbackAlertId: string | null;
  readonly session: FrontendSessionBootstrapStatus;
  readonly onToggleSelection: (alertId: string) => void;
  readonly onToggleDetail: (alertId: string) => void | Promise<void>;
  readonly onNoteChange: (alertId: string, value: string) => void;
  readonly onOwnerChange: (alertId: string, value: string) => void;
  readonly onReviewLabelChange: (alertId: string, value: string) => void;
  readonly onReviewStateChange: (alertId: string, value: AlertReviewState) => void;
  readonly onExplain: (alertId: string, options?: { readonly reuseCached?: boolean }) => void;
  readonly onFeedbackNoteChange: (alertId: string, value: string) => void;
  readonly onSubmitFeedback: (alertId: string, value: AlertExplanationFeedbackValue) => void;
  readonly onAttachExplanation: (alertId: string) => void;
  readonly onAssign: (alertId: string) => void;
  readonly onUnassign: (alertId: string) => void;
  readonly onApplyReviewState: (alertId: string) => void;
  readonly onAcknowledge: (alertId: string) => void;
  readonly onResolve: (alertId: string) => void;
}

export function AlertsWorkbenchQueue(props: AlertsWorkbenchQueueProps) {
  const {
    alerts,
    detailAlerts,
    detailReadStates,
    detailReadMessages,
    detailAlertId,
    selectedAlertIds,
    isSubmitting,
    activeAlertId,
    notes,
    ownerInputs,
    reviewLabels,
    reviewStates,
    explanations,
    explanationErrors,
    explainingAlertId,
    attachingExplanationAlertId,
    feedbackNotes,
    submittingFeedbackAlertId,
    session,
    onToggleSelection,
    onToggleDetail,
    onNoteChange,
    onOwnerChange,
    onReviewLabelChange,
    onReviewStateChange,
    onExplain,
    onFeedbackNoteChange,
    onSubmitFeedback,
    onAttachExplanation,
    onAssign,
    onUnassign,
    onApplyReviewState,
    onAcknowledge,
    onResolve
  } = props;

  if (alerts.length === 0) {
    return (
      <div style={{ padding: "1rem", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "0.75rem", color: "#94a3b8" }}>
        No alerts match the current queue filters.
      </div>
    );
  }

  return (
    <ul style={{ display: "grid", gap: "0.75rem", padding: 0, margin: 0, listStyle: "none" }}>
      {alerts.map((alert) => {
        const detailAlert = detailAlerts[alert.id] ?? alert;
        const isSelected = selectedAlertIds.includes(alert.id);
        const isDetailOpen = detailAlertId === alert.id;

        return (
          <li
            key={alert.id}
            style={{
              display: "grid",
              gap: "0.6rem",
              padding: "0.9rem",
              border: isDetailOpen ? "1px solid rgba(56, 189, 248, 0.55)" : "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: "0.75rem"
            }}
          >
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(alert.id)} />
              <button type="button" onClick={() => onToggleDetail(alert.id)} style={{ padding: "0.35rem 0.7rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
                {isDetailOpen ? "Hide detail" : "Open detail"}
              </button>
              <strong>{alert.title}</strong>
              <span>[{alert.severity}]</span>
              <span>{alert.status}</span>
              <span>{alert.assignedTo ?? "Unassigned"}</span>
              <span>{alert.reviewState ?? "unreviewed"}</span>
            </div>
            {alert.latestNote ? <div>Latest note: {alert.latestNote}</div> : null}
            {isDetailOpen ? (
              <AlertsWorkbenchDetail
                alert={detailAlert}
                detailReadState={detailReadStates[alert.id]}
                detailReadMessage={detailReadMessages[alert.id]}
                note={notes[alert.id] ?? ""}
                ownerInput={ownerInputs[alert.id] ?? alert.assignedTo ?? ""}
                reviewLabel={reviewLabels[alert.id] ?? alert.reviewLabel ?? ""}
                reviewState={reviewStates[alert.id] ?? alert.reviewState ?? "unreviewed"}
                isSubmitting={isSubmitting}
                activeAlertId={activeAlertId}
                explanation={explanations[alert.id]}
                explanationError={explanationErrors[alert.id]}
                isExplaining={explainingAlertId === alert.id}
                isAttachingExplanation={attachingExplanationAlertId === alert.id}
                feedbackNote={feedbackNotes[alert.id] ?? ""}
                isSubmittingFeedback={submittingFeedbackAlertId === alert.id}
                session={session}
                onNoteChange={(value) => onNoteChange(alert.id, value)}
                onOwnerChange={(value) => onOwnerChange(alert.id, value)}
                onReviewLabelChange={(value) => onReviewLabelChange(alert.id, value)}
                onReviewStateChange={(value) => onReviewStateChange(alert.id, value)}
                onExplain={() => onExplain(alert.id)}
                onRegenerate={() => onExplain(alert.id, { reuseCached: false })}
                onFeedbackNoteChange={(value) => onFeedbackNoteChange(alert.id, value)}
                onSubmitFeedback={(value) => onSubmitFeedback(alert.id, value)}
                onAttachExplanation={() => onAttachExplanation(alert.id)}
                onAssign={() => onAssign(alert.id)}
                onUnassign={() => onUnassign(alert.id)}
                onApplyReviewState={() => onApplyReviewState(alert.id)}
                onAcknowledge={() => onAcknowledge(alert.id)}
                onResolve={() => onResolve(alert.id)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
