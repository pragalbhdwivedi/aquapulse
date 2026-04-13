import { Injectable } from "@nestjs/common";

@Injectable()
export class WaterQualityService {
  getPlaceholder() {
    return {
      module: "water-quality",
      status: "placeholder",
      todo: [
        "Define parameter catalog and reading ingestion flow.",
        "Add threshold evaluation and anomaly detection hooks.",
      ],
    };
  }
}
