"use client";

import { useState } from "react";
import { submitTask } from "@web/features/task-create";
import { toMutationPageState } from "@web/features/mutation-refresh";

interface TaskCreateFormProps {
  readonly pondId?: string;
}

export function TaskCreateForm({ pondId = "pond-1" }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("user-1");
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitTask>> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationPageState(result, isSubmitting);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

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
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Inspect paddlewheel motor"
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Assignee ID</span>
        <input
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          placeholder="user-1"
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
    </form>
  );
}
