import type {
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  AiHandoverGenerateResponse,
  AiIncidentsDraftResponse,
  AiPondsSummarizeResponse,
  AiResponseRecord,
  AiTextRewriteResponse,
  ApiSuccessEnvelope,
  ListResponse
} from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toAiItemResponse(item: AiResponseRecord): ApiSuccessEnvelope<AiResponseRecord> {
  return createItemResponse(item);
}

export function toAiListResponse(list: ListResponse<AiResponseRecord>): ApiSuccessEnvelope<ListResponse<AiResponseRecord>> {
  return createListResponse(list.items, list.page);
}

export function toAiAlertsExplainResponse(
  item: AiAlertsExplainResponse
): ApiSuccessEnvelope<AiAlertsExplainResponse> {
  return createItemResponse(item);
}

export function toAiPondsSummarizeResponse(
  item: AiPondsSummarizeResponse
): ApiSuccessEnvelope<AiPondsSummarizeResponse> {
  return createItemResponse(item);
}

export function toAiHandoverGenerateResponse(
  item: AiHandoverGenerateResponse
): ApiSuccessEnvelope<AiHandoverGenerateResponse> {
  return createItemResponse(item);
}

export function toAiTextRewriteResponse(item: AiTextRewriteResponse): ApiSuccessEnvelope<AiTextRewriteResponse> {
  return createItemResponse(item);
}

export function toAiDashboardQueryResponse(
  item: AiDashboardQueryResponse
): ApiSuccessEnvelope<AiDashboardQueryResponse> {
  return createItemResponse(item);
}

export function toAiIncidentsDraftResponse(
  item: AiIncidentsDraftResponse
): ApiSuccessEnvelope<AiIncidentsDraftResponse> {
  return createItemResponse(item);
}
