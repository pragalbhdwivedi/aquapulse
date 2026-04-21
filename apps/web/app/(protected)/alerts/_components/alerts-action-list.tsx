"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AiAlertsExplainResponse,
  type AlertExplanationFeedbackValue,
  type FrontendAuthRuntimeDiagnostics,
  type FrontendSessionBootstrapStatus,
  buildAlertQueueSummary,
  alertQueuePresetDefinitions,
  type AlertQueuePresetId,
  type AlertQueueSummary,
  type AlertReviewState,
  type AlertSavedViewDefinition,
  type AlertSummary
} from "@aquapulse/types";
import type { AlertsListQuery } from "@web/contracts/api";
import {
  getAlertsLiveUpdatesRuntimeDiagnostics,
  getAlertsRuntimeDiagnostics,
  parseClientRuntimeConfig
} from "@web/clients/runtime-config";
import {
  createAlertLifecycleSubmitter,
  type AlertLifecycleSubmissionResult
} from "@web/features/alert-lifecycle";
import {
  connectAlertsLiveUpdates,
  describeAlertsLiveUpdatesState
} from "@web/features/alerts-live-updates";
import {
  createAlertSavedViewsRepositoryStore,
  createAlertSavedViewsStore,
  defaultAlertWorkbenchOwner,
  deriveOwnerAlertIndicators,
  buildAlertQueuePageResetKey,
  getAlertPresetQuery,
  getAlertSummaryQuery
} from "@web/features/alert-workbench";
import {
  deriveAlertsRuntimeIndicator,
  formatAlertsRuntimeError
} from "@web/features/alerts-runtime";
import {
  deriveProtectedOperatorUiGuard,
  deriveProtectedReadUiGuard,
  describeAuthAlignedSurface
} from "@web/features/auth-session";
import {
  createAlertAssignSubmitter,
  createAlertReviewStateSubmitter,
  createAlertUnassignSubmitter,
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
  readonly initialListReadState?: "enabled" | "blocked" | "bypassed" | "error";
  readonly initialListReadMessage?: string;
  readonly initialSummaryReadState?: "enabled" | "blocked" | "bypassed" | "error";
  readonly initialSummaryReadMessage?: string;
  readonly authDiagnostics: FrontendAuthRuntimeDiagnostics;
  readonly session: FrontendSessionBootstrapStatus;
}

type AlertQueueSubmissionResult =
  | AlertLifecycleSubmissionResult
  | AlertAssignSubmissionResult
  | AlertUnassignSubmissionResult
  | AlertReviewStateSubmissionResult;

const reviewStateOptions: AlertReviewState[] = ["unreviewed", "under_review", "reviewed", "deferred"];

