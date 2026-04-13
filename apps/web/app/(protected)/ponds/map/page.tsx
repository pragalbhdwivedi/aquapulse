import { apiClients } from "@web/clients";
import { PageShell } from "../../_components/page-shell";

export default async function PondMapPage() {
  const ponds = await apiClients.ponds.list();

  return (
    <PageShell title="Pond Map" description="Placeholder map route using API clients only.">
      <p>Ponds available for mapping: {ponds.data.items.length}</p>
    </PageShell>
  );
}
