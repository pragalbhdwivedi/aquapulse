"use client";

import { useState } from "react";
import type { FeedEntry } from "@aquapulse/types";
import {
  cancelInlineEdit,
  completeInlineEdit,
  createInlineEditState,
  failInlineEdit,
  patchInlineEditDraft,
  startInlineEdit
} from "@web/features/inline-edit";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";
import { submitFeedUpdate } from "@web/features/feed-update";

interface FeedUpdateFormProps {
  readonly feedEntry: FeedEntry;
}

export function FeedUpdateForm({ feedEntry }: FeedUpdateFormProps) {
  const [inlineEdit, setInlineEdit] = useState(() =>
    createInlineEditState({
      feedType: feedEntry.feedType,
      quantityKg: String(feedEntry.quantityKg),
      fedAt: feedEntry.fedAt,
      batchId: feedEntry.batchId ?? ""
    })
  );
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitFeedUpdate>> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const draft = inlineEdit.draftValue;

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        const submission = await submitFeedUpdate(feedEntry.id, {
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
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setInlineEdit((state) => startInlineEdit(state))}
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
          disabled={!inlineEdit.isEditing}
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
          disabled={!inlineEdit.isEditing}
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
          disabled={!inlineEdit.isEditing}
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
          disabled={!inlineEdit.isEditing}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <button
        type="submit"
        disabled={pageState.isSubmitting || !inlineEdit.isEditing}
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
    </form>
  );
}
