import { apiClients } from "@web/clients";
import { PageShell } from "../_components/page-shell";

export default async function AuditPage() {
  const audit = await apiClients.audit.list();

  return (
    <PageShell title="Audit" description="Placeholder audit route using the API client layer.">
      <p>Audit events: {audit.data.items.length}</p>
    </PageShell>
  );
}
