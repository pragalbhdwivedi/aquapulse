import { pondsMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../../_components/page-shell";

export default async function PondMapPage() {
  const ponds = await pondsMockAdapter.list();

  return (
    <PageShell title="Pond Map" description="Placeholder spatial route using pond contract data only.">
      <div style={{ border: "1px dashed #1f2937", borderRadius: "16px", padding: "1rem" }}>
        <p>Map canvas placeholder</p>
        <p>Ponds available for mapping: {ponds.data.items.length}</p>
      </div>
    </PageShell>
  );
}
