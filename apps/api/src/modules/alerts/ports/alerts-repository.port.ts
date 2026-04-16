import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
  AlertQueueSummary,
  AlertLifecycleActionRequest,
  AlertReviewStateActionRequest,
  AlertSummary,
  AlertUnassignActionRequest,
  ListResponse
} from "@aquapulse/types";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

export const ALERTS_REPOSITORY = Symbol("ALERTS_REPOSITORY");

export interface AlertsRepositoryPort {
  create(input: CreateAlertsDto): Promise<AlertSummary>;
  update(id: string, input: UpdateAlertsDto): Promise<AlertSummary>;
  acknowledge(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary>;
  bulkAcknowledge(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult>;
  resolve(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary>;
  bulkResolve(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult>;
  assign(id: string, input: AlertAssignActionRequest): Promise<AlertSummary>;
  bulkAssign(input: AlertBulkAssignActionRequest): Promise<AlertBulkActionResult>;
  unassign(id: string, input: AlertUnassignActionRequest): Promise<AlertSummary>;
  setReviewState(id: string, input: AlertReviewStateActionRequest): Promise<AlertSummary>;
  bulkSetReviewState(input: AlertBulkReviewStateActionRequest): Promise<AlertBulkActionResult>;
  listSavedViews(): Promise<AlertSavedViewDefinition[]>;
  saveSavedView(input: AlertSavedViewCreateRequest): Promise<AlertSavedViewDefinition[]>;
  removeSavedView(id: string): Promise<AlertSavedViewDefinition[]>;
  getById(id: string): Promise<AlertSummary>;
  list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>>;
  summary(query: AlertsListQueryContract): Promise<AlertQueueSummary>;
  listOpen(): Promise<ListResponse<AlertSummary>>;
}
