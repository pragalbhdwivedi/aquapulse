import type { FeedUpdateRequest } from "@aquapulse/types";

export class UpdateFeedDto implements FeedUpdateRequest {
  batchId?: string;
  feedType?: string;
  quantityKg?: number;
  fedAt?: string;
}
