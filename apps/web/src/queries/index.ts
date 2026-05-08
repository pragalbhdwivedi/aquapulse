import type {
  AlertsListQueryRequest,
  AlertQueueSummary,
  AiApprovalNoteDraftResponse,
  AiDashboardQueryResponse,
  AiPondsSummarizeResponse,
  AiHandoverGenerateResponse,
  AiTextRewriteResponse,
  AlertSummary,
  ApiSuccessEnvelope,
  AuditEvent,
  FeedEntry,
  ListResponse,
  PondSummary,
  TaskSummary,
  WaterQualityReading
} from "@aquapulse/types";
import { buildAlertQueueSummary } from "@aquapulse/types";
import type { AlertsListQuery, AuditListQuery, PondsListQuery, TasksListQuery } from "../contracts/api";
import { getAlertSummaryQuery } from "../features/alert-workbench";
import {
  aiRepository,
  alertsRepository,
  auditRepository,
  feedRepository,
  pondsRepository,
  tasksRepository,
  waterQualityRepository
} from "../repositories";
import type { AquaPulseRepositories } from "../repositories";

type EnvelopeData<TEnvelope> = TEnvelope extends ApiSuccessEnvelope<infer TData> ? TData : never;
type WaterQualityList = EnvelopeData<Awaited<ReturnType<typeof waterQualityRepository.listByPond>>>;

const defaultPondsQuery: PondsListQuery = { page: 1, pageSize: 20 };
const defaultAlertsQuery: AlertsListQuery = { page: 1, pageSize: 20, sortBy: "updatedAt_desc" };
const defaultTasksQuery: TasksListQuery = { page: 1, pageSize: 20 };
const defaultAuditQuery: AuditListQuery = { page: 1, pageSize: 20 };

function buildFallbackAlertsSummary(alerts: ListResponse<AlertSummary>): AlertQueueSummary {
  return buildAlertQueueSummary(alerts.items);
}

async function loadAlertsSummaryWithFallback(
  repositories: Pick<AquaPulseRepositories, "alerts">,
  query: Partial<AlertsListQueryRequest>,
  fallbackAlerts: ListResponse<AlertSummary>
): Promise<{
  summary: AlertQueueSummary;
  source: "backend" | "fallback";
}> {
  try {
    const summary = await repositories.alerts.summary(getAlertSummaryQuery(query));
    return {
      summary: summary.data,
      source: "backend"
    };
  } catch {
    return {
      summary: buildFallbackAlertsSummary(fallbackAlerts),
      source: "fallback"
    };
  }
}

