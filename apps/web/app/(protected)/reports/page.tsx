import { getReportsPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function ReportsPage() {
  const reports = await getReportsPageData();

  return (
    <PageShell title="Reports" description="Placeholder reports route using the repository and query layer.">
      <p>Data points: {reports.ponds.items.length + reports.alerts.items.length}</p>
      <p>Handover: {reports.handover.summary}</p>
    </PageShell>
  );
}
