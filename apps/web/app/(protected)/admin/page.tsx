import { PageShell } from "../_components/page-shell";

export default function AdminPage() {
  return (
    <PageShell
      title="Admin"
      description="This route will hold operational admin tools and internal configuration workflows."
      todo={[
        "Add admin panels and privilege-aware sections.",
        "Connect users, roles, and system maintenance actions.",
      ]}
    />
  );
}
