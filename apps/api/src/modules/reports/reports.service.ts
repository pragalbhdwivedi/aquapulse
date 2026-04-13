import { Injectable } from "@nestjs/common";

@Injectable()
export class ReportsService {
  getPlaceholder() {
    return {
      module: "reports",
      status: "placeholder",
      todo: [
        "Define report catalog and export formats.",
        "Add aggregation pipelines and scheduled generation.",
      ],
    };
  }
}
