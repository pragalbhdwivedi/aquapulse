import { PageShell } from "../_components/page-shell";

export default function AlertsPage() {
  return (
    <PageShell
      title="Alerts"
      description="This route will surface alerts, escalations, and acknowledgement flows."
      todo={[
        "Add alert inbox and detail shells.",
        "Connect severity, source, and assignee context.",
      ]}
    />
  );
}
