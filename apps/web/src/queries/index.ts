import type {
  AiDashboardQueryResponse,
  AiPondsSummarizeResponse,
  AiHandoverGenerateResponse,
  AlertSummary,
  ApiSuccessEnvelope,
  AuditEvent,
  FeedEntry,
  ListResponse,
  PondSummary,
  TaskSummary,
  WaterQualityReading
} from "@aquapulse/types";
import type { AlertsListQuery, AuditListQuery, PondsListQuery, TasksListQuery } from "../contracts/api";
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

export function createReadonlyQueries(repositories: Pick<
  AquaPulseRepositories,
  "ponds" | "alerts" | "tasks" | "ai" | "waterQuality"
>) {
  return {
    async getDashboardPageData(): Promise<{
      ponds: ListResponse<PondSummary>;
      alerts: ListResponse<AlertSummary>;
      tasks: ListResponse<TaskSummary>;
      answer: AiDashboardQueryResponse;
    }> {
      const [ponds, alerts, tasks, answer] = await Promise.all([
        repositories.ponds.list(defaultPondsQuery),
        repositories.alerts.list(defaultAlertsQuery),
        repositories.tasks.list(defaultTasksQuery),
        repositories.ai.queryDashboard({ question: "What needs attention today?" })
      ]);

      return {
        ponds: ponds.data,
        alerts: alerts.data,
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
    async getAlertsPageData(query: AlertsListQuery = defaultAlertsQuery): Promise<{
      alerts: ListResponse<AlertSummary>;
      explanation: string;
    }> {
      const alerts = await repositories.alerts.list(query);
      const explanation = await repositories.alerts.explain({
        alertId: alerts.data.items[0]?.id ?? "alert-1"
      });

      return {
        alerts: alerts.data,
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

export async function getPondMapPageData(): Promise<ListResponse<PondSummary>> {
  const ponds = await pondsRepository.list(defaultPondsQuery);
  return ponds.data;
}

export async function getAlertsPageData(query: AlertsListQuery = defaultAlertsQuery): Promise<{
  alerts: ListResponse<AlertSummary>;
  explanation: string;
}> {
  return readonlyQueries.getAlertsPageData(query);
}

export async function getReportsPageData(): Promise<{
  ponds: ListResponse<PondSummary>;
  alerts: ListResponse<AlertSummary>;
  handover: AiHandoverGenerateResponse;
}> {
  const [ponds, alerts, handover] = await Promise.all([
    pondsRepository.list(defaultPondsQuery),
    alertsRepository.list(defaultAlertsQuery),
    aiRepository.generateHandover({ shiftDate: "2026-04-13T00:00:00.000Z" })
  ]);

  return {
    ponds: ponds.data,
    alerts: alerts.data,
    handover: handover.data
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

export async function getTasksPageData(): Promise<ListResponse<TaskSummary>> {
  return readonlyQueries.getTasksPageData();
}
