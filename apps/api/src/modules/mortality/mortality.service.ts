import { Injectable } from "@nestjs/common";

@Injectable()
export class MortalityService {
  getPlaceholder() {
    return {
      module: "mortality",
      status: "placeholder",
      todo: [
        "Define event logging, suspected cause, and severity structures.",
        "Add links to batches, ponds, and treatment follow-up.",
      ],
    };
  }
}
