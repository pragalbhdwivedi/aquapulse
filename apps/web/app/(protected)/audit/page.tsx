import { PageShell } from "../_components/page-shell";

export default function AuditPage() {
  return (
    <PageShell
      title="Audit"
      description="This route will support traceability, actor history, and resource audit trails."
      todo={[
        "Add audit event listing and filter shells.",
        "Connect actor, resource, and action metadata.",
      ]}
    />
  );
}
