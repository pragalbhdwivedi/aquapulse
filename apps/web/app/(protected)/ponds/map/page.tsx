import { getPondMapPageData } from "@web/queries";
import { PageShell } from "../../_components/page-shell";

export default async function PondMapPage() {
  const ponds = await getPondMapPageData();

  return (
    <PageShell title="Pond Map" description="Placeholder map route using the repository and query layer.">
      <p>Ponds available for mapping: {ponds.items.length}</p>
    </PageShell>
  );
}
