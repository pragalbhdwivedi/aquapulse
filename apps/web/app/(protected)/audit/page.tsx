import { getAuditPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function AuditPage() {
  const audit = await getAuditPageData();

  return (
    <PageShell title="Audit" description="Placeholder audit route using the repository and query layer.">
      <p>Audit events: {audit.items.length}</p>
    </PageShell>
  );
}
