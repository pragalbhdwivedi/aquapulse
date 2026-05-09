"use client";

import { useMemo, useState } from "react";
import type { FrontendSessionBootstrapStatus } from "@aquapulse/types";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import { createRepositoriesFromConfig } from "@web/repositories";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard
} from "@web/features/auth-session";
import {
  createTaskSubmitter,
  type TaskCreateSubmissionResult
} from "@web/features/task-create";
import {
  deriveTasksRuntimeIndicator,
  formatTasksRuntimeError
} from "@web/features/tasks-runtime";
import { toMutationPageState } from "@web/features/mutation-refresh";

interface TaskCreateFormProps {
  readonly pondId?: string;
  readonly session: FrontendSessionBootstrapStatus;
}

export function TaskCreateForm({ pondId = "pond-1", session }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("user-1");
  const [result, setResult] = useState<TaskCreateSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const runtimeConfig = useMemo(
    () =>
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const submitTask = useMemo(() => createTaskSubmitter(repositories), [repositories]);
  const runtimeIndicator = useMemo(
    () => deriveTasksRuntimeIndicator(runtimeConfig),
    [runtimeConfig]
  );
  const createGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.septenaryNonAlertsGuardedSliceLabel ?? "tasks_create",
        enforcedByBackend: session.septenaryNonAlertsGuardedSliceEnforced
      }),
    [session]
  );
  const operatorSummary = useMemo(() => deriveNonAlertOperatorAccessSummary(session), [session]);
  const pageState = toMutationPageState(result, isSubmitting);
  const createDisabled = !createGuard.enabled;
  const operatorStatusLabel =
    operatorSummary.accessState === "available"
      ? "action available"
      : operatorSummary.accessState === "bypassed_local"
        ? "allowed in disabled/local modes"
        : operatorSummary.accessState === "degraded"
          ? "protected with degraded forwarding/session"
          : "protected and waiting for forwarded auth/session";

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (createDisabled) {
          return;
        }
        setIsSubmitting(true);
        setRuntimeError(null);

        try {
          const submission = await submitTask({
            title,
            assigneeId: assigneeId || undefined,
            pondId
          });
          setResult(submission);
          if (submission.status === "success") {
            setAssigneeId(submission.data.assigneeId ?? "user-1");
          }
          setTitle("");
        } catch (error) {
          setRuntimeError(formatTasksRuntimeError(error, runtimeConfig));
        }
        setIsSubmitting(false);
      }}
      style={{
        display: "grid",
        gap: "0.75rem",
        maxWidth: "28rem",
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "0.75rem"
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Create task</h2>
      <p style={{ margin: 0, color: "#94a3b8" }}>
        Use this bounded create path when the current pending work needs a new manual follow-up item. Saving stays manual and review-first.
      </p>
      <div
        style={{
          display: "grid",
          gap: "0.25rem",
          padding: "0.65rem 0.8rem",
          borderRadius: "0.65rem",
          background: "rgba(30, 41, 59, 0.45)",
          color: "#cbd5e1"
        }}
      >
        <span>
          Tasks runtime: {runtimeIndicator.modeLabel} / Target: {runtimeIndicator.targetLabel}
        </span>
        <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Tasks create auth: {createGuard.sliceLabel} / {createGuard.state}
        </span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Shared non-alert operator access: {operatorSummary.label} / {operatorStatusLabel}
        </span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          {operatorSummary.message}
        </span>
        <span style={{ color: "#94a3b8" }}>
          Current-session sufficient: {operatorSummary.currentSessionSufficient ? "yes" : "no"} /
          Forwarding: {operatorSummary.forwardingState}
        </span>
        {runtimeIndicator.warnings.map((warning) => (
          <span key={`${warning.code}:${warning.message}`} style={{ color: "#fbbf24" }}>
            {warning.message}
          </span>
        ))}
      </div>
      <p style={{ margin: 0, color: "#94a3b8" }}>
        What this does: creates a new follow-up task for the linked pond. It does not update any existing task automatically.
      </p>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Inspect paddlewheel motor"
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Assignee ID</span>
        <input
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          placeholder="user-1"
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <button
        type="submit"
        disabled={pageState.isSubmitting || createDisabled}
        style={{
          padding: "0.7rem 0.9rem",
          borderRadius: "0.5rem",
          border: "1px solid #0f172a",
          background: "#e2e8f0",
          color: "#0f172a",
          fontWeight: 600
        }}
      >
        {pageState.isSubmitting ? "Saving..." : "Create task"}
      </button>
      {pageState.status === "validation_error" ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          {pageState.fieldErrors.title ?? "Please review the task details."}
        </p>
      ) : null}
      {pageState.status === "success" ? (
        <p style={{ margin: 0, color: "#86efac" }}>
          Created task: {pageState.data?.title}. Refreshed tasks: {pageState.refreshedList?.items.length ?? 0}
        </p>
      ) : null}
      {runtimeError ? <p style={{ margin: 0, color: "#fca5a5" }}>{runtimeError}</p> : null}
      {createDisabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Tasks create is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded manual create action can run.
        </p>
      ) : null}
    </form>
  );
}
