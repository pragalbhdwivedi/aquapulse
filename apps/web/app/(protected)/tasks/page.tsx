import { getTasksPageData } from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { TaskCreateForm } from "./_components/task-create-form";
import { TaskUpdateForm } from "./_components/task-update-form";

export default async function TasksPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const tasks = await getTasksPageData();

  return (
    <PageShell title="Tasks" description="Placeholder tasks route using the repository and query layer.">
      <p>Tasks: {tasks.items.length}</p>
      <ul>
        {tasks.items.map((task) => (
          <li key={task.id}>
            {task.title} ({task.status})
          </li>
        ))}
      </ul>
      <TaskCreateForm pondId={tasks.items[0]?.pondId} session={diagnostics.session} />
      {tasks.items[0] ? <TaskUpdateForm task={tasks.items[0]} session={diagnostics.session} /> : null}
    </PageShell>
  );
}