export function AlertsActionList({
  initialAlerts,
  initialSummary,
  initialListReadState,
  initialListReadMessage,
  initialSummaryReadState,
  initialSummaryReadMessage,
  authDiagnostics,
  session
}: AlertsActionListProps) {
  const runtimeConfig = useMemo(
    () =>
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const runtimeDiagnostics = useMemo(() => getAlertsRuntimeDiagnostics(runtimeConfig), [runtimeConfig]);
  const liveUpdatesDiagnostics = useMemo(
    () => getAlertsLiveUpdatesRuntimeDiagnostics(runtimeConfig, { auth: authDiagnostics, session }),
    [authDiagnostics, runtimeConfig, session]
  );
  const runtimeIndicator = useMemo(() => deriveAlertsRuntimeIndicator(runtimeConfig), [runtimeConfig]);
  const lifecycleGuard = useMemo(() => deriveProtectedOperatorUiGuard(session), [session]);
  const triageGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.secondaryGuardedSliceLabel
      }),
    [session]
  );
  const bulkGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.tertiaryGuardedSliceLabel
      }),
    [session]
  );
  const listReadGuard = useMemo(
    () =>
      deriveProtectedReadUiGuard(session, {
        sliceLabel: session.protectedReadGuardedSliceLabel,
        enforcedByBackend: session.protectedReadGuardedSliceEnforced
      }),
    [session]
  );
  const detailReadGuard = useMemo(
    () =>
      deriveProtectedReadUiGuard(session, {
        sliceLabel:
          session.secondaryProtectedReadGuardedSliceLabel ??
          authDiagnostics.secondaryProtectedReadSliceLabel,
        enforcedByBackend:
          session.secondaryProtectedReadGuardedSliceEnforced ||
          authDiagnostics.secondaryProtectedReadSliceEnforced
      }),
    [
      authDiagnostics.secondaryProtectedReadSliceEnforced,
      authDiagnostics.secondaryProtectedReadSliceLabel,
      session
    ]
  );
  const summaryReadGuard = useMemo(
    () =>
      deriveProtectedReadUiGuard(session, {
        sliceLabel:
          session.tertiaryProtectedReadGuardedSliceLabel ??
          authDiagnostics.tertiaryProtectedReadSliceLabel,
        enforcedByBackend:
          session.tertiaryProtectedReadGuardedSliceEnforced ||
          authDiagnostics.tertiaryProtectedReadSliceEnforced
      }),
    [
      authDiagnostics.tertiaryProtectedReadSliceEnforced,
      authDiagnostics.tertiaryProtectedReadSliceLabel,
      session
    ]
  );
  const savedViewMutationGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.quaternaryGuardedSliceLabel
      }),
    [session]
  );
  const acknowledgeSubmitter = useMemo(
    () => createAlertLifecycleSubmitter(repositories, "acknowledge"),
    [repositories]
  );
  const resolveSubmitter = useMemo(
    () => createAlertLifecycleSubmitter(repositories, "resolve"),
    [repositories]
  );
  const assignSubmitter = useMemo(() => createAlertAssignSubmitter(repositories), [repositories]);
  const unassignSubmitter = useMemo(
    () => createAlertUnassignSubmitter(repositories),
    [repositories]
  );
  const reviewStateSubmitter = useMemo(
    () => createAlertReviewStateSubmitter(repositories),
    [repositories]
  );
  const savedViewsStore = useMemo(
    () =>
      runtimeDiagnostics.effectiveMode === "http"
        ? createAlertSavedViewsRepositoryStore(repositories.alerts)
        : createAlertSavedViewsStore(typeof window === "undefined" ? undefined : window.localStorage),
    [repositories.alerts, runtimeDiagnostics.effectiveMode]
  );
  const listReadSurface = useMemo(
    () =>
      describeAuthAlignedSurface({
        surfaceLabel:
          session.protectedReadGuardedSliceLabel ??
          authDiagnostics.protectedReadSliceLabel ??
          "alerts_list_read",
        exposure: "backend_protected",
        guard: listReadGuard,
        session
      }),
    [authDiagnostics.protectedReadSliceLabel, listReadGuard, session]
  );
  const detailReadSurface = useMemo(
    () =>
      describeAuthAlignedSurface({
        surfaceLabel:
          session.secondaryProtectedReadGuardedSliceLabel ??
          authDiagnostics.secondaryProtectedReadSliceLabel ??
          "alerts_detail_read",
        exposure: "backend_protected",
        guard: detailReadGuard,
        session
      }),
    [authDiagnostics.secondaryProtectedReadSliceLabel, detailReadGuard, session]
  );
  const summaryReadSurface = useMemo(
    () =>
      describeAuthAlignedSurface({
        surfaceLabel:
          session.tertiaryProtectedReadGuardedSliceLabel ??
          authDiagnostics.tertiaryProtectedReadSliceLabel ??
          "alerts_summary_read",
        exposure: "backend_protected",
        guard: summaryReadGuard,
        session
      }),
    [authDiagnostics.tertiaryProtectedReadSliceLabel, session, summaryReadGuard]
  );
  const [alerts, setAlerts] = useState(initialAlerts);
  const [summary, setSummary] = useState(initialSummary);
  const [listReadState, setListReadState] = useState<
    "enabled" | "blocked" | "bypassed" | "error"
  >(
    initialListReadState ??
      (listReadGuard.state === "disabled"
        ? "blocked"
        : listReadGuard.state === "bypassed"
          ? "bypassed"
          : "enabled")
  );
  const [listReadMessage, setListReadMessage] = useState<string>(
    initialListReadMessage ??
      (listReadGuard.state === "disabled"
        ? `${listReadGuard.message} Alerts queue results are hidden until auth forwarding/session is available.`
        : listReadGuard.state === "bypassed"
          ? `${listReadGuard.message} Alerts queue reads stay usable in disabled/local mode.`
          : "Protected alerts list is available with the current session and forwarding state.")
  );
  const [summaryReadState, setSummaryReadState] = useState<
    "enabled" | "blocked" | "bypassed" | "error"
  >(
    initialSummaryReadState ??
      (summaryReadGuard.state === "disabled" ? "blocked" : "enabled")
  );
  const [summaryReadMessage, setSummaryReadMessage] = useState<string>(
    initialSummaryReadMessage ??
      (summaryReadGuard.state === "disabled"
        ? `${summaryReadGuard.message} Showing a queue-derived fallback summary.`
        : "Protected alerts summary is available with the current session and forwarding state.")
  );
  const [detailAlerts, setDetailAlerts] = useState<Record<string, AlertSummary | undefined>>({});
  const [detailReadStates, setDetailReadStates] = useState<
    Record<string, "enabled" | "loading" | "blocked" | "bypassed" | "error" | undefined>
  >({});
  const [detailReadMessages, setDetailReadMessages] = useState<Record<string, string | undefined>>({});
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
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize] = useState(20);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [liveUpdatesState, setLiveUpdatesState] = useState(liveUpdatesDiagnostics.connectionState);
  const [liveSubscriptionState, setLiveSubscriptionState] = useState(
    liveUpdatesDiagnostics.subscriptionAuthState
  );
  const [lastLiveEventAt, setLastLiveEventAt] = useState<string | null>(null);
  const liveUpdatesStatus = useMemo(
    () => describeAlertsLiveUpdatesState(liveUpdatesDiagnostics, liveUpdatesState),
    [liveUpdatesDiagnostics, liveUpdatesState]
  );
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const ownerIndicators = deriveOwnerAlertIndicators(summary, defaultAlertWorkbenchOwner);
  const reviewQueueQuery = useMemo<AlertsListQuery>(() => ({ page: queuePage, pageSize: queuePageSize, status: statusFilter === "all" ? undefined : statusFilter, hasLatestNote: hasLatestNoteOnly ? true : undefined, pondId: pondIdFilter.trim() || undefined, assignedTo: assignedToFilter.trim() || undefined, reviewState: reviewStateFilter === "all" ? undefined : reviewStateFilter, sortBy }), [assignedToFilter, hasLatestNoteOnly, pondIdFilter, queuePage, queuePageSize, reviewStateFilter, sortBy, statusFilter]);
  const queueResetKey = useMemo(
    () =>
      buildAlertQueuePageResetKey({
        presetId,
        savedViewId: activeSavedViewId || undefined,
        status: statusFilter,
        hasLatestNote: hasLatestNoteOnly,
        pondId: pondIdFilter,
        assignedTo: assignedToFilter,
        reviewState: reviewStateFilter,
        sortBy
      }),
    [activeSavedViewId, assignedToFilter, hasLatestNoteOnly, pondIdFilter, presetId, reviewStateFilter, sortBy, statusFilter]
  );
  const previousQueueResetKeyRef = useRef(queueResetKey);
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

  const resetQueuePagination = useCallback(() => {
    setQueuePage(1);
    setSelectedAlertIds([]);
    setDetailAlertId(null);
    setActiveAlertId(null);
  }, []);

  const refreshQueue = useCallback(async () => {
    setIsRefreshingQueue(true);
    try {
      if (!listReadGuard.enabled) {
        setAlerts([]);
        setSelectedAlertIds([]);
        setSummary(buildAlertQueueSummary([]));
        setListReadState(listReadGuard.state === "disabled" ? "blocked" : "bypassed");
        setListReadMessage(
          listReadGuard.state === "disabled"
            ? `${listReadGuard.message} Alerts queue results are hidden until auth forwarding/session is available.`
            : `${listReadGuard.message} Alerts queue reads stay usable in disabled/local mode.`
        );
        setSummaryReadState(summaryReadGuard.state === "disabled" ? "blocked" : "bypassed");
        setSummaryReadMessage(
          summaryReadGuard.state === "disabled"
            ? `${summaryReadGuard.message} Showing a queue-derived fallback summary.`
            : "Summary reads are staying on the safe bypass path. Showing a queue-derived fallback summary."
        );
        return false;
      }

      const response = await repositories.alerts.list(reviewQueueQuery);
      setListReadState("enabled");
      setListReadMessage(
        "Protected alerts list is available with the current session and forwarding state."
      );
      setAlerts(response.data.items);
      setSelectedAlertIds((current) =>
        current.filter((id) => response.data.items.some((item) => item.id === id))
      );

      if (!summaryReadGuard.enabled) {
        setSummary(buildAlertQueueSummary(response.data.items));
        setSummaryReadState(summaryReadGuard.state === "disabled" ? "blocked" : "bypassed");
        setSummaryReadMessage(
          summaryReadGuard.state === "disabled"
            ? `${summaryReadGuard.message} Showing a queue-derived fallback summary.`
            : "Summary reads are staying on the safe bypass path. Showing a queue-derived fallback summary."
        );
        return true;
      }

      try {
        const summaryResponse = await repositories.alerts.summary(
          getAlertSummaryQuery(reviewQueueQuery)
        );
        setSummary(summaryResponse.data);
        setSummaryReadState("enabled");
        setSummaryReadMessage(
          "Protected alerts summary is available with the current session and forwarding state."
        );
      } catch (error) {
        setSummary(buildAlertQueueSummary(response.data.items));
        setSummaryReadState("error");
        setSummaryReadMessage(
          `${formatAlertsRuntimeError(error, runtimeConfig)} Showing a queue-derived fallback summary.`
        );
      }
      return true;
    } catch (error) {
      setAlerts([]);
      setSelectedAlertIds([]);
      setSummary(buildAlertQueueSummary([]));
      setListReadState("error");
      setListReadMessage(formatAlertsRuntimeError(error, runtimeConfig));
      reportRuntimeError(error);
      return false;
    } finally {
      setIsRefreshingQueue(false);
    }
  }, [
    listReadGuard,
    repositories.alerts,
    reportRuntimeError,
    reviewQueueQuery,
    runtimeConfig,
    summaryReadGuard
  ]);

  useEffect(() => {
    if (previousQueueResetKeyRef.current === queueResetKey) {
      return;
    }

    previousQueueResetKeyRef.current = queueResetKey;
    resetQueuePagination();
  }, [queueResetKey, resetQueuePagination]);

  useEffect(() => {
    setLiveUpdatesState(liveUpdatesDiagnostics.connectionState);
  }, [liveUpdatesDiagnostics.connectionState]);

  useEffect(() => {
    setLiveSubscriptionState(liveUpdatesDiagnostics.subscriptionAuthState);
  }, [liveUpdatesDiagnostics.subscriptionAuthState]);

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
        if (!listReadGuard.enabled) {
          if (!cancelled) {
            setAlerts([]);
            setSelectedAlertIds([]);
            setSummary(buildAlertQueueSummary([]));
            setListReadState(listReadGuard.state === "disabled" ? "blocked" : "bypassed");
            setListReadMessage(
              listReadGuard.state === "disabled"
                ? `${listReadGuard.message} Alerts queue results are hidden until auth forwarding/session is available.`
                : `${listReadGuard.message} Alerts queue reads stay usable in disabled/local mode.`
            );
            setSummaryReadState(summaryReadGuard.state === "disabled" ? "blocked" : "bypassed");
            setSummaryReadMessage(
              summaryReadGuard.state === "disabled"
                ? `${summaryReadGuard.message} Showing a queue-derived fallback summary.`
                : "Summary reads are staying on the safe bypass path. Showing a queue-derived fallback summary."
            );
          }
          return;
        }

        const response = await repositories.alerts.list(reviewQueueQuery);
        if (!cancelled) {
          setListReadState("enabled");
          setListReadMessage(
            "Protected alerts list is available with the current session and forwarding state."
          );
          setAlerts(response.data.items);
          setSelectedAlertIds((current) =>
            current.filter((id) => response.data.items.some((item) => item.id === id))
          );

          if (!summaryReadGuard.enabled) {
            setSummary(buildAlertQueueSummary(response.data.items));
            setSummaryReadState(summaryReadGuard.state === "disabled" ? "blocked" : "bypassed");
            setSummaryReadMessage(
              summaryReadGuard.state === "disabled"
                ? `${summaryReadGuard.message} Showing a queue-derived fallback summary.`
                : "Summary reads are staying on the safe bypass path. Showing a queue-derived fallback summary."
            );
            return;
          }

          try {
            const summaryResponse = await repositories.alerts.summary(
              getAlertSummaryQuery(reviewQueueQuery)
            );
            if (!cancelled) {
              setSummary(summaryResponse.data);
              setSummaryReadState("enabled");
              setSummaryReadMessage(
                "Protected alerts summary is available with the current session and forwarding state."
              );
            }
          } catch (error) {
            if (!cancelled) {
              setSummary(buildAlertQueueSummary(response.data.items));
              setSummaryReadState("error");
              setSummaryReadMessage(
                `${formatAlertsRuntimeError(error, runtimeConfig)} Showing a queue-derived fallback summary.`
              );
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setAlerts([]);
          setSelectedAlertIds([]);
          setSummary(buildAlertQueueSummary([]));
          setListReadState("error");
          setListReadMessage(formatAlertsRuntimeError(error, runtimeConfig));
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
  }, [
    listReadGuard,
    reportRuntimeError,
    repositories.alerts,
    reviewQueueQuery,
    runtimeConfig,
    summaryReadGuard
  ]);

  useEffect(() => {
    const connection = connectAlertsLiveUpdates({
      config: runtimeConfig,
      diagnostics: liveUpdatesDiagnostics,
      onEvent: (event) => {
        setLastLiveEventAt(event.timestamp);
        setFeedbackTone("success");
        setFeedbackMessage("Received a live alert update. Refreshing the queue.");
        void refreshQueue();
      },
      onStateChange: (state) => {
        setLiveUpdatesState(state);
      },
      onSubscriptionStateChange: (state) => {
        setLiveSubscriptionState(state);
      }
    });

    return () => {
      connection.disconnect();
    };
  }, [liveUpdatesDiagnostics, refreshQueue, runtimeConfig]);

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
            <span>Live updates: {liveUpdatesStatus.label}</span>
            <span>Live auth: {liveSubscriptionState}</span>
            <span>Auth mode: {authDiagnostics.effectiveMode}</span>
            <span>Session: {session.bootstrapState}</span>
            <span>Auth forwarding: {authDiagnostics.forwardingMode}</span>
          </div>
          <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
          <span style={{ color: "#94a3b8" }}>
            Live target: {liveUpdatesDiagnostics.targetLabel}. State: {liveUpdatesStatus.helperText}
          </span>
          <span style={{ color: "#94a3b8" }}>
            Fallback: {liveUpdatesDiagnostics.fallbackMode.replace("_", " ")}
            {lastLiveEventAt ? ` / Last live event: ${lastLiveEventAt}` : ""}
            .
          </span>
          <span style={{ color: "#94a3b8" }}>
            Live subscription auth: {liveSubscriptionState}. Websocket auth configured:{" "}
            {liveUpdatesDiagnostics.websocketAuthConfigured ? "yes" : "no"} / Current session sufficient:{" "}
            {liveUpdatesDiagnostics.currentSessionSufficient ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            List read slice: {session.protectedReadGuardedSliceLabel ?? authDiagnostics.protectedReadSliceLabel ?? "none"} / Enforced:{" "}
            {session.protectedReadGuardedSliceEnforced || authDiagnostics.protectedReadSliceEnforced ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Detail read slice: {session.secondaryProtectedReadGuardedSliceLabel ?? authDiagnostics.secondaryProtectedReadSliceLabel ?? "none"} / Enforced:{" "}
            {session.secondaryProtectedReadGuardedSliceEnforced || authDiagnostics.secondaryProtectedReadSliceEnforced ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Summary read slice: {session.tertiaryProtectedReadGuardedSliceLabel ?? authDiagnostics.tertiaryProtectedReadSliceLabel ?? "none"} / Enforced:{" "}
            {session.tertiaryProtectedReadGuardedSliceEnforced || authDiagnostics.tertiaryProtectedReadSliceEnforced ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Protected operator slice: {authDiagnostics.protectedOperatorSliceLabel}. Enforced:{" "}
            {authDiagnostics.protectedOperatorSliceEnforced ? "yes" : "no"}. Forwarded auth present:{" "}
            {authDiagnostics.forwardedAuthPresent ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Session bootstrap enabled: {session.bootstrapEnabled ? "yes" : "no"}. UI state:{" "}
            {session.protectedOperatorUiState}. Secondary slice:{" "}
            {session.secondaryGuardedSliceLabel ?? authDiagnostics.secondaryProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {session.secondaryGuardedSliceEnforced || authDiagnostics.secondaryProtectedSliceEnforced ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Third slice: {session.tertiaryGuardedSliceLabel ?? authDiagnostics.tertiaryProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {session.tertiaryGuardedSliceEnforced || authDiagnostics.tertiaryProtectedSliceEnforced ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Fourth slice: {session.quaternaryGuardedSliceLabel ?? authDiagnostics.quaternaryProtectedSliceLabel ?? "none"} / Enforced:{" "}
            {session.quaternaryGuardedSliceEnforced || authDiagnostics.quaternaryProtectedSliceEnforced ? "yes" : "no"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Session source: {session.sourceOfTruth}. Endpoint: {session.currentSessionEndpointStatus}. Current user:{" "}
            {session.currentUser?.displayName ?? session.currentUser?.username ?? session.currentUser?.id ?? "not resolved"}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            List surface: {listReadSurface.exposure} / {listReadSurface.accessState}. List read state: {listReadState}. Detail read state: {detailReadGuard.state}. Summary read state: {summaryReadState}. Lifecycle state: {lifecycleGuard.state}. Triage state: {triageGuard.state}. Bulk state: {bulkGuard.state}. Saved views state: {savedViewMutationGuard.state}.
          </span>
          <span style={{ color: "#94a3b8" }}>
            Read surface map: {detailReadSurface.surfaceLabel} is {detailReadSurface.exposure} ({detailReadSurface.accessState}); {summaryReadSurface.surfaceLabel} is {summaryReadSurface.exposure} ({summaryReadSurface.accessState}); {listReadSurface.surfaceLabel} is {listReadSurface.exposure} ({listReadSurface.accessState}).
          </span>
          {session.currentUser ? (
            <span style={{ color: "#94a3b8" }}>
              User provider: {session.currentUser.provider}. Roles: {session.currentUser.roles.join(", ") || "none"}. Alerts access: {session.currentUser.alertsAccessLevel} ({session.currentUser.alertsAccessSource}).
            </span>
          ) : null}
          {lastLiveEventAt ? (
            <span style={{ color: "#94a3b8" }}>Last live event: {lastLiveEventAt}</span>
          ) : null}
          {runtimeIndicator.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`} style={{ color: "#fbbf24" }}>{warning.message}</span>
          ))}
          {liveUpdatesDiagnostics.warnings
            .filter(
              (warning) =>
                !runtimeIndicator.warnings.some(
                  (runtimeWarning) =>
                    runtimeWarning.code === warning.code &&
                    runtimeWarning.message === warning.message
                )
            )
            .map((warning) => (
              <span key={`${warning.code}:${warning.message}`} style={{ color: "#fbbf24" }}>
                {warning.message}
              </span>
            ))}
          {authDiagnostics.warnings.map((warning) => (
            <span key={`${warning.code}:${warning.message}`} style={{ color: "#fbbf24" }}>
              {warning.message}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
            <span>Open: {summary.statusCounts.open}</span><span>Acknowledged: {summary.statusCounts.acknowledged}</span><span>Resolved: {summary.statusCounts.resolved}</span><span>Assigned: {summary.assignmentCounts.assigned}</span><span>Under review: {summary.reviewStateCounts.underReview}</span><span>With notes: {summary.noteCounts.withLatestNote}</span><span>Mine: {ownerIndicators.assignedAlerts}</span>
        </div>
        <p style={{ margin: 0, color: listReadState === "enabled" ? "#94a3b8" : "#fbbf24" }}>
          List auth state: {listReadState}. {listReadMessage}
        </p>
        <p style={{ margin: 0, color: summaryReadState === "enabled" ? "#94a3b8" : "#fbbf24" }}>
          Summary auth state: {summaryReadState}. {summaryReadMessage}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Preset view</span><select value={presetId} onChange={(event) => { const nextPresetId = event.target.value as AlertQueuePresetId | "custom"; setPresetId(nextPresetId); setActiveSavedViewId(""); applyQueryState(nextPresetId === "custom" ? {} : getAlertPresetQuery(nextPresetId, defaultAlertWorkbenchOwner)); resetQueuePagination(); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="custom">Custom</option>{alertQueuePresetDefinitions.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Status</span><select value={statusFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setStatusFilter(event.target.value as AlertsListQuery["status"] | "all"); resetQueuePagination(); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="all">All</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Review state</span><select value={reviewStateFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setReviewStateFilter(event.target.value as AlertReviewState | "all"); resetQueuePagination(); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="all">All</option>{reviewStateOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Sort</span><select value={sortBy} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setSortBy(event.target.value as NonNullable<AlertsListQuery["sortBy"]>); resetQueuePagination(); }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="updatedAt_desc">Newest updated</option><option value="updatedAt_asc">Oldest updated</option><option value="createdAt_desc">Newest created</option><option value="createdAt_asc">Oldest created</option></select></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Pond</span><input value={pondIdFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setPondIdFilter(event.target.value); resetQueuePagination(); }} placeholder="pond-1" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Owner</span><input value={assignedToFilter} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setAssignedToFilter(event.target.value); resetQueuePagination(); }} placeholder="operator-queue" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.6rem" }}><input type="checkbox" checked={hasLatestNoteOnly} onChange={(event) => { setPresetId("custom"); setActiveSavedViewId(""); setHasLatestNoteOnly(event.target.checked); resetQueuePagination(); }} /><span>With notes only</span></label>
          <button type="button" onClick={() => { setPresetId("custom"); setActiveSavedViewId(""); applyQueryState({}); resetQueuePagination(); setFeedbackTone("success"); setFeedbackMessage("Filters reset."); }} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: "1px solid #475569", marginTop: "1.45rem" }}>Reset filters</button>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Saved view name</span><input value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} placeholder="Morning queue" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          <button type="button" disabled={!savedViewMutationGuard.enabled} onClick={async () => { if (!savedViewName.trim()) { setFeedbackTone("error"); setFeedbackMessage("Name the view before saving it."); return; } try { const nextViews = await savedViewsStore.save({ name: savedViewName.trim(), presetId: presetId === "custom" ? undefined : presetId, query: reviewQueueQuery }); setSavedViews(nextViews); setSavedViewName(""); setFeedbackTone("success"); setFeedbackMessage("Saved the current queue view."); } catch (error) { reportRuntimeError(error); } }} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Save current view</button>
          <label style={{ display: "grid", gap: "0.35rem" }}><span>Saved views</span><select value={activeSavedViewId} onChange={(event) => { const viewId = event.target.value; setActiveSavedViewId(viewId); const view = savedViews.find((item) => item.id === viewId); if (view) { setPresetId(view.presetId ?? "custom"); applyQueryState(view.query); resetQueuePagination(); setFeedbackTone("success"); setFeedbackMessage(`Loaded view "${view.name}".`); } }} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}><option value="">Select saved view</option>{savedViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select></label>
          <button type="button" disabled={!activeSavedViewId || !savedViewMutationGuard.enabled} onClick={async () => { try { const nextViews = await savedViewsStore.remove(activeSavedViewId); setSavedViews(nextViews); setActiveSavedViewId(""); setFeedbackTone("success"); setFeedbackMessage("Removed saved view."); } catch (error) { reportRuntimeError(error); } }} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Remove saved view</button>
        </div>
        <p style={{ margin: 0, color: savedViewMutationGuard.enabled ? "#94a3b8" : "#fbbf24" }}>
          Saved-view auth state: {savedViewMutationGuard.state}. {savedViewMutationGuard.message}
        </p>
        <div style={{ display: "grid", gap: "0.6rem", padding: "0.8rem", borderRadius: "0.65rem", background: "rgba(15, 23, 42, 0.55)" }}>
          <strong>Bulk actions</strong>
          <p style={{ margin: 0, color: "#94a3b8" }}>Selected alerts: {selectedAlertIds.length}</p>
          <p style={{ margin: 0, color: bulkGuard.enabled ? "#94a3b8" : "#fbbf24" }}>
            Bulk auth state: {bulkGuard.state}. {bulkGuard.message}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}><span>Owner</span><input value={bulkOwner} onChange={(event) => setBulkOwner(event.target.value)} placeholder={defaultAlertWorkbenchOwner} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
            <label style={{ display: "grid", gap: "0.35rem" }}><span>Review state</span><select value={bulkReviewState} onChange={(event) => setBulkReviewState(event.target.value as AlertReviewState)} style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>{reviewStateOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label style={{ display: "grid", gap: "0.35rem" }}><span>Review label</span><input value={bulkReviewLabel} onChange={(event) => setBulkReviewLabel(event.target.value)} placeholder="triage, urgent" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
            <label style={{ display: "grid", gap: "0.35rem", minWidth: "16rem" }}><span>Bulk note</span><input value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} placeholder="Optional note for the selected alerts" style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #475569" }} /></label>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0 || !bulkGuard.enabled} onClick={() => handleBulkAction("bulkAcknowledge")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk acknowledge</button>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0 || !bulkGuard.enabled} onClick={() => handleBulkAction("bulkResolve")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk resolve</button>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0 || !bulkGuard.enabled} onClick={() => handleBulkAction("bulkAssign")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk assign</button>
            <button type="button" disabled={isSubmitting || selectedAlertIds.length === 0 || !bulkGuard.enabled} onClick={() => handleBulkAction("bulkSetReviewState")} style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}>Bulk review-state update</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#94a3b8", flexWrap: "wrap" }}>
          <input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedAlertIds((current) => allVisibleSelected ? current.filter((id) => !alerts.some((alert) => alert.id === id)) : [...new Set([...current, ...alerts.map((alert) => alert.id)])])} />
          <span>{isRefreshingQueue ? "Refreshing queue..." : `Queue items: ${alerts.length}. Selected: ${selectedAlertIds.length}.`}</span>
          <button type="button" disabled={queuePage === 1 || isRefreshingQueue} onClick={() => setQueuePage((current) => Math.max(1, current - 1))} style={{ padding: "0.4rem 0.65rem", borderRadius: "0.45rem", border: "1px solid #475569" }}>Previous page</button>
          <button type="button" disabled={isRefreshingQueue || alerts.length < queuePageSize} onClick={() => setQueuePage((current) => current + 1)} style={{ padding: "0.4rem 0.65rem", borderRadius: "0.45rem", border: "1px solid #475569" }}>Next page</button>
          <span>Page {queuePage}</span>
        </div>
      </div>

      <AlertsWorkbenchQueue
        alerts={alerts}
        detailAlerts={detailAlerts}
        detailReadStates={detailReadStates}
        detailReadMessages={detailReadMessages}
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
        session={session}
        onToggleSelection={(alertId) => setSelectedAlertIds((current) => current.includes(alertId) ? current.filter((item) => item !== alertId) : [...current, alertId])}
        onToggleDetail={async (alertId) => {
          if (detailAlertId === alertId) {
            setDetailAlertId(null);
            return;
          }

          setDetailAlertId(alertId);

          if (!detailReadGuard.enabled) {
            setDetailReadStates((current) => ({
              ...current,
              [alertId]: detailReadGuard.state === "disabled" ? "blocked" : "bypassed"
            }));
            setDetailReadMessages((current) => ({
              ...current,
              [alertId]:
                detailReadGuard.state === "disabled"
                  ? `${detailReadGuard.message} Using queue-summary fallback only.`
                  : "Detailed backend reads are staying on the safe bypass path. Queue-summary data remains visible."
            }));
            return;
          }

          setDetailReadStates((current) => ({ ...current, [alertId]: "loading" }));
          setDetailReadMessages((current) => ({
            ...current,
            [alertId]: "Loading protected alert detail from the backend detail surface."
          }));

          try {
            const response = await repositories.alerts.getById(alertId);
            setDetailAlerts((current) => ({ ...current, [alertId]: response.data }));
            setDetailReadStates((current) => ({ ...current, [alertId]: "enabled" }));
            setDetailReadMessages((current) => ({
              ...current,
              [alertId]:
                "Protected detail read is available with current session and forwarding state."
            }));
          } catch (error) {
            setDetailReadStates((current) => ({ ...current, [alertId]: "error" }));
            setDetailReadMessages((current) => ({
              ...current,
              [alertId]: formatAlertsRuntimeError(error, runtimeConfig)
            }));
            reportRuntimeError(error);
          }
        }}
        onNoteChange={(alertId, value) => setNotes((current) => ({ ...current, [alertId]: value }))}
        onOwnerChange={(alertId, value) => setOwnerInputs((current) => ({ ...current, [alertId]: value }))}
        onReviewLabelChange={(alertId, value) => setReviewLabels((current) => ({ ...current, [alertId]: value }))}
        onReviewStateChange={(alertId, value) => setReviewStates((current) => ({ ...current, [alertId]: value }))}
        onExplain={handleExplainAlertWithOptions}
        onFeedbackNoteChange={(alertId, value) => setFeedbackNotes((current) => ({ ...current, [alertId]: value }))}
        onSubmitFeedback={handleSubmitExplanationFeedback}
        onAttachExplanation={handleAttachExplanation}
        onAssign={(alertId) => handleSingleAction(alertId, () => assignSubmitter(alertId)({ assignedTo: ownerInputs[alertId]?.trim() ?? defaultAlertWorkbenchOwner, note: notes[alertId]?.trim() || undefined }), "Alert owner updated.")}
        onUnassign={(alertId) => handleSingleAction(alertId, () => unassignSubmitter(alertId)({ note: notes[alertId]?.trim() || undefined }), "Alert returned to the general queue.")}
        onApplyReviewState={(alertId) => handleSingleAction(alertId, () => reviewStateSubmitter(alertId)({ reviewState: reviewStates[alertId] ?? "under_review", reviewLabel: reviewLabels[alertId]?.trim() || undefined, note: notes[alertId]?.trim() || undefined }), "Review flow updated.")}
        onAcknowledge={(alertId) => handleSingleAction(alertId, () => acknowledgeSubmitter(alertId)({ note: notes[alertId]?.trim() || undefined }), "Alert acknowledged successfully.")}
        onResolve={(alertId) => handleSingleAction(alertId, () => resolveSubmitter(alertId)({ note: notes[alertId]?.trim() || undefined }), "Alert resolved successfully.")}
      />

      {feedbackMessage ? <p style={{ margin: 0, color: feedbackTone === "success" ? "#86efac" : "#fca5a5" }}>{feedbackMessage}</p> : null}
      {pageState.status === "success" ? <p style={{ margin: 0, color: "#86efac" }}>Alert updated to {pageState.data?.status}. Refreshed alerts: {pageState.refreshedList?.items.length ?? 0}.</p> : null}
      {pageState.status === "validation_error" ? <p style={{ margin: 0, color: "#fca5a5" }}>{Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}</p> : null}
    </div>
  );
}
