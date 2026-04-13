import { PageShell } from "../../_components/page-shell";

type PondDetailPageProps = {
  params: Promise<{
    pondId: string;
  }>;
};

export default async function PondDetailPage({ params }: PondDetailPageProps) {
  const { pondId } = await params;

  return (
    <PageShell
      title={`Pond ${pondId}`}
      description="This detail route is reserved for pond-specific metrics, stock, and history."
      todo={[
        "Add pond header, tabs, and status widgets.",
        "Connect batch, water-quality, feed, and task context.",
      ]}
    />
  );
}
