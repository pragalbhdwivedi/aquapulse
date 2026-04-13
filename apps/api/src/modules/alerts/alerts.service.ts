import { Injectable } from "@nestjs/common";

@Injectable()
export class AlertsService {
  getPlaceholder() {
    return {
      module: "alerts",
      status: "placeholder",
      todo: [
        "Define alert sources, thresholds, and severities.",
        "Add routing, acknowledgement, and escalation workflows.",
      ],
    };
  }
}
