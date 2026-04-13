import { PageShell } from "../../_components/page-shell";

type BatchDetailPageProps = {
  params: Promise<{
    batchId: string;
  }>;
};

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { batchId } = await params;

  return (
    <PageShell
      title={`Batch ${batchId}`}
      description="This detail route is reserved for lifecycle tracking and batch-level records."
      todo={[
        "Add batch summary, events, and related resources.",
        "Connect pond assignments, mortality, and treatment history.",
      ]}
    />
  );
}
