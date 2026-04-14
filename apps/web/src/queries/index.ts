import type {
  AiDashboardQueryResponse,
  AiPondsSummarizeResponse,
  AiHandoverGenerateResponse,
  AlertSummary,
  ApiSuccessEnvelope,
  AuditEvent,
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
  pondsRepository,
  tasksRepository,
  waterQualityRepository
} from "../repositories";

type EnvelopeData<TEnvelope> = TEnvelope extends ApiSuccessEnvelope<infer TData> ? TData : never;
type WaterQualityList = EnvelopeData<Awaited<ReturnType<typeof waterQualityRepository.listByPond>>>;

const defaultPondsQuery: PondsListQuery = { page: 1, pageSize: 20 };
const defaultAlertsQuery: AlertsListQuery = { page: 1, pageSize: 20 };
const defaultTasksQuery: TasksListQuery = { page: 1, pageSize: 20 };
const defaultAuditQuery: AuditListQuery = { page: 1, pageSize: 20 };

export async function getDashboardPageData(): Promise<{
  ponds: ListResponse<PondSummary>;
  alerts: ListResponse<AlertSummary>;
  tasks: ListResponse<TaskSummary>;
  answer: AiDashboardQueryResponse;
}> {
  const [ponds, alerts, tasks, answer] = await Promise.all([
    pondsRepository.list(defaultPondsQuery),
    alertsRepository.list(defaultAlertsQuery),
    tasksRepository.list(defaultTasksQuery),
    aiRepository.queryDashboard({ question: "What needs attention today?" })
  ]);

  return {
    ponds: ponds.data,
    alerts: alerts.data,
    tasks: tasks.data,
    answer: answer.data
  };
}

export async function getPondsPageData(): Promise<ListResponse<PondSummary>> {
  const ponds = await pondsRepository.list(defaultPondsQuery);
  return ponds.data;
}

export async function getPondDetailPageData(pondId: string): Promise<{
  pond: PondSummary;
  waterQuality: WaterQualityList;
  summary: AiPondsSummarizeResponse;
}> {
  const [pond, waterQuality, summary] = await Promise.all([
    pondsRepository.getById(pondId),
    waterQualityRepository.listByPond(pondId, { page: 1, pageSize: 20 }),
    pondsRepository.summarize({ pondId })
  ]);

  return {
    pond: pond.data,
    waterQuality: waterQuality.data,
    summary: summary.data
  };
}

export async function getPondMapPageData(): Promise<ListResponse<PondSummary>> {
  const ponds = await pondsRepository.list(defaultPondsQuery);
  return ponds.data;
}

export async function getAlertsPageData(): Promise<{
  alerts: ListResponse<AlertSummary>;
  explanation: string;
}> {
  const alerts = await alertsRepository.list(defaultAlertsQuery);
  const explanation = await alertsRepository.explain({ alertId: alerts.data.items[0]?.id ?? "alert-1" });

  return {
    alerts: alerts.data,
    explanation: explanation.data.explanation
  };
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

export async function getTasksPageData(): Promise<ListResponse<TaskSummary>> {
  const tasks = await tasksRepository.list(defaultTasksQuery);
  return tasks.data;
}
