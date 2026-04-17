"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AiAlertsExplainResponse,
  type AlertExplanationFeedbackValue,
  alertQueuePresetDefinitions,
  type AlertQueuePresetId,
  type AlertQueueSummary,
  type AlertReviewState,
  type AlertSavedViewDefinition,
  type AlertSummary
} from "@aquapulse/types";
import type { AlertsListQuery } from "@web/contracts/api";
import {
  getAlertsRuntimeDiagnostics,
  parseClientRuntimeConfig
} from "@web/clients/runtime-config";
import { submitAlertLifecycleAction, type AlertLifecycleSubmissionResult } from "@web/features/alert-lifecycle";
import {
  createAlertSavedViewsRepositoryStore,
  createAlertSavedViewsStore,
  defaultAlertWorkbenchOwner,
  deriveOwnerAlertIndicators,
  getAlertPresetQuery,
  getAlertSummaryQuery
} from "@web/features/alert-workbench";
import {
  deriveAlertsRuntimeIndicator,
  formatAlertsRuntimeError
} from "@web/features/alerts-runtime";
import {
  submitAlertTriageAction,
  type AlertAssignSubmissionResult,
  type AlertReviewStateSubmissionResult,
  type AlertUnassignSubmissionResult
} from "@web/features/alert-triage";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";
import { createRepositoriesFromConfig } from "@web/repositories";
import { AlertsWorkbenchQueue } from "./alerts-workbench-queue";

interface AlertsActionListProps {
  readonly initialAlerts: AlertSummary[];
  readonly initialSummary: AlertQueueSummary;
}

type AlertQueueSubmissionResult =
  | AlertLifecycleSubmissionResult
  | AlertAssignSubmissionResult
  | AlertUnassignSubmissionResult
  | AlertReviewStateSubmissionResult;

const reviewStateOptions: AlertReviewState[] = ["unreviewed", "under_review", "reviewed", "deferred"];

