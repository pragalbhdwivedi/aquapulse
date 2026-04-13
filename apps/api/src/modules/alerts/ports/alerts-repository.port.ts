import type { AlertSummary, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "../dto";

export const ALERTS_REPOSITORY = Symbol("ALERTS_REPOSITORY");

export interface AlertsRepositoryPort {
  create(input: CreateAlertsDto): Promise<AlertSummary>;
  update(id: string, input: UpdateAlertsDto): Promise<AlertSummary>;
  getById(id: string): Promise<AlertSummary>;
  list(query: QueryAlertsDto): Promise<ListResponse<AlertSummary>>;
  listOpen(): Promise<ListResponse<AlertSummary>>;
}
