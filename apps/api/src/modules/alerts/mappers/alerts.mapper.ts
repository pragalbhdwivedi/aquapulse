import type { AlertSummary, ApiSuccessEnvelope, ListResponse } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toAlertsItemResponse(item: AlertSummary): ApiSuccessEnvelope<AlertSummary> {
  return createItemResponse(item);
}

export function toAlertsListResponse(list: ListResponse<AlertSummary>): ApiSuccessEnvelope<ListResponse<AlertSummary>> {
  return createListResponse(list.items, list.page);
}
