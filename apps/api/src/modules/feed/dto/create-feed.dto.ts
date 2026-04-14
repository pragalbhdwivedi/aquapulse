import type { FeedCreateRequest } from "@aquapulse/types";

export class CreateFeedDto implements FeedCreateRequest {
  pondId!: string;
  batchId?: string;
  feedType!: string;
  quantityKg!: number;
  fedAt!: string;
}
