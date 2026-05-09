import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import { getTaskDetailPageData, getTasksPageData } from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { TaskDetailReadCard } from "./_components/task-detail-read-card";
import { TaskCreateForm } from "./_components/task-create-form";
import { TaskUpdateForm } from "./_components/task-update-form";

export default async function TasksPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const tasks = await getTasksPageData();
  const firstTask = tasks.items[0];
  const taskReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.quaternaryNonAlertsReadGuardedSliceLabel ?? "tasks_detail_read",
    enforcedByBackend: diagnostics.session.quaternaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const firstTaskDetail =
    firstTask && taskReadGuard.enabled
      ? await getTaskDetailPageData(firstTask.id).catch(() => undefined)
      : undefined;

  return (
    <PageShell
      title="Tasks"
      description="Operator follow-up queue with bounded task reads, create/update actions, and safe auth-aware behavior."
    >
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.35)"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Task workflow overview</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Start with the pending-work list, open the first task detail, confirm owner and status, then decide whether the next manual step is a new follow-up task or an update to the current one.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
          <span>Open tasks: {tasks.items.length}</span>
          <span>First detail: {firstTaskDetail ? "full detail loaded" : firstTask ? "preview only" : "no task yet"}</span>
          <span>Next action: {firstTask ? "review owner, status, and pond link" : "create the first follow-up task"}</span>
        </div>
      </section>
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Pending work list</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Use this list to explain what still needs follow-up before opening the selected task detail.
        </p>
      <ul>
        {tasks.items.map((task) => (
          <li key={task.id}>
            {task.title} ({task.status})
          </li>
        ))}
      </ul>
      </section>
      {firstTask ? (
        <TaskDetailReadCard
          taskPreview={firstTask}
          taskDetail={firstTaskDetail}
          session={diagnostics.session}
        />
      ) : null}
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Manual follow-up actions</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          These forms stay manual and review-first. Protected create and update actions may require a forwarded session in active auth mode, while disabled/local modes keep the bounded bypass path readable.
        </p>
      </section>
      <TaskCreateForm pondId={firstTask?.pondId} session={diagnostics.session} />
      {firstTask ? <TaskUpdateForm task={firstTask} session={diagnostics.session} /> : null}
    </PageShell>
  );
}
