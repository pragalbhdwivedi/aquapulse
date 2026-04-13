import { PageShell } from "../_components/page-shell";

export default function ApprovalsPage() {
  return (
    <PageShell
      title="Approvals"
      description="This route will centralize pending approvals and decision history."
      todo={[
        "Add approval queue and request detail shells.",
        "Connect tasks, expenses, and treatments workflows.",
      ]}
    />
  );
}
