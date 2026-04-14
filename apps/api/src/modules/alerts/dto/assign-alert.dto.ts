import type { AlertAssignActionRequest } from "@aquapulse/types";

export class AssignAlertDto implements AlertAssignActionRequest {
  assignedTo!: string;
  note?: string;
}
