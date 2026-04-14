"use client";

import { useState } from "react";
import type { TaskStatus, TaskSummary } from "@aquapulse/types";
import { submitTaskUpdate } from "@web/features/task-update";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";

interface TaskUpdateFormProps {
  readonly task: TaskSummary;
}

export function TaskUpdateForm({ task }: TaskUpdateFormProps) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitTaskUpdate>> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationSyncPageState(result, isSubmitting);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        const submission = await submitTaskUpdate(task.id, {
          title,
          status,
          assigneeId: assigneeId || undefined,
          pondId: task.pondId
        });

        setResult(submission);
        if (submission.status === "success") {
          setTitle(submission.data.title);
          setStatus(submission.data.status);
          setAssigneeId(submission.data.assigneeId ?? "");
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
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
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
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <button
        type="submit"
        disabled={pageState.isSubmitting}
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
