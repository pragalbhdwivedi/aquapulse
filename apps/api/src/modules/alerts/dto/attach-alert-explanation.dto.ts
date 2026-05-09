import type { AlertExplanationAttachmentRequest } from "@aquapulse/types";

export class AttachAlertExplanationDto implements AlertExplanationAttachmentRequest {
  explanation!: AlertExplanationAttachmentRequest["explanation"];
  note?: string;
}
