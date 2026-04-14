import type { AlertReviewState, AlertReviewStateActionRequest } from "@aquapulse/types";

export class SetAlertReviewStateDto implements AlertReviewStateActionRequest {
  reviewState!: AlertReviewState;
  reviewLabel?: string;
  note?: string;
}
