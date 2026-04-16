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
import type {
  CreateAiDto,
  DashboardQueryDto,
  DraftIncidentDto,
  ExplainAlertDto,
  GenerateHandoverDto,
  QueryAiDto,
  RewriteTextDto,
  SummarizePondDto,
  UpdateAiDto
} from "../dto";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type { AiResponseLogQueryContract } from "../query-contracts/ai-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateAiInput(input: CreateAiDto): CreateAiDto {
  return input;
}

export function toUpdateAiInput(input: UpdateAiDto): UpdateAiDto {
  return input;
}

export function toQueryAiInput(input: QueryAiDto): AiResponseLogQueryContract {
  return toRepositoryListQuery(input, {
    requestId: input.requestId,
    status: input.status,
    model: input.model
  });
}

export function toExplainAlertInput(input: ExplainAlertDto): ExplainAlertDto {
  return input;
}

export function toSummarizePondInput(input: SummarizePondDto): SummarizePondDto {
  return input;
}

export function toGenerateHandoverInput(input: GenerateHandoverDto): GenerateHandoverDto {
  return input;
}

export function toRewriteTextInput(input: RewriteTextDto): RewriteTextDto {
  return input;
}

export function toDashboardQueryInput(input: DashboardQueryDto): DashboardQueryDto {
  return input;
}

export function toDraftIncidentInput(input: DraftIncidentDto): DraftIncidentDto {
  return input;
}

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
