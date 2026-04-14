import type { ApiSuccessEnvelope, ListResponse, WaterQualityReading } from "@aquapulse/types";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "../dto";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateWaterQualityInput(input: CreateWaterQualityDto): CreateWaterQualityDto {
  return input;
}

export function toUpdateWaterQualityInput(input: UpdateWaterQualityDto): UpdateWaterQualityDto {
  return input;
}

export function toQueryWaterQualityInput(input: QueryWaterQualityDto): WaterQualityListQueryContract {
  return toRepositoryListQuery(input, {
    pondId: input.pondId,
    metric: input.metric
  });
}

export function toWaterQualityItemResponse(item: WaterQualityReading): ApiSuccessEnvelope<WaterQualityReading> {
  return createItemResponse(item);
}

export function toWaterQualityListResponse(
  list: ListResponse<WaterQualityReading>
): ApiSuccessEnvelope<ListResponse<WaterQualityReading>> {
  return createListResponse(list.items, list.page);
}