export function createReadonlyQueries(repositories: Pick<
  AquaPulseRepositories,
  "ponds" | "alerts" | "tasks" | "ai" | "waterQuality"
>) {
  return {
    async getDashboardPageData(): Promise<{
      ponds: ListResponse<PondSummary>;
      alerts: ListResponse<AlertSummary>;
      alertSummary: AlertQueueSummary;
      tasks: ListResponse<TaskSummary>;
      answer: AiDashboardQueryResponse;
    }> {
      const [ponds, alerts, tasks, answer] = await Promise.all([
        repositories.ponds.list(defaultPondsQuery),
        repositories.alerts.list(defaultAlertsQuery),
        repositories.tasks.list(defaultTasksQuery),
        repositories.ai.queryDashboard({ question: "What needs attention first today?" })
      ]);
      const alertSummary = await loadAlertsSummaryWithFallback(
        repositories,
        { page: 1, pageSize: 20 },
        alerts.data
      );

      return {
        ponds: ponds.data,
        alerts: alerts.data,
        alertSummary: alertSummary.summary,
        tasks: tasks.data,
        answer: answer.data
      };
    },
    async getPondsPageData(): Promise<ListResponse<PondSummary>> {
      const ponds = await repositories.ponds.list(defaultPondsQuery);
      return ponds.data;
    },
    async getPondDetailPageData(pondId: string): Promise<{
      pond: PondSummary;
      waterQuality: WaterQualityList;
      summary: AiPondsSummarizeResponse;
    }> {
      const [pond, waterQuality, summary] = await Promise.all([
        repositories.ponds.getById(pondId),
        repositories.waterQuality.listByPond(pondId, { page: 1, pageSize: 20 }),
        repositories.ponds.summarize({ pondId })
      ]);

      return {
        pond: pond.data,
        waterQuality: waterQuality.data,
        summary: summary.data
      };
    },
    async getPondOverviewPageData(pondId: string): Promise<{
      pond: PondSummary;
      summary: AiPondsSummarizeResponse;
    }> {
      const [pond, summary] = await Promise.all([
        repositories.ponds.getById(pondId),
        repositories.ponds.summarize({ pondId })
      ]);

      return {
        pond: pond.data,
        summary: summary.data
      };
    },
    async getPondRecentWaterQualityPageData(pondId: string): Promise<WaterQualityList> {
      const waterQuality = await repositories.waterQuality.listByPond(pondId, { page: 1, pageSize: 20 });
      return waterQuality.data;
    },
    async getWaterQualityDetailPageData(
      readingId: string
    ): Promise<WaterQualityReading> {
      const detail = await repositories.waterQuality.getById(readingId);
      return detail.data;
    },
    async getAlertsPageData(query: AlertsListQuery = defaultAlertsQuery): Promise<{
      alerts: ListResponse<AlertSummary>;
      summary: AlertQueueSummary;
      summarySource: "backend" | "fallback";
      explanation: string;
    }> {
      const alerts = await repositories.alerts.list(query);
      const summaryQuery: AlertsListQuery = {
        ...query,
        status: undefined,
        reviewState: undefined
      };
      const summary = await loadAlertsSummaryWithFallback(repositories, summaryQuery, alerts.data);
      const explanation = await repositories.alerts.explain({
        alertId: alerts.data.items[0]?.id ?? "alert-1"
      });

      return {
        alerts: alerts.data,
        summary: summary.summary,
        summarySource: summary.source,
        explanation: explanation.data.explanation
      };
    },
    async getTasksPageData(): Promise<ListResponse<TaskSummary>> {
      const tasks = await repositories.tasks.list(defaultTasksQuery);
      return tasks.data;
    }
  };
}

const readonlyQueries = createReadonlyQueries({
  ponds: pondsRepository,
  alerts: alertsRepository,
  tasks: tasksRepository,
  ai: aiRepository,
  waterQuality: waterQualityRepository
});

export async function getDashboardPageData(): Promise<{
  ponds: ListResponse<PondSummary>;
  alerts: ListResponse<AlertSummary>;
  alertSummary: AlertQueueSummary;
  tasks: ListResponse<TaskSummary>;
  answer: AiDashboardQueryResponse;
}> {
  return readonlyQueries.getDashboardPageData();
}

export async function getPondsPageData(): Promise<ListResponse<PondSummary>> {
  return readonlyQueries.getPondsPageData();
}

export async function getPondDetailPageData(pondId: string): Promise<{
  pond: PondSummary;
  waterQuality: WaterQualityList;
  summary: AiPondsSummarizeResponse;
}> {
  return readonlyQueries.getPondDetailPageData(pondId);
}

export async function getPondOverviewPageData(pondId: string): Promise<{
  pond: PondSummary;
  summary: AiPondsSummarizeResponse;
}> {
  return readonlyQueries.getPondOverviewPageData(pondId);
}

export async function getPondRecentWaterQualityPageData(
  pondId: string
): Promise<WaterQualityList> {
  return readonlyQueries.getPondRecentWaterQualityPageData(pondId);
}

