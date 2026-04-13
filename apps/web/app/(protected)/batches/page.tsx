import { PageShell } from "../_components/page-shell";

export default function BatchesPage() {
  return (
    <PageShell
      title="Batches"
      description="This route will manage stock batches, movement, and traceability."
      todo={[
        "Add batch table and filtering patterns.",
        "Connect stocking, transfer, and status timeline data.",
      ]}
    />
  );
}
