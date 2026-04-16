import type { AlertQueuePresetId, AlertsListQueryRequest } from "@aquapulse/types";

export class CreateAlertSavedViewDto {
  name!: string;
  presetId?: AlertQueuePresetId;
  query!: Partial<AlertsListQueryRequest>;
}
