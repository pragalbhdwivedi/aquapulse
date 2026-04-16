import type { AlertBulkReviewStateActionRequest } from "@aquapulse/types";

export class BulkSetAlertReviewStateDto implements AlertBulkReviewStateActionRequest {
  alertIds!: string[];
  reviewState!: "unreviewed" | "under_review" | "reviewed" | "deferred";
  reviewLabel?: string;
  note?: string;
}
