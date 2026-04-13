import type { ApiSuccessEnvelope, ListResponse, WaterQualityReading } from "@aquapulse/types";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toWaterQualityItemResponse(item: WaterQualityReading): ApiSuccessEnvelope<WaterQualityReading> {
  return createItemResponse(item);
}

export function toWaterQualityListResponse(
  list: ListResponse<WaterQualityReading>
): ApiSuccessEnvelope<ListResponse<WaterQualityReading>> {
  return createListResponse(list.items, list.page);
}
