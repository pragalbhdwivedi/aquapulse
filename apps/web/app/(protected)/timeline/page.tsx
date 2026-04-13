import { PageShell } from "../_components/page-shell";

export default function TimelinePage() {
  return (
    <PageShell
      title="Timeline"
      description="This route will aggregate cross-module operational events into a chronological view."
      todo={[
        "Add timeline feed and filtering shells.",
        "Connect audit, alerts, tasks, and approvals events.",
      ]}
    />
  );
}