export function AlertsActionList({ initialAlerts, initialSummary }: AlertsActionListProps) {
  const runtimeConfig = useMemo(
    () =>
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const runtimeDiagnostics = useMemo(() => getAlertsRuntimeDiagnostics(runtimeConfig), [runtimeConfig]);
  const runtimeIndicator = useMemo(() => deriveAlertsRuntimeIndicator(runtimeConfig), [runtimeConfig]);
  const savedViewsStore = useMemo(
    () =>
      runtimeDiagnostics.effectiveMode === "http"
        ? createAlertSavedViewsRepositoryStore(repositories.alerts)
        : createAlertSavedViewsStore(typeof window === "undefined" ? undefined : window.localStorage),
    [repositories.alerts, runtimeDiagnostics.effectiveMode]
  );
  const [alerts, setAlerts] = useState(initialAlerts);
  const [summary, setSummary] = useState(initialSummary);
  const [detailAlertId, setDetailAlertId] = useState<string | null>(null);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ownerInputs, setOwnerInputs] = useState<Record<string, string>>({});
  const [reviewLabels, setReviewLabels] = useState<Record<string, string>>({});
  const [reviewStates, setReviewStates] = useState<Record<string, AlertReviewState>>({});
  const [explanations, setExplanations] = useState<Record<string, AiAlertsExplainResponse | undefined>>({});
  const [explanationErrors, setExplanationErrors] = useState<Record<string, string | undefined>>({});
  const [explainingAlertId, setExplainingAlertId] = useState<string | null>(null);
  const [attachingExplanationAlertId, setAttachingExplanationAlertId] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [submittingFeedbackAlertId, setSubmittingFeedbackAlertId] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<AlertSavedViewDefinition[]>([]);
  const [activeSavedViewId, setActiveSavedViewId] = useState("");
  const [savedViewName, setSavedViewName] = useState("");
  const [bulkOwner, setBulkOwner] = useState(defaultAlertWorkbenchOwner);
  const [bulkNote, setBulkNote] = useState("");
  const [bulkReviewState, setBulkReviewState] = useState<AlertReviewState>("under_review");
  const [bulkReviewLabel, setBulkReviewLabel] = useState("");
  const [presetId, setPresetId] = useState<AlertQueuePresetId | "custom">("custom");
  const [statusFilter, setStatusFilter] = useState<AlertsListQuery["status"] | "all">("all");
  const [sortBy, setSortBy] = useState<NonNullable<AlertsListQuery["sortBy"]>>("updatedAt_desc");
  const [hasLatestNoteOnly, setHasLatestNoteOnly] = useState(false);
  const [pondIdFilter, setPondIdFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [reviewStateFilter, setReviewStateFilter] = useState<AlertReviewState | "all">("all");
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [result, setResult] = useState<AlertQueueSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const ownerIndicators = deriveOwnerAlertIndicators(summary, defaultAlertWorkbenchOwner);
  const reviewQueueQuery = useMemo<AlertsListQuery>(() => ({ page: 1, pageSize: 20, status: statusFilter === "all" ? undefined : statusFilter, hasLatestNote: hasLatestNoteOnly ? true : undefined, pondId: pondIdFilter.trim() || undefined, assignedTo: assignedToFilter.trim() || undefined, reviewState: reviewStateFilter === "all" ? undefined : reviewStateFilter, sortBy }), [assignedToFilter, hasLatestNoteOnly, pondIdFilter, reviewStateFilter, sortBy, statusFilter]);
  const allVisibleSelected = alerts.length > 0 && alerts.every((alert) => selectedAlertIds.includes(alert.id));
  const reportRuntimeError = useCallback(
    (error: unknown) => {
      setFeedbackTone("error");
      setFeedbackMessage(formatAlertsRuntimeError(error, runtimeConfig));
    },
    [runtimeConfig]
  );

  const applyQueryState = useCallback((query: Partial<AlertsListQuery>) => {
    setStatusFilter((query.status as AlertsListQuery["status"] | undefined) ?? "all");
    setReviewStateFilter((query.reviewState as AlertReviewState | undefined) ?? "all");
    setSortBy((query.sortBy as NonNullable<AlertsListQuery["sortBy"]> | undefined) ?? "updatedAt_desc");
    setHasLatestNoteOnly(Boolean(query.hasLatestNote));
    setPondIdFilter(query.pondId ?? "");
    setAssignedToFilter(query.assignedTo ?? "");
  }, []);

  const refreshQueue = useCallback(async () => {
    setIsRefreshingQueue(true);
    try {
      const [response, summaryResponse] = await Promise.all([
        repositories.alerts.list(reviewQueueQuery),
        repositories.alerts.summary(getAlertSummaryQuery(reviewQueueQuery))
      ]);
      setAlerts(response.data.items);
      setSummary(summaryResponse.data);
      setSelectedAlertIds((current) =>
        current.filter((id) => response.data.items.some((item) => item.id === id))
      );
      return true;
    } catch (error) {
      reportRuntimeError(error);
      return false;
    } finally {
      setIsRefreshingQueue(false);
    }
  }, [repositories.alerts, reportRuntimeError, reviewQueueQuery]);

  const handleExplainAlertWithOptions = useCallback(
    async (alertId: string, options: { readonly reuseCached?: boolean } = {}) => {
      setExplainingAlertId(alertId);
      setExplanationErrors((current) => ({ ...current, [alertId]: undefined }));
      try {
        const response = await repositories.alerts.explain({
          alertId,
          includeRecommendations: true,
          reuseCached: options.reuseCached
        });
        setExplanations((current) => ({ ...current, [alertId]: response.data }));
        setFeedbackTone("success");
        setFeedbackMessage(
          response.data.cache.generation === "cached_reuse"
            ? "Reused the cached advisory explanation."
            : "Generated a fresh advisory explanation."
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Alert explanation could not be generated.";
        setExplanationErrors((current) => ({ ...current, [alertId]: message }));
        reportRuntimeError(error);
      } finally {
        setExplainingAlertId(null);
      }
    },
    [repositories.alerts, reportRuntimeError]
  );

  const handleSubmitExplanationFeedback = useCallback(
    async (alertId: string, value: AlertExplanationFeedbackValue) => {
      const explanation = explanations[alertId];
      if (!explanation) {
        setFeedbackTone("error");
        setFeedbackMessage("Load an explanation before recording feedback.");
        return;
      }

      setSubmittingFeedbackAlertId(alertId);
      try {
        const response = await repositories.alerts.submitExplanationFeedback({
          alertId,
          value,
          note: feedbackNotes[alertId]?.trim() || undefined,
          explanation
        });
        setExplanations((current) => {
          const existing = current[alertId];
          if (!existing) {
            return current;
          }

          return {
            ...current,
            [alertId]: {
              ...existing,
              feedbackSummary: {
                latest: response.data
              }
            }
          };
        });
        setFeedbackNotes((current) => ({ ...current, [alertId]: "" }));
        setFeedbackTone("success");
        setFeedbackMessage("Saved advisory explanation feedback.");
      } catch (error) {
        reportRuntimeError(error);
      } finally {
        setSubmittingFeedbackAlertId(null);
      }
    },
    [explanations, feedbackNotes, reportRuntimeError, repositories.alerts]
  );

  const handleAttachExplanation = useCallback(
    async (alertId: string) => {
      const explanation = explanations[alertId];
      if (!explanation) {
        setFeedbackTone("error");
        setFeedbackMessage("Generate or load an explanation before attaching it to alert history.");
        return;
      }

      setAttachingExplanationAlertId(alertId);
      try {
        await repositories.alerts.attachExplanation(alertId, {
          explanation,
          note: notes[alertId]?.trim() || undefined
        });
        const refreshed = await refreshQueue();
        setFeedbackTone("success");
        setFeedbackMessage(
          refreshed
            ? "Attached the advisory explanation snapshot to alert history."
            : "Attached the advisory explanation snapshot, but the queue refresh did not complete."
        );
      } catch (error) {
        reportRuntimeError(error);
      } finally {
        setAttachingExplanationAlertId(null);
      }
    },
    [explanations, notes, refreshQueue, reportRuntimeError, repositories.alerts]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSavedViews() {
      try {
        const nextSavedViews = await savedViewsStore.list();
        if (!cancelled) {
          setSavedViews(nextSavedViews);
        }
      } catch (error) {
        if (!cancelled) {
          reportRuntimeError(error);
        }
      }
    }

    void loadSavedViews();

    return () => {
      cancelled = true;
    };
  }, [reportRuntimeError, savedViewsStore]);

  useEffect(() => {
    let cancelled = false;
    async function runRefresh() {
      setIsRefreshingQueue(true);
      try {
        const [response, summaryResponse] = await Promise.all([
          repositories.alerts.list(reviewQueueQuery),
          repositories.alerts.summary(getAlertSummaryQuery(reviewQueueQuery))
        ]);
        if (!cancelled) {
          setAlerts(response.data.items);
          setSummary(summaryResponse.data);
          setSelectedAlertIds((current) =>
            current.filter((id) => response.data.items.some((item) => item.id === id))
          );
        }
      } catch (error) {
        if (!cancelled) {
          reportRuntimeError(error);
        }
      } finally {
        if (!cancelled) {
          setIsRefreshingQueue(false);
        }
      }
    }
    void runRefresh();
    return () => {
      cancelled = true;
    };
  }, [reportRuntimeError, repositories.alerts, reviewQueueQuery]);

  async function handleSingleAction(alertId: string, run: () => Promise<AlertQueueSubmissionResult>, message: string) {
    setActiveAlertId(alertId);
    setIsSubmitting(true);
    try {
      const submission = await run();
      setResult(submission);
      if (submission.status === "success") {
        const refreshed = await refreshQueue();
        setFeedbackTone("success");
        setFeedbackMessage(
          refreshed ? message : `${message} The queue refresh did not complete, so the visible list may be stale.`
        );
      }
    } catch (error) {
      reportRuntimeError(error);
    } finally {
      setIsSubmitting(false);
      setActiveAlertId(null);
    }
  }

  async function handleBulkAction(action: "bulkAcknowledge" | "bulkResolve" | "bulkAssign" | "bulkSetReviewState") {
    if (selectedAlertIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const response = action === "bulkAcknowledge"
        ? await repositories.alerts.bulkAcknowledge({ alertIds: selectedAlertIds, note: bulkNote.trim() || undefined })
        : action === "bulkResolve"
          ? await repositories.alerts.bulkResolve({ alertIds: selectedAlertIds, note: bulkNote.trim() || undefined })
          : action === "bulkAssign"
            ? await repositories.alerts.bulkAssign({ alertIds: selectedAlertIds, assignedTo: bulkOwner.trim() || defaultAlertWorkbenchOwner, note: bulkNote.trim() || undefined })
            : await repositories.alerts.bulkSetReviewState({ alertIds: selectedAlertIds, reviewState: bulkReviewState, reviewLabel: bulkReviewLabel.trim() || undefined, note: bulkNote.trim() || undefined });
      const refreshed = await refreshQueue();
      setSelectedAlertIds([]);
      setBulkNote("");
      setFeedbackTone("success");
      setFeedbackMessage(
        refreshed
          ? `${response.data.totalUpdated} alert${response.data.totalUpdated === 1 ? "" : "s"} updated.`
          : `${response.data.totalUpdated} alert${response.data.totalUpdated === 1 ? "" : "s"} updated, but the queue refresh did not complete.`
      );
    } catch (error) {
      reportRuntimeError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
      <div style={{ display: "grid", gap: "0.75rem", padding: "0.9rem", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "0.75rem" }}>
        <strong>Review Queue Workbench</strong>
        <div style={{ display: "grid", gap: "0.25rem", padding: "0.65rem 0.8rem", borderRadius: "0.65rem", background: "rgba(30, 41, 59, 0.45)", color: "#cbd5e1" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span>Alerts runtime: {runtimeIndicator.modeLabel}</span>
            <span>Scope: {runtimeDiagnostics.scopeLabel}</span>
            <span>Target: {runtimeIndicator.targetLabel}</span>
          </div>
          <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
          {runtimeIndicator.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`} style={{ color: "#fbbf24" }}>{warning.message}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
          <span>Open: {summary.statusCounts.open}</span><span>Acknowledged: {summary.statusCounts.acknowledged}</span><span>Resolved: {summary.statusCounts.resolved}</span><span>Assigned: {summary.assignmentCounts.assigned}</span><span>Under review: {summary.reviewStateCounts.underReview}</span><span>With notes: {summary.noteCounts.withLatestNote}</span><span>Mine: {ownerIndicators.assignedAlerts}</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Preset view</span><select value={presetId} onChange={(event) => { const nextPresetId = event.target.value as AlertQueuePresetId | "custom"; setPresetId(nextPresetId); setActiveSavedViewId(""); applyQueryState(nextPresetId === "custom" ? {} : getAlertPresetQuery(nextPresetId, defaultAlertWorkbenchOwner)); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="custom">Custom</option>{alertQueuePresetDefinitions.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Status</span><select value={statusFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setStatusFilter(event.target.value as AlertsListQuery["status"] | "all"); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="all">All</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Review state</span><select value={reviewStateFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setReviewStateFilter(event.target.value as AlertReviewState | "all"); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="all">All</option>{reviewStateOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Sort</span><select value={sortBy} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setSortBy(event.target.value as NonNullable<AlertsListQuery["sortBy"]>); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="updatedAt_desc">Newest updated</option><option value="updatedAt_asc">Oldest updated</option><option value="createdAt_desc">Newest created</option><option value="createdAt_asc">Oldest created</option></select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Pond</span><input value={pondIdFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setPondIdFilter(event.target.value); }} placeholder="pond-1" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Owner</span><input value={assignedToFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setAssignedToFilter(event.target.value); }} placeholder="operator-queue" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.6rem" }}><input type="checkbox" checked={hasLatestNoteOnly} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setHasLatestNoteOnly(event.target.checked); }} /><span>With notes only</span></label>
          <button type="button" onClick={() => { setPresetId("custom"); setActiveSavedViewId(""); applyQueryState({}); setFeedbackTone("success"); setFeedbackMessage("Filters reset."); }} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: "1px solid #475569", marginTop: "1.45rem" }}>Reset filters</button>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Saved view name</span><input value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} placeholder="Morning queue" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          <button type="button" onClick={async () => { if (!savedViewName.trim()) { setFeedbackTone("error"); setFeedbackMessage("Name the view before saving it."); return; } try { const nextViews = await savedViewsStore.save({ name: savedViewName.trim(), presetId: presetId === "custom" ? undefined : presetId, query: reviewQueueQuery }); setSavedViews(nextViews); setSavedViewName(""); setFeedbackTone("success"); setFeedbackMessage("Saved the current queue view."); } catch (error) { reportRuntimeError(error); } }} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Save current view</button>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Saved views</span><select value={activeSavedViewId} onChange={(event) => { const viewId = event.target.value; setActiveSavedViewId(viewId); const view = savedViews.find((item) => item.id === viewId); if (view) { setPresetId(view.presetId ?? "custom"); applyQueryState(view.query); setFeedbackTone("success"); setFeedbackMessage(`Loaded view "${view.name}".`); } }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="">Select saved view</option>{savedViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select></label>
          <button type="button" disabled={!activeSavedViewId} onClick={async () => { try { const nextViews = await savedViewsStore.remove(activeSavedViewId); setSavedViews(nextViews); setActiveSavedViewId(""); setFeedbackTone("success"); setFeedbackMessage("Removed saved view."); } catch (error) { reportRuntimeError(error); } }} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Remove saved view</button>
        </div>
        <div style={{ display: "grid", gap: "0.6rem", padding: "0.8rem", borderRadius: "0.65rem", background: "rgba(15, 23, 42, 0.55)" }}>
          <strong>Bulk actions</strong>
          <p style={{ margin: 0, color: "#94a3b8" }}>Selected alerts: {selectedAlertIds.length}</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}><span>Owner</span><input value={bulkOwner} onChange={(event) => setBulkOwner(event.target.value)} placeholder={defaultAlertWorkbenchOwner} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
            <label style={{ display: "grid", gap: "0.35rem" }}><span>Review state</span><select value={bulkReviewState} onChange={(event) => setBulkReviewState(event.target.value as AlertReviewState)} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>{reviewStateOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label style={{ display: "grid", gap: "0.35rem" }}><span>Review label</span><input value={bulkReviewLabel} onChange={(event) => setBulkReviewLabel(event.target.value)} placeholder="triage, urgent" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
            <label style={{ display: "grid", gap: "0.35rem", minWidth: "16rem" }}><span>Bulk note</span><input value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} placeholder="Optional note for the selected alerts" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0} onClick={() => handleBulkAction("bulkAcknowledge")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk acknowledge</button>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0} onClick={() => handleBulkAction("bulkResolve")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk resolve</button>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0} onClick={() => handleBulkAction("bulkAssign")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk assign</button>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0} onClick={() => handleBulkAction("bulkSetReviewState")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk review-state update</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#94a3b8" }}><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedAlertIds((current) => allVisibleSelected ? current.filter((id) => !alerts.some((alert) => alert.id === id)) : [...new Set([...current, ...alerts.map((alert) => alert.id)])])} /><span>{isRefreshingQueue ? "Refreshing queue..." : `Queue items: ${alerts.length}. Selected: ${selectedAlertIds.length}.`}</span></div>
      </div>

      <AlertsWorkbenchQueue
        alerts={alerts}
        detailAlertId={detailAlertId}
        selectedAlertIds={selectedAlertIds}
        isSubmitting={isSubmitting}
        activeAlertId={activeAlertId}
        notes={notes}
        ownerInputs={ownerInputs}
        reviewLabels={reviewLabels}
        reviewStates={reviewStates}
        explanations={explanations}
        explanationErrors={explanationErrors}
        explainingAlertId={explainingAlertId}
        attachingExplanationAlertId={attachingExplanationAlertId}
        feedbackNotes={feedbackNotes}
        submittingFeedbackAlertId={submittingFeedbackAlertId}
        onToggleSelection={(alertId) => setSelectedAlertIds((current) => current.includes(alertId) ? current.filter((item) => item !== alertId) : [...current, alertId])}
        onToggleDetail={(alertId) => setDetailAlertId((current) => current === alertId ? null : alertId)}
        onNoteChange={(alertId, value) => setNotes((current) => ({ ...current, [alertId]: value }))}
        onOwnerChange={(alertId, value) => setOwnerInputs((current) => ({ ...current, [alertId]: value }))}
        onReviewLabelChange={(alertId, value) => setReviewLabels((current) => ({ ...current, [alertId]: value }))}
        onReviewStateChange={(alertId, value) => setReviewStates((current) => ({ ...current, [alertId]: value }))}
        onExplain={handleExplainAlertWithOptions}
        onFeedbackNoteChange={(alertId, value) => setFeedbackNotes((current) => ({ ...current, [alertId]: value }))}
        onSubmitFeedback={handleSubmitExplanationFeedback}
        onAttachExplanation={handleAttachExplanation}
        onAssign={(alertId) => handleSingleAction(alertId, () => submitAlertTriageAction("assign", alertId, { assignedTo: ownerInputs[alertId]?.trim() ?? defaultAlertWorkbenchOwner, note: notes[alertId]?.trim() || undefined }), "Alert owner updated.")}
        onUnassign={(alertId) => handleSingleAction(alertId, () => submitAlertTriageAction("unassign", alertId, { note: notes[alertId]?.trim() || undefined }), "Alert returned to the general queue.")}
        onApplyReviewState={(alertId) => handleSingleAction(alertId, () => submitAlertTriageAction("setReviewState", alertId, { reviewState: reviewStates[alertId] ?? "under_review", reviewLabel: reviewLabels[alertId]?.trim() || undefined, note: notes[alertId]?.trim() || undefined }), "Review flow updated.")}
        onAcknowledge={(alertId) => handleSingleAction(alertId, () => submitAlertLifecycleAction("acknowledge", alertId, { note: notes[alertId]?.trim() || undefined }), "Alert acknowledged successfully.")}
        onResolve={(alertId) => handleSingleAction(alertId, () => submitAlertLifecycleAction("resolve", alertId, { note: notes[alertId]?.trim() || undefined }), "Alert resolved successfully.")}
      />

      {feedbackMessage ? <p style={{ margin: 0, color: feedbackTone === "success" ? "#86efac" : "#fca5a5" }}>{feedbackMessage}</p> : null}
      {pageState.status === "success" ? <p style={{ margin: 0, color: "#86efac" }}>Alert updated to {pageState.data?.status}. Refreshed alerts: {pageState.refreshedList?.items.length ?? 0}.</p> : null}
      {pageState.status === "validation_error" ? <p style={{ margin: 0, color: "#fca5a5" }}>{Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}</p> : null}
    </div>
  );
}
