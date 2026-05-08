"use client";

import { useMemo, useState } from "react";
import type { FrontendSessionBootstrapStatus, PondSummary } from "@aquapulse/types";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard
} from "@web/features/auth-session";
import { createPondUpdateSubmitter, type PondUpdateSubmissionResult } from "@web/features/pond-update";
import { derivePondsRuntimeIndicator, formatPondsRuntimeError } from "@web/features/ponds-runtime";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";
import { createRepositoriesFromConfig } from "@web/repositories";
import {
  cancelInlineEdit,
  completeInlineEdit,
  createInlineEditState,
  failInlineEdit,
  patchInlineEditDraft,
  startInlineEdit
} from "@web/features/inline-edit";

interface PondUpdateFormProps {
  readonly pond: PondSummary;
  readonly session: FrontendSessionBootstrapStatus;
}

export function PondUpdateForm({ pond, session }: PondUpdateFormProps) {
  const [inlineEdit, setInlineEdit] = useState(() =>
    createInlineEditState({
      name: pond.name,
      status: pond.status
    })
  );
  const [result, setResult] = useState<PondUpdateSubmissionResult | null>(null);
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
        NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const submitPondUpdate = useMemo(
    () => createPondUpdateSubmitter(repositories)(pond.id),
    [repositories, pond.id]
  );
  const runtimeIndicator = useMemo(() => derivePondsRuntimeIndicator(runtimeConfig), [runtimeConfig]);
  const updateGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.tertiaryNonAlertsGuardedSliceLabel ?? "ponds_update",
        enforcedByBackend: session.tertiaryNonAlertsGuardedSliceEnforced
      }),
    [session]
  );
  const operatorSummary = useMemo(() => deriveNonAlertOperatorAccessSummary(session), [session]);
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const draft = inlineEdit.draftValue;
  const updateDisabled = !updateGuard.enabled;

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
        if (updateDisabled) {
          return;
        }
        setIsSubmitting(true);
        setRuntimeError(null);

        try {
          const submission = await submitPondUpdate({
            name: draft.name,
            status: draft.status
          });

          setResult(submission);
          if (submission.status === "success") {
            setInlineEdit((state) =>
              completeInlineEdit(
                state,
                {
                  name: submission.data.name,
                  status: submission.data.status
                },
                "Pond updated."
              )
            );
          } else if (submission.status === "validation_error") {
            setInlineEdit((state) => failInlineEdit(state, "Please review the pond details."));
          }
        } catch (error) {
          setRuntimeError(formatPondsRuntimeError(error, runtimeConfig));
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Update pond</h2>
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
          Ponds runtime: {runtimeIndicator.modeLabel} / Target: {runtimeIndicator.targetLabel}
        </span>
        <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
          Ponds update auth: {updateGuard.sliceLabel} / {updateGuard.state}
        </span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
          Shared non-alert operator access: {operatorSummary.label} / {operatorStatusLabel}
        </span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
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
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setInlineEdit((state) => startInlineEdit(state))}
          disabled={updateDisabled}
          style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setInlineEdit((state) => cancelInlineEdit(state))}
          disabled={!inlineEdit.isEditing}
          style={{ padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        >
          Cancel
        </button>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Name</span>
        <input
          value={draft.name}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { name: event.target.value }))
          }
          disabled={!inlineEdit.isEditing || updateDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Status</span>
        <select
          value={draft.status}
          onChange={(event) =>
            setInlineEdit((state) =>
              patchInlineEditDraft(state, { status: event.target.value as PondSummary["status"] })
            )
          }
          disabled={!inlineEdit.isEditing || updateDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        >
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pageState.isSubmitting || !inlineEdit.isEditing || updateDisabled}
        style={{
          padding: "0.7rem 0.9rem",
          borderRadius: "0.5rem",
          border: "1px solid #0f172a",
          background: "#e2e8f0",
          color: "#0f172a",
          fontWeight: 600
        }}
      >
        {pageState.isSubmitting ? "Saving..." : "Update pond"}
      </button>
      {inlineEdit.feedback ? (
        <p style={{ margin: 0, color: inlineEdit.feedback.tone === "success" ? "#86efac" : "#fca5a5" }}>
          {inlineEdit.feedback.message}
        </p>
      ) : null}
      {pageState.status === "validation_error" ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
      {pageState.status === "success" ? (
        <p style={{ margin: 0, color: "#86efac" }}>
          Updated pond: {pageState.data?.name}. Refreshed ponds: {pageState.refreshedList?.items.length ?? 0}. Synced detail: {pageState.refreshedDetail?.status ?? "n/a"}.
        </p>
      ) : null}
      {runtimeError ? <p style={{ margin: 0, color: "#fca5a5" }}>{runtimeError}</p> : null}
      {updateDisabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Ponds update is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded non-alert operator action can run.
        </p>
      ) : null}
    </form>
  );
}
