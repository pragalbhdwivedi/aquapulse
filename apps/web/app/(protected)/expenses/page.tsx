import { PageShell } from "../_components/page-shell";

export default function ExpensesPage() {
  return (
    <PageShell
      title="Expenses"
      description="This route will capture operational expenses and approval status."
      todo={[
        "Add expense register and detail shells.",
        "Connect approvals, categories, and reporting summaries.",
      ]}
    />
  );
}
