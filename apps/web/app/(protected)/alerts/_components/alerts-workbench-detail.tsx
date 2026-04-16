"use client";

import type { AlertReviewState, AlertSummary } from "@aquapulse/types";

interface AlertsWorkbenchDetailProps {
  readonly alert: AlertSummary;
  readonly note: string;
  readonly ownerInput: string;
  readonly reviewLabel: string;
  readonly reviewState: AlertReviewState;
  readonly isSubmitting: boolean;
  readonly activeAlertId: string | null;
  readonly onNoteChange: (value: string) => void;
  readonly onOwnerChange: (value: string) => void;
  readonly onReviewLabelChange: (value: string) => void;
  readonly onReviewStateChange: (value: AlertReviewState) => void;
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
  onNoteChange,
  onOwnerChange,
  onReviewLabelChange,
  onReviewStateChange,
  onAssign,
  onUnassign,
  onApplyReviewState,
  onAcknowledge,
  onResolve
}: AlertsWorkbenchDetailProps) {
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
        <button type="button" disabled={isSubmitting} onClick={onAssign} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Assign"}
        </button>
        <button type="button" disabled={isSubmitting || !alert.assignedTo} onClick={onUnassign} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
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
        <button type="button" disabled={isSubmitting} onClick={onApplyReviewState} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Apply review state"}
        </button>
        <button type="button" disabled={isSubmitting || alert.status !== "open"} onClick={onAcknowledge} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Acknowledge"}
        </button>
        <button type="button" disabled={isSubmitting || alert.status === "resolved"} onClick={onResolve} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>
          {isSubmitting && activeAlertId === alert.id ? "Working..." : "Resolve"}
        </button>
      </div>
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
