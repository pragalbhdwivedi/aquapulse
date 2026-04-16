"use client";

import { useState } from "react";
import type { TaskStatus, TaskSummary } from "@aquapulse/types";
import {
  cancelInlineEdit,
  completeInlineEdit,
  createInlineEditState,
  failInlineEdit,
  patchInlineEditDraft,
  startInlineEdit,
} from "@web/features/inline-edit";
import { submitTaskUpdate } from "@web/features/task-update";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";

interface TaskUpdateFormProps {
  readonly task: TaskSummary;
}

export function TaskUpdateForm({ task }: TaskUpdateFormProps) {
  const [inlineEdit, setInlineEdit] = useState(() =>
    createInlineEditState({
      title: task.title,
      status: task.status,
      assigneeId: task.assigneeId ?? ""
    })
  );
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitTaskUpdate>> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const draft = inlineEdit.draftValue;

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        const submission = await submitTaskUpdate(task.id, {
          title: draft.title,
          status: draft.status,
          assigneeId: draft.assigneeId || undefined,
          pondId: task.pondId
        });

        setResult(submission);
        if (submission.status === "success") {
          setInlineEdit((state) =>
            completeInlineEdit(
              state,
              {
                title: submission.data.title,
                status: submission.data.status,
                assigneeId: submission.data.assigneeId ?? ""
              },
              "Task updated."
            )
          );
        } else if (submission.status === "validation_error") {
          setInlineEdit((state) => failInlineEdit(state, "Please review the task details."));
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Update first task</h2>
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
        <span>Title</span>
        <input
          value={draft.title}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { title: event.target.value }))
          }
          disabled={!inlineEdit.isEditing}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Status</span>
        <select
          value={draft.status}
          onChange={(event) =>
            setInlineEdit((state) =>
              patchInlineEditDraft(state, { status: event.target.value as TaskStatus })
            )
          }
          disabled={!inlineEdit.isEditing}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Assignee ID</span>
        <input
          value={draft.assigneeId}
          onChange={(event) =>
            setInlineEdit((state) => patchInlineEditDraft(state, { assigneeId: event.target.value }))
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
        {pageState.isSubmitting ? "Saving..." : "Update task"}
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
          Updated task: {pageState.data?.title}. Refreshed tasks: {pageState.refreshedList?.items.length ?? 0}. Synced detail: {pageState.refreshedDetail?.status ?? "n/a"}.
        </p>
      ) : null}
    </form>
  );
}
