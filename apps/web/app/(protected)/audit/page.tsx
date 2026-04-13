import { auditMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function AuditPage() {
  const audit = await auditMockAdapter.list();

  return (
    <PageShell title="Audit" description="Placeholder audit timeline driven by the shared audit contract.">
      <ul>
        {audit.data.items.map((event) => (
          <li key={event.id}>
            {event.action} {event.resourceType}: {event.summary}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
