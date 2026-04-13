import { PageShell } from "../_components/page-shell";

export default function MortalityPage() {
  return (
    <PageShell
      title="Mortality"
      description="This route will support mortality logging, review, and loss analysis."
      todo={[
        "Add mortality event listing and detail shells.",
        "Connect batch, pond, and treatment references.",
      ]}
    />
  );
}
