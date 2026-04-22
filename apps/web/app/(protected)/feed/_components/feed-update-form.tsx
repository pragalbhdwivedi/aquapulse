"use client";

import { useMemo, useState } from "react";
import type { FeedEntry, FrontendSessionBootstrapStatus } from "@aquapulse/types";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import { deriveProtectedOperatorUiGuard } from "@web/features/auth-session";
import { createRepositoriesFromConfig } from "@web/repositories";
import {
  deriveFeedRuntimeIndicator,
  formatFeedRuntimeError
} from "@web/features/feed-runtime";
import {
  cancelInlineEdit,
  completeInlineEdit,
  createInlineEditState,
  failInlineEdit,
  patchInlineEditDraft,
  startInlineEdit
} from "@web/features/inline-edit";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";
import {
  createFeedUpdateSubmitter,
  type FeedUpdateSubmissionResult
} from "@web/features/feed-update";

interface FeedUpdateFormProps {
  readonly feedEntry: FeedEntry;
  readonly session: FrontendSessionBootstrapStatus;
}

export function FeedUpdateForm({ feedEntry, session }: FeedUpdateFormProps) {
  const [inlineEdit, setInlineEdit] = useState(() =>
    createInlineEditState({
      feedType: feedEntry.feedType,
      quantityKg: String(feedEntry.quantityKg),
      fedAt: feedEntry.fedAt,
      batchId: feedEntry.batchId ?? ""
    })
  );
  const [result, setResult] = useState<FeedUpdateSubmissionResult | null>(null);
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
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const submitFeed = useMemo(
    () => createFeedUpdateSubmitter(repositories)(feedEntry.id),
    [repositories, feedEntry.id]
  );
  const runtimeIndicator = useMemo(
    () => deriveFeedRuntimeIndicator(runtimeConfig),
    [runtimeConfig]
  );
  const feedUpdateGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.secondaryNonAlertsGuardedSliceLabel ?? "feed_update",
        enforcedByBackend: session.secondaryNonAlertsGuardedSliceEnforced
      }),
    [session]
  );
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const draft = inlineEdit.draftValue;
  const updateDisabled = !feedUpdateGuard.enabled;

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
          const submission = await submitFeed({
            feedType: draft.feedType,
            quantityKg: draft.quantityKg ? Number(draft.quantityKg) : 0,
            fedAt: draft.fedAt,
            batchId: draft.batchId || undefined
          });

          setResult(submission);
          if (submission.status === "success") {
            setInlineEdit((state) =>
              completeInlineEdit(
                state,
                {
                  feedType: submission.data.feedType,
                  quantityKg: String(submission.data.quantityKg),
                  fedAt: submission.data.fedAt,
                  batchId: submission.data.batchId ?? ""
                },
                "Feed entry updated."
              )
            );
          } else if (submission.status === "validation_error") {
            setInlineEdit((state) => failInlineEdit(state, "Please review the feed entry details."));
          }
        } catch (error) {
          setRuntimeError(formatFeedRuntimeError(error, runtimeConfig));
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Update latest feed entry</h2>
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
          Feed runtime: {runtimeIndicator.modeLabel} / Target: {runtimeIndicator.targetLabel}
        </span>
        <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
          Feed update auth: {feedUpdateGuard.sliceLabel} / {feedUpdateGuard.state}
        </span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
          {feedUpdateGuard.message}
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
        <span>Feed Type</span>
        <input
          value={draft.feedType}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { feedType: event.target.value }))
          }
          disabled={!inlineEdit.isEditing || updateDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Quantity (kg)</span>
        <input
          value={draft.quantityKg}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { quantityKg: event.target.value }))
          }
          disabled={!inlineEdit.isEditing || updateDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Fed At</span>
        <input
          value={draft.fedAt}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { fedAt: event.target.value }))
          }
          disabled={!inlineEdit.isEditing || updateDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Batch ID</span>
        <input
          value={draft.batchId}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { batchId: event.target.value }))
          }
          disabled={!inlineEdit.isEditing || updateDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
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
        {pageState.isSubmitting ? "Saving..." : "Update feed entry"}
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
          Updated feed: {pageState.data?.feedType}. Refreshed entries: {pageState.refreshedList?.items.length ?? 0}. Synced detail: {pageState.refreshedDetail?.id ?? "n/a"}.
        </p>
      ) : null}
      {runtimeError ? <p style={{ margin: 0, color: "#fca5a5" }}>{runtimeError}</p> : null}
      {updateDisabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Feed update is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded non-alert operator action can run.
        </p>
      ) : null}
    </form>
  );
}
