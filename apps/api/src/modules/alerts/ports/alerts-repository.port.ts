import type { AlertSummary, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

export const ALERTS_REPOSITORY = Symbol("ALERTS_REPOSITORY");

export interface AlertsRepositoryPort {
  create(input: CreateAlertsDto): Promise<AlertSummary>;
  update(id: string, input: UpdateAlertsDto): Promise<AlertSummary>;
  getById(id: string): Promise<AlertSummary>;
  list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>>;
  listOpen(): Promise<ListResponse<AlertSummary>>;
}
