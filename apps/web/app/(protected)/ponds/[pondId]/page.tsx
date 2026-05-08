import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import { getPondDetailPageData, getWaterQualityDetailPageData } from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../../_components/page-shell";
import { PondUpdateForm } from "./_components/pond-update-form";
import { WaterQualityDetailReadCard } from "./_components/water-quality-detail-read-card";
import { WaterQualityEntryForm } from "./_components/water-quality-entry-form";
import { WaterQualityUpdateForm } from "./_components/water-quality-update-form";

export default async function PondDetailPage({ params }: { params: Promise<{ pondId: string }> }) {
  const { pondId } = await params;
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const detail = await getPondDetailPageData(pondId);
  const latestReading = detail.waterQuality.items[0];
  const waterQualityReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.nonAlertsReadGuardedSliceLabel ?? "water_quality_detail_read",
    enforcedByBackend: diagnostics.session.nonAlertsReadGuardedSliceEnforced ?? false
  });
  const latestReadingDetail =
    latestReading && waterQualityReadGuard.enabled
      ? await getWaterQualityDetailPageData(latestReading.id).catch(() => undefined)
      : undefined;

  return (
    <PageShell title={detail.pond.name} description="Placeholder pond detail route using the repository and query layer.">
      <p>Code: {detail.pond.code}</p>
      <p>Status: {detail.pond.status}</p>
      <p>Type: {detail.pond.kind}</p>
      <p>Water-quality readings: {detail.waterQuality.items.length}</p>
      <p>AI summary: {detail.summary.summary}</p>
      {latestReading ? (
        <WaterQualityDetailReadCard
          readingPreview={latestReading}
          readingDetail={latestReadingDetail}
          session={diagnostics.session}
        />
      ) : null}
      <PondUpdateForm pond={detail.pond} session={diagnostics.session} />
      <WaterQualityEntryForm pondId={detail.pond.id} session={diagnostics.session} />
      {latestReading ? (
        <WaterQualityUpdateForm
          pondId={detail.pond.id}
          reading={latestReading}
          session={diagnostics.session}
        />
      ) : null}
    </PageShell>
  );
}
