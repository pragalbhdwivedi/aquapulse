import { PageShell } from "../_components/page-shell";

export default function PondsPage() {
  return (
    <PageShell
      title="Ponds"
      description="This route will hold pond, tank, and unit listing workflows."
      todo={[
        "Add searchable pond list and filters.",
        "Connect pond status, occupancy, and capacity summaries.",
      ]}
    />
  );
}
