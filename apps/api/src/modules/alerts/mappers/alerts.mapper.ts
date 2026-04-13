import type { AlertSummary, ApiSuccessEnvelope, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "../dto";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateAlertsInput(input: CreateAlertsDto): CreateAlertsDto {
  return input;
}

export function toUpdateAlertsInput(input: UpdateAlertsDto): UpdateAlertsDto {
  return input;
}

export function toQueryAlertsInput(input: QueryAlertsDto): QueryAlertsDto {
  return input;
}

export function toAlertsItemResponse(item: AlertSummary): ApiSuccessEnvelope<AlertSummary> {
  return createItemResponse(item);
}

export function toAlertsListResponse(list: ListResponse<AlertSummary>): ApiSuccessEnvelope<ListResponse<AlertSummary>> {
  return createListResponse(list.items, list.page);
}
