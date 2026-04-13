import type { ApiSuccessEnvelope, ListResponse, TaskSummary } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toTasksItemResponse(item: TaskSummary): ApiSuccessEnvelope<TaskSummary> {
  return createItemResponse(item);
}

export function toTasksListResponse(list: ListResponse<TaskSummary>): ApiSuccessEnvelope<ListResponse<TaskSummary>> {
  return createListResponse(list.items, list.page);
}
