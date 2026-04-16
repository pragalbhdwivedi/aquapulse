import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
  AlertSummary,
  AlertUnassignActionRequest,
  ApiSuccessEnvelope,
  ListResponse
} from "@aquapulse/types";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type {
  AcknowledgeAlertDto,
  AssignAlertDto,
  BulkAcknowledgeAlertsDto,
  BulkAssignAlertsDto,
  BulkResolveAlertsDto,
  BulkSetAlertReviewStateDto,
  CreateAlertSavedViewDto,
  CreateAlertsDto,
  QueryAlertsDto,
  ResolveAlertDto,
  SetAlertReviewStateDto,
  UnassignAlertDto,
  UpdateAlertsDto
} from "../dto";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateAlertsInput(input: CreateAlertsDto): CreateAlertsDto {
  return input;
}

export function toUpdateAlertsInput(input: UpdateAlertsDto): UpdateAlertsDto {
  return input;
}

export function toAcknowledgeAlertInput(input: AcknowledgeAlertDto): AlertLifecycleActionRequest {
  return input;
}

export function toResolveAlertInput(input: ResolveAlertDto): AlertLifecycleActionRequest {
  return input;
}

export function toBulkAcknowledgeAlertsInput(
  input: BulkAcknowledgeAlertsDto
): AlertBulkLifecycleActionRequest {
  return input;
}

export function toBulkResolveAlertsInput(
  input: BulkResolveAlertsDto
): AlertBulkLifecycleActionRequest {
  return input;
}

export function toAssignAlertInput(input: AssignAlertDto): AlertAssignActionRequest {
  return input;
}

export function toBulkAssignAlertsInput(input: BulkAssignAlertsDto): AlertBulkAssignActionRequest {
  return input;
}

export function toUnassignAlertInput(input: UnassignAlertDto): AlertUnassignActionRequest {
  return input;
}

export function toSetAlertReviewStateInput(
  input: SetAlertReviewStateDto
): AlertReviewStateActionRequest {
  return input;
}

export function toBulkSetAlertReviewStateInput(
  input: BulkSetAlertReviewStateDto
): AlertBulkReviewStateActionRequest {
  return input;
}

export function toCreateAlertSavedViewInput(
  input: CreateAlertSavedViewDto
): AlertSavedViewCreateRequest {
  return input;
}

export function toQueryAlertsInput(input: QueryAlertsDto): AlertsListQueryContract {
  return toRepositoryListQuery(input, {
    pondId: input.pondId,
    severity: input.severity,
    status: input.status,
    source: input.source,
    assignedTo: input.assignedTo,
    reviewState: input.reviewState,
    hasLatestNote: input.hasLatestNote,
    sortBy: input.sortBy
  });
}

export function toAlertsItemResponse(item: AlertSummary): ApiSuccessEnvelope<AlertSummary> {
  return createItemResponse(item);
}

export function toAlertsListResponse(list: ListResponse<AlertSummary>): ApiSuccessEnvelope<ListResponse<AlertSummary>> {
  return createListResponse(list.items, list.page);
}

export function toAlertsSummaryResponse(
  summary: AlertQueueSummary
): ApiSuccessEnvelope<AlertQueueSummary> {
  return createItemResponse(summary);
}

export function toAlertsBulkActionResponse(
  result: AlertBulkActionResult
): ApiSuccessEnvelope<AlertBulkActionResult> {
  return createItemResponse(result);
}

export function toAlertSavedViewsResponse(
  views: AlertSavedViewDefinition[]
): ApiSuccessEnvelope<AlertSavedViewDefinition[]> {
  return createItemResponse(views);
}
