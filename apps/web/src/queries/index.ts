import type {
  AiDashboardQueryResponse,
  AiHandoverGenerateResponse,
  AlertSummary,
  AuditEvent,
  ListResponse,
  PondSummary,
  TaskSummary
} from "@aquapulse/types";
import { aiRepository, alertsRepository, auditRepository, pondsRepository, tasksRepository } from "../repositories";

export async function getDashboardSnapshot(): Promise<{
  ponds: ListResponse<PondSummary>;
  alerts: ListResponse<AlertSummary>;
  tasks: ListResponse<TaskSummary>;
  answer: AiDashboardQueryResponse;
}> {
  const [ponds, alerts, tasks, answer] = await Promise.all([
    pondsRepository.list(),
    alertsRepository.list(),
    tasksRepository.list(),
    aiRepository.queryDashboard({ question: "What needs attention today?" })
  ]);

  return {
    ponds: ponds.data,
    alerts: alerts.data,
    tasks: tasks.data,
    answer: answer.data
  };
}

export async function getReportsSnapshot(): Promise<{
  ponds: ListResponse<PondSummary>;
  alerts: ListResponse<AlertSummary>;
  handover: AiHandoverGenerateResponse;
}> {
  const [ponds, alerts, handover] = await Promise.all([
    pondsRepository.list(),
    alertsRepository.list(),
    aiRepository.generateHandover({ shiftDate: "2026-04-13T00:00:00.000Z" })
  ]);

  return {
    ponds: ponds.data,
    alerts: alerts.data,
    handover: handover.data
  };
}

export async function getAuditSnapshot(): Promise<ListResponse<AuditEvent>> {
  const audit = await auditRepository.list();
  return audit.data;
}