export async function getPondOverviewPreviewData(pondId: string): Promise<{
  pond?: PondSummary;
  summary: AiPondsSummarizeResponse;
}> {
  const [ponds, summary] = await Promise.all([
    pondsRepository.list(defaultPondsQuery),
    pondsRepository.summarize({ pondId })
  ]);

  return {
    pond: ponds.data.items.find((item) => item.id === pondId),
    summary: summary.data
  };
}

export async function getPondDetailPagePreviewData(pondId: string): Promise<{
  pond?: PondSummary;
  waterQuality: WaterQualityList;
  summary: AiPondsSummarizeResponse;
}> {
  const [ponds, waterQuality, summary] = await Promise.all([
    pondsRepository.list(defaultPondsQuery),
    waterQualityRepository.listByPond(pondId, { page: 1, pageSize: 20 }),
    pondsRepository.summarize({ pondId })
  ]);

  return {
    pond: ponds.data.items.find((item) => item.id === pondId),
    waterQuality: waterQuality.data,
    summary: summary.data
  };
}

export async function getWaterQualityDetailPageData(
  readingId: string
): Promise<WaterQualityReading> {
  return readonlyQueries.getWaterQualityDetailPageData(readingId);
}

export async function getPondMapPageData(): Promise<ListResponse<PondSummary>> {
  const ponds = await pondsRepository.list(defaultPondsQuery);
  return ponds.data;
}

export async function getAlertsPageData(query: AlertsListQuery = defaultAlertsQuery): Promise<{
  alerts: ListResponse<AlertSummary>;
  summary: AlertQueueSummary;
  summarySource: "backend" | "fallback";
  explanation: string;
}> {
  return readonlyQueries.getAlertsPageData(query);
}

export async function getReportsPageData(): Promise<{
  ponds: ListResponse<PondSummary>;
  alerts: ListResponse<AlertSummary>;
  dailySummary: AiPondsSummarizeResponse;
  handover: AiHandoverGenerateResponse;
  incidentRewrite: AiTextRewriteResponse;
  approvalNote: AiApprovalNoteDraftResponse;
}> {
  const [ponds, alerts, dailySummary, handover, incidentRewrite, approvalNote] = await Promise.all([
    pondsRepository.list(defaultPondsQuery),
    alertsRepository.list(defaultAlertsQuery),
    pondsRepository.summarize({ generatedForDate: "2026-04-13T00:00:00.000Z", includeMissingDataSignals: true }),
    aiRepository.generateHandover({ shiftDate: "2026-04-13T00:00:00.000Z" }),
    aiRepository.rewriteText({
      originalText: "night shift saw oxygen warning at north pond checked aerator and logged repeat sample",
      tone: "operator",
      outputMode: "bilingual",
      linkedRecordType: "alert",
      linkedRecordId: "alert-1"
    }),
    aiRepository.draftApprovalNote({
      recordType: "alert",
      recordId: "alert-1",
      mode: "needs_review",
      promptNote: "Need wording for supervisor follow-up before approval.",
      outputMode: "english_only"
    })
  ]);

  return {
    ponds: ponds.data,
    alerts: alerts.data,
    dailySummary: dailySummary.data,
    handover: handover.data,
    incidentRewrite: incidentRewrite.data,
    approvalNote: approvalNote.data
  };
}

export async function getAuditPageData(): Promise<ListResponse<AuditEvent>> {
  const audit = await auditRepository.list(defaultAuditQuery);
  return audit.data;
}

export async function getFeedPageData(): Promise<ListResponse<FeedEntry>> {
  const feed = await feedRepository.list({ page: 1, pageSize: 20 });
  return feed.data;
}

export async function getFeedDetailPageData(
  entryId: string
): Promise<FeedEntry> {
  const detail = await feedRepository.getById(entryId);
  return detail.data;
}

export async function getTaskDetailPageData(
  taskId: string
): Promise<TaskSummary> {
  const detail = await tasksRepository.getById(taskId);
  return detail.data;
}

export async function getTasksPageData(): Promise<ListResponse<TaskSummary>> {
  return readonlyQueries.getTasksPageData();
}
