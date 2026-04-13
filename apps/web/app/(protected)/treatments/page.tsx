import { PageShell } from "../_components/page-shell";

export default function TreatmentsPage() {
  return (
    <PageShell
      title="Treatments"
      description="This route will hold treatment definitions, schedules, and execution records."
      todo={[
        "Add treatment registry and action history shells.",
        "Connect approvals and health-related references.",
      ]}
    />
  );
}
