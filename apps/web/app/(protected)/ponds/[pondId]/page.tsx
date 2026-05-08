import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import {
  getPondDetailPageData,
  getPondDetailPagePreviewData,
  getWaterQualityDetailPageData
} from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../../_components/page-shell";
import { PondDetailReadCard } from "./_components/pond-detail-read-card";
import { PondUpdateForm } from "./_components/pond-update-form";
import { WaterQualityDetailReadCard } from "./_components/water-quality-detail-read-card";
import { WaterQualityEntryForm } from "./_components/water-quality-entry-form";
import { WaterQualityUpdateForm } from "./_components/water-quality-update-form";

export default async function PondDetailPage({ params }: { params: Promise<{ pondId: string }> }) {
  const { pondId } = await params;
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const pondReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.tertiaryNonAlertsReadGuardedSliceLabel ?? "ponds_detail_read",
    enforcedByBackend: diagnostics.session.tertiaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const detail = pondReadGuard.enabled
    ? await getPondDetailPageData(pondId).catch(() => getPondDetailPagePreviewData(pondId))
    : await getPondDetailPagePreviewData(pondId);
  const pondPreview = detail.pond;
  const pondDetail =
    pondReadGuard.enabled && detail.pond ? detail.pond : undefined;

  if (!pondPreview) {
    return (
      <PageShell title="Pond Detail" description="Bounded pond detail preview was not available for this route.">
        <p>The requested pond preview could not be resolved from the current bounded read path.</p>
      </PageShell>
    );
  }
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
    <PageShell title={pondPreview.name} description="Placeholder pond detail route using the repository and query layer.">
      <PondDetailReadCard pondPreview={pondPreview} pondDetail={pondDetail} session={diagnostics.session} />
      <p>Code: {pondPreview.code}</p>
      <p>Status: {pondPreview.status}</p>
      <p>Type: {pondPreview.kind}</p>
      <p>Water-quality readings: {detail.waterQuality.items.length}</p>
      <p>AI summary: {detail.summary.summary}</p>
      {latestReading ? (
        <WaterQualityDetailReadCard
          readingPreview={latestReading}
          readingDetail={latestReadingDetail}
          session={diagnostics.session}
        />
      ) : null}
      <PondUpdateForm pond={pondPreview} session={diagnostics.session} />
      <WaterQualityEntryForm pondId={pondPreview.id} session={diagnostics.session} />
      {latestReading ? (
        <WaterQualityUpdateForm
          pondId={pondPreview.id}
          reading={latestReading}
          session={diagnostics.session}
        />
      ) : null}
    </PageShell>
  );
}
