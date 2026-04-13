import { apiClients } from "@web/clients";
import { PageShell } from "../_components/page-shell";

export default async function TasksPage() {
  const tasks = await apiClients.tasks.list();

  return (
    <PageShell title="Tasks" description="Placeholder tasks route using the API client layer.">
      <p>Tasks: {tasks.data.items.length}</p>
    </PageShell>
  );
}
