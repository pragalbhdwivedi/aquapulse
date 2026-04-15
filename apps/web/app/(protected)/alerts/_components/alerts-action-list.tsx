"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AlertQueueSummary, AlertReviewState, AlertSummary } from "@aquapulse/types";
import { createApiClients } from "@web/clients";
import type { AlertsListQuery } from "@web/contracts/api";
import { submitAlertLifecycleAction, type AlertLifecycleSubmissionResult } from "@web/features/alert-lifecycle";
import {
  submitAlertTriageAction,
  type AlertAssignSubmissionResult,
  type AlertReviewStateSubmissionResult,
  type AlertUnassignSubmissionResult
} from "@web/features/alert-triage";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";
import { createRepositories } from "@web/repositories";

interface AlertsActionListProps {
  readonly initialAlerts: AlertSummary[];
  readonly initialSummary: AlertQueueSummary;
}

type AlertQueueSubmissionResult =
  | AlertLifecycleSubmissionResult
  | AlertAssignSubmissionResult
  | AlertUnassignSubmissionResult
  | AlertReviewStateSubmissionResult;

const reviewStateOptions: AlertReviewState[] = [
  "unreviewed",
  "under_review",
  "reviewed",
  "deferred"
];

export function AlertsActionList({ initialAlerts, initialSummary }: AlertsActionListProps) {
  const repositories = useMemo(() => createRepositories(createApiClients()), []);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [summary, setSummary] = useState(initialSummary);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ownerInputs, setOwnerInputs] = useState<Record<string, string>>({});
  const [reviewLabels, setReviewLabels] = useState<Record<string, string>>({});
  const [reviewStates, setReviewStates] = useState<Record<string, AlertReviewState>>({});
  const [statusFilter, setStatusFilter] = useState<AlertsListQuery["status"] | "all">("all");
  const [sortBy, setSortBy] = useState<NonNullable<AlertsListQuery["sortBy"]>>("updatedAt_desc");
  const [hasLatestNoteOnly, setHasLatestNoteOnly] = useState(false);
  const [pondIdFilter, setPondIdFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [reviewStateFilter, setReviewStateFilter] = useState<AlertReviewState | "all">("all");
  const [result, setResult] = useState<AlertQueueSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);

  const reviewQueueQuery = useMemo<AlertsListQuery>(
    () => ({
      page: 1,
      pageSize: 20,
      status: statusFilter === "all" ? undefined : statusFilter,
      hasLatestNote: hasLatestNoteOnly ? true : undefined,
      pondId: pondIdFilter.trim() || undefined,
      assignedTo: assignedToFilter.trim() || undefined,
      reviewState: reviewStateFilter === "all" ? undefined : reviewStateFilter,
      sortBy
    }),
    [assignedToFilter, hasLatestNoteOnly, pondIdFilter, reviewStateFilter, sortBy, statusFilter]
  );

  const summaryQuery = useMemo<AlertsListQuery>(
    () => ({
      ...reviewQueueQuery,
      status: undefined,
      reviewState: undefined
    }),
    [reviewQueueQuery]
  );

  const refreshQueue = useCallback(async () => {
    setIsRefreshingQueue(true);
    const [response, summaryResponse] = await Promise.all([
      repositories.alerts.list(reviewQueueQuery),
      repositories.alerts.summary(summaryQuery)
    ]);
    setAlerts(response.data.items);
    setSummary(summaryResponse.data);
    setIsRefreshingQueue(false);
  }, [repositories, reviewQueueQuery, summaryQuery]);

  useEffect(() => {
    let cancelled = false;

    async function runRefresh() {
      setIsRefreshingQueue(true);
      const [response, summaryResponse] = await Promise.all([
        repositories.alerts.list(reviewQueueQuery),
        repositories.alerts.summary(summaryQuery)
      ]);
      if (!cancelled) {
        setAlerts(response.data.items);
        setSummary(summaryResponse.data);
        setIsRefreshingQueue(false);
      }
    }

    void runRefresh();

    return () => {
      cancelled = true;
    };
  }, [repositories, reviewQueueQuery, summaryQuery]);

  async function handleLifecycleAction(action: "acknowledge" | "resolve", alertId: string) {
    setActiveAlertId(alertId);
    setIsSubmitting(true);
    const submission = await submitAlertLifecycleAction(action, alertId, {
      note: notes[alertId]?.trim() ? notes[alertId].trim() : undefined
    });
    setResult(submission);
    if (submission.status === "success") {
      await refreshQueue();
      setNotes((current) => ({ ...current, [alertId]: "" }));
    }
    setIsSubmitting(false);
    setActiveAlertId(null);
  }

  async function handleAssign(alertId: string) {
    setActiveAlertId(alertId);
    setIsSubmitting(true);
    const submission = await submitAlertTriageAction("assign", alertId, {
      assignedTo: ownerInputs[alertId]?.trim() ?? "",
      note: notes[alertId]?.trim() || undefined
    });
    setResult(submission);
    if (submission.status === "success") {
      await refreshQueue();
    }
    setIsSubmitting(false);
    setActiveAlertId(null);
  }

  async function handleUnassign(alertId: string) {
    setActiveAlertId(alertId);
    setIsSubmitting(true);
    const submission = await submitAlertTriageAction("unassign", alertId, {
      note: notes[alertId]?.trim() || undefined
    });
    setResult(submission);
    if (submission.status === "success") {
      await refreshQueue();
      setOwnerInputs((current) => ({ ...current, [alertId]: "" }));
    }
    setIsSubmitting(false);
    setActiveAlertId(null);
  }

  async function handleReviewState(alertId: string) {
    setActiveAlertId(alertId);
    setIsSubmitting(true);
    const submission = await submitAlertTriageAction("setReviewState", alertId, {
      reviewState: reviewStates[alertId] ?? "under_review",
      reviewLabel: reviewLabels[alertId]?.trim() || undefined,
      note: notes[alertId]?.trim() || undefined
    });
    setResult(submission);
    if (submission.status === "success") {
      await refreshQueue();
    }
    setIsSubmitting(false);
    setActiveAlertId(null);
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          padding: "0.9rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong>Review Queue</strong>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
          <span>Open: {summary.statusCounts.open}</span>
          <span>Acknowledged: {summary.statusCounts.acknowledged}</span>
          <span>Resolved: {summary.statusCounts.resolved}</span>
          <span>Assigned: {summary.assignmentCounts.assigned}</span>
          <span>Unassigned: {summary.assignmentCounts.unassigned}</span>
          <span>Under review: {summary.reviewStateCounts.underReview}</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AlertsListQuery["status"] | "all")
              }
              style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Review state</span>
            <select
              value={reviewStateFilter}
              onChange={(event) =>
                setReviewStateFilter(event.target.value as AlertReviewState | "all")
              }
              style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            >
              <option value="all">All</option>
              {reviewStateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as NonNullable<AlertsListQuery["sortBy"]>)
              }
              style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            >
              <option value="updatedAt_desc">Newest updated</option>
              <option value="updatedAt_asc">Oldest updated</option>
              <option value="createdAt_desc">Newest created</option>
              <option value="createdAt_asc">Oldest created</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Pond</span>
            <input
              value={pondIdFilter}
              onChange={(event) => setPondIdFilter(event.target.value)}
              placeholder="pond-1"
              style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Owner</span>
            <input
              value={assignedToFilter}
              onChange={(event) => setAssignedToFilter(event.target.value)}
              placeholder="user-1"
              style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.6rem" }}>
            <input
              type="checkbox"
              checked={hasLatestNoteOnly}
              onChange={(event) => setHasLatestNoteOnly(event.target.checked)}
            />
            <span>With notes only</span>
          </label>
        </div>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {isRefreshingQueue ? "Refreshing queue..." : `Queue items: ${alerts.length}`}
        </p>
      </div>
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
            <div>Owner: {alert.assignedTo ?? "Unassigned"}</div>
            <div>Review state: {alert.reviewState ?? "unreviewed"}</div>
            {alert.reviewLabel ? <div>Review label: {alert.reviewLabel}</div> : null}
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
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span>Assign owner</span>
                <input
                  value={ownerInputs[alert.id] ?? alert.assignedTo ?? ""}
                  onChange={(event) =>
                    setOwnerInputs((current) => ({
                      ...current,
                      [alert.id]: event.target.value
                    }))
                  }
                  placeholder="user-1"
                  style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
                />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAssign(alert.id)}
                  style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
                >
                  {isSubmitting && activeAlertId === alert.id ? "Working..." : "Assign"}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !alert.assignedTo}
                  onClick={() => handleUnassign(alert.id)}
                  style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
                >
                  {isSubmitting && activeAlertId === alert.id ? "Working..." : "Unassign"}
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span>Review state</span>
                <select
                  value={reviewStates[alert.id] ?? alert.reviewState ?? "unreviewed"}
                  onChange={(event) =>
                    setReviewStates((current) => ({
                      ...current,
                      [alert.id]: event.target.value as AlertReviewState
                    }))
                  }
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
                  value={reviewLabels[alert.id] ?? alert.reviewLabel ?? ""}
                  onChange={(event) =>
                    setReviewLabels((current) => ({
                      ...current,
                      [alert.id]: event.target.value
                    }))
                  }
                  placeholder="water-quality, feed, urgent..."
                  style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
                />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewState(alert.id)}
                  style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
                >
                  {isSubmitting && activeAlertId === alert.id ? "Working..." : "Apply review state"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={isSubmitting || alert.status !== "open"}
                onClick={() => handleLifecycleAction("acknowledge", alert.id)}
                style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
              >
                {isSubmitting && activeAlertId === alert.id ? "Working..." : "Acknowledge"}
              </button>
              <button
                type="button"
                disabled={isSubmitting || alert.status === "resolved"}
                onClick={() => handleLifecycleAction("resolve", alert.id)}
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
                    {item.assignedTo ? ` by/for ${item.assignedTo}` : ""}
                    {item.reviewState ? ` [${item.reviewState}]` : ""}
                    {item.reviewLabel ? ` (${item.reviewLabel})` : ""}
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
