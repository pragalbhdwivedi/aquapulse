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
      <PageShell title="Pond Detail" description="The bounded pond preview could not be resolved for this route.">
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
    <PageShell
      title={pondPreview.name}
      description="Operator view for pond status, recent water-quality context, and bounded manual update paths."
    >
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem",
          background: "rgba(15, 23, 42, 0.35)"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Pond workflow overview</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Start with the pond snapshot, confirm the latest detailed reading, review the recent history,
          then decide whether a manual pond or water-quality update is needed.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "#cbd5e1" }}>
          <span>Status: {pondPreview.status}</span>
          <span>Type: {pondPreview.kind}</span>
          <span>Recent readings: {recentWaterQuality?.items.length ?? 0}</span>
          <span>Latest detail: {latestReadingDetail ? "full detail loaded" : latestReading ? "preview only" : "no reading yet"}</span>
        </div>
        <span style={{ color: "#94a3b8" }}>
          Next check: {latestReading ? "review the most recent reading and recent history before editing." : "add the first water-quality reading for this pond."}
        </span>
      </section>
      <PondDetailReadCard pondPreview={pondPreview} pondDetail={pondDetail} session={diagnostics.session} />
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Operator summary</strong>
        <p style={{ margin: 0 }}>Code: {pondPreview.code}</p>
        <p style={{ margin: 0 }}>Status: {pondPreview.status}</p>
        <p style={{ margin: 0 }}>Type: {pondPreview.kind}</p>
        <p style={{ margin: 0 }}>Water-quality readings in recent history: {recentWaterQuality?.items.length ?? 0}</p>
        <p style={{ margin: 0, color: "#cbd5e1" }}>AI summary: {overview.summary.summary}</p>
      </section>
      <WaterQualityRecentReadCard readings={recentWaterQuality} session={diagnostics.session} />
      {latestReading ? (
        <WaterQualityDetailReadCard
          readingPreview={latestReading}
          readingDetail={latestReadingDetail}
          session={diagnostics.session}
        />
      ) : null}
      <section
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: "0.75rem"
        }}
      >
        <strong style={{ fontSize: "1rem" }}>Manual update actions</strong>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          These forms stay manual and review-first. Protected create and update actions may require a forwarded session in active auth mode, while disabled/local modes keep the bounded bypass path readable.
        </p>
      </section>
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
