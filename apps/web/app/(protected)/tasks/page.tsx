import { getTasksPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function TasksPage() {
  const tasks = await getTasksPageData();

  return (
    <PageShell title="Tasks" description="Placeholder tasks route using the repository and query layer.">
      <p>Tasks: {tasks.items.length}</p>
    </PageShell>
  );
}
