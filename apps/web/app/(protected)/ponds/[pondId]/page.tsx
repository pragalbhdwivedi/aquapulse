import { deriveProtectedReadUiGuard } from "@web/features/auth-session";
import {
  getPondOverviewPageData,
  getPondOverviewPreviewData,
  getPondRecentWaterQualityPageData,
  getWaterQualityDetailPageData
} from "@web/queries";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../../_components/page-shell";
import { PondDetailReadCard } from "./_components/pond-detail-read-card";
import { PondUpdateForm } from "./_components/pond-update-form";
import { WaterQualityDetailReadCard } from "./_components/water-quality-detail-read-card";
import { WaterQualityEntryForm } from "./_components/water-quality-entry-form";
import { WaterQualityRecentReadCard } from "./_components/water-quality-recent-read-card";
import { WaterQualityUpdateForm } from "./_components/water-quality-update-form";

export default async function PondDetailPage({ params }: { params: Promise<{ pondId: string }> }) {
  const { pondId } = await params;
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const pondReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.tertiaryNonAlertsReadGuardedSliceLabel ?? "ponds_detail_read",
    enforcedByBackend: diagnostics.session.tertiaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const recentReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.quinaryNonAlertsReadGuardedSliceLabel ?? "water_quality_recent_read",
    enforcedByBackend: diagnostics.session.quinaryNonAlertsReadGuardedSliceEnforced ?? false
  });
  const overview = pondReadGuard.enabled
    ? await getPondOverviewPageData(pondId).catch(() => getPondOverviewPreviewData(pondId))
    : await getPondOverviewPreviewData(pondId);
  const recentWaterQuality = recentReadGuard.enabled
    ? await getPondRecentWaterQualityPageData(pondId).catch(() => undefined)
    : undefined;
  const pondPreview = overview.pond;
  const pondDetail = pondReadGuard.enabled && overview.pond ? overview.pond : undefined;

  if (!pondPreview) {
    return (
      <PageShell title="Pond Detail" description="Bounded pond detail preview was not available for this route.">
        <p>The requested pond preview could not be resolved from the current bounded read path.</p>
      </PageShell>
    );
  }
  const latestReading = recentWaterQuality?.items[0];
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
      <p>Water-quality readings: {recentWaterQuality?.items.length ?? 0}</p>
      <p>AI summary: {overview.summary.summary}</p>
      <WaterQualityRecentReadCard readings={recentWaterQuality} session={diagnostics.session} />
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
