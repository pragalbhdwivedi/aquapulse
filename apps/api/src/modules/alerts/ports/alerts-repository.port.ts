import type {
  AlertAssignActionRequest,
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
  resolve(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary>;
  assign(id: string, input: AlertAssignActionRequest): Promise<AlertSummary>;
  unassign(id: string, input: AlertUnassignActionRequest): Promise<AlertSummary>;
  setReviewState(id: string, input: AlertReviewStateActionRequest): Promise<AlertSummary>;
  getById(id: string): Promise<AlertSummary>;
  list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>>;
  listOpen(): Promise<ListResponse<AlertSummary>>;
}
