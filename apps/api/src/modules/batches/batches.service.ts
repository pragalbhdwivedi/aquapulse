import { Injectable } from "@nestjs/common";

@Injectable()
export class BatchesService {
  getPlaceholder() {
    return {
      module: "batches",
      status: "placeholder",
      todo: [
        "Define stocking, transfer, and traceability workflows.",
        "Add lifecycle status transitions and validation.",
      ],
    };
  }
}
