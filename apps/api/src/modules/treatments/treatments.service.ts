import { Injectable } from "@nestjs/common";

@Injectable()
export class TreatmentsService {
  getPlaceholder() {
    return {
      module: "treatments",
      status: "placeholder",
      todo: [
        "Define treatment protocols, dosage records, and schedules.",
        "Add links to mortality, health events, and approvals.",
      ],
    };
  }
}
