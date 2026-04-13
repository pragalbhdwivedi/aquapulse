import { PageShell } from "../_components/page-shell";

export default function ReportsPage() {
  return (
    <PageShell
      title="Reports"
      description="This route will host generated reports, exports, and analytical summaries."
      todo={[
        "Add report catalog and generation state shells.",
        "Connect reporting filters and export actions.",
      ]}
    />
  );
}
