import { tasksMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function TasksPage() {
  const tasks = await tasksMockAdapter.list();

  return (
    <PageShell title="Tasks" description="Placeholder tasks route consuming typed task mock data.">
      <ul>
        {tasks.data.items.map((task) => (
          <li key={task.id}>
            {task.title} - {task.status}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
