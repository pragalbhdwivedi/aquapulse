import { PageShell } from "../_components/page-shell";

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="This placeholder page will eventually surface farm KPIs, alerts, and operational summaries."
      todo={[
        "Add overview widgets and summary cards.",
        "Connect reports, alerts, and timeline data sources.",
      ]}
    />
  );
}
