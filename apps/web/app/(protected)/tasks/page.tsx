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
      <p>
        Open task view: {tasks.items.length} item(s). Start with manual follow-up work that still needs an owner, update, or completion check.
      </p>
      <ul>
        {tasks.items.map((task) => (
          <li key={task.id}>
            {task.title} ({task.status})
          </li>
        ))}
      </ul>
      {firstTask ? (
        <TaskDetailReadCard
          taskPreview={firstTask}
          taskDetail={firstTaskDetail}
          session={diagnostics.session}
        />
      ) : null}
      <TaskCreateForm pondId={firstTask?.pondId} session={diagnostics.session} />
      {firstTask ? <TaskUpdateForm task={firstTask} session={diagnostics.session} /> : null}
    </PageShell>
  );
}
