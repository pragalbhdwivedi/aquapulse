import { PageShell } from "../_components/page-shell";

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="This route will manage system, workspace, and user-facing configuration."
      todo={[
        "Add settings navigation groups and detail panels.",
        "Connect preferences, configuration, and integration settings.",
      ]}
    />
  );
}
