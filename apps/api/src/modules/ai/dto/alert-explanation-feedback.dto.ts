import type {
  AlertExplanationFeedbackRecord,
  AlertExplanationFeedbackRequest
} from "@aquapulse/types";

export class AlertExplanationFeedbackDto implements AlertExplanationFeedbackRequest {
  alertId!: string;
  value!: AlertExplanationFeedbackRequest["value"];
  note?: string;
  explanation!: AlertExplanationFeedbackRequest["explanation"];
}

export class AlertExplanationFeedbackResponseDto implements AlertExplanationFeedbackRecord {
  alertId!: string;
  value!: AlertExplanationFeedbackRecord["value"];
  note?: string;
  submittedAt!: string;
  generation!: AlertExplanationFeedbackRecord["generation"];
  sourceMode!: AlertExplanationFeedbackRecord["sourceMode"];
}
