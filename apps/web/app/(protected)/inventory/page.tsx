import { PageShell } from "../_components/page-shell";

export default function InventoryPage() {
  return (
    <PageShell
      title="Inventory"
      description="This route will surface stock levels, movement, and replenishment workflows."
      todo={[
        "Add inventory register and movement history shells.",
        "Connect low-stock alerts and receiving flows.",
      ]}
    />
  );
}
