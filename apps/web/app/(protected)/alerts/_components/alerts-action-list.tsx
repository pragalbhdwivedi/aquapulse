"use client";

import { useState } from "react";
import type { AlertSummary } from "@aquapulse/types";
import {
  submitAlertLifecycleAction,
  type AlertLifecycleSubmissionResult
} from "@web/features/alert-lifecycle";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";

interface AlertsActionListProps {
  readonly initialAlerts: AlertSummary[];
}

export function AlertsActionList({ initialAlerts }: AlertsActionListProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AlertLifecycleSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationSyncPageState(result, isSubmitting);

  async function handleAction(action: "acknowledge" | "resolve", alertId: string) {
    setActiveAlertId(alertId);
    setIsSubmitting(true);
    const submission = await submitAlertLifecycleAction(action, alertId, {
      note: notes[alertId]?.trim() ? notes[alertId].trim() : undefined
    });
    setResult(submission);
    if (submission.status === "success" && submission.refreshedList) {
      setAlerts(submission.refreshedList.items);
      setNotes((current) => ({
        ...current,
        [alertId]: ""
      }));
    }
    setIsSubmitting(false);
    setActiveAlertId(null);
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
      <ul style={{ display: "grid", gap: "0.75rem", padding: 0, margin: 0, listStyle: "none" }}>
        {alerts.map((alert) => (
          <li
            key={alert.id}
            style={{
              display: "grid",
              gap: "0.5rem",
              padding: "0.9rem",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: "0.75rem"
            }}
          >
            <div>
              <strong>{alert.title}</strong> [{alert.severity}] {alert.pondId ? `for ${alert.pondId}` : ""}
            </div>
            <div>Status: {alert.status}</div>
            {alert.latestNote ? <div>Latest note: {alert.latestNote}</div> : null}
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Review note</span>
              <input
                value={notes[alert.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [alert.id]: event.target.value
                  }))
                }
                placeholder="Optional operator note"
                style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
              />
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                disabled={isSubmitting || alert.status !== "open"}
                onClick={() => handleAction("acknowledge", alert.id)}
                style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
              >
                {isSubmitting && activeAlertId === alert.id ? "Working..." : "Acknowledge"}
              </button>
              <button
                type="button"
                disabled={isSubmitting || alert.status === "resolved"}
                onClick={() => handleAction("resolve", alert.id)}
                style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
              >
                {isSubmitting && activeAlertId === alert.id ? "Working..." : "Resolve"}
              </button>
            </div>
            {alert.actionHistory?.length ? (
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {alert.actionHistory.map((item, index) => (
                  <li key={`${alert.id}-${item.action}-${item.timestamp}-${index}`}>
                    {item.action} at {item.timestamp}
                    {item.note ? ` - ${item.note}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      {pageState.status === "success" ? (
        <p style={{ margin: 0, color: "#86efac" }}>
          Alert updated to {pageState.data?.status}. Refreshed alerts: {pageState.refreshedList?.items.length ?? 0}.
        </p>
      ) : null}
      {pageState.status === "validation_error" ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
