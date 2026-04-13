import type {
  AiDashboardQueryRequest,
  AiDashboardQueryResponse,
  AiHandoverGenerateRequest,
  AiHandoverGenerateResponse,
  AlertSummary,
  ApiSuccessEnvelope,
  AuditEvent,
  ListResponse,
  PondSummary,
  TaskSummary
} from "@aquapulse/types";
import { apiClients } from "../clients";

export const pondsRepository = {
  list(): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>> {
    return apiClients.ponds.list();
  },
  getById(id: string): Promise<ApiSuccessEnvelope<PondSummary>> {
    return apiClients.ponds.getById(id);
  }
};

export const alertsRepository = {
  list(): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>> {
    return apiClients.alerts.list();
  }
};

export const tasksRepository = {
  list(): Promise<ApiSuccessEnvelope<ListResponse<TaskSummary>>> {
    return apiClients.tasks.list();
  }
};

export const auditRepository = {
  list(): Promise<ApiSuccessEnvelope<ListResponse<AuditEvent>>> {
    return apiClients.audit.list();
  }
};

export const aiRepository = {
  queryDashboard(input: AiDashboardQueryRequest): Promise<ApiSuccessEnvelope<AiDashboardQueryResponse>> {
    return apiClients.ai.queryDashboard(input);
  },
  generateHandover(input: AiHandoverGenerateRequest): Promise<ApiSuccessEnvelope<AiHandoverGenerateResponse>> {
    return apiClients.ai.generateHandover(input);
  }
};
