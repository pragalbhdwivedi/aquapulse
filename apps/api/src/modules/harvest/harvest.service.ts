import { Injectable } from "@nestjs/common";

@Injectable()
export class HarvestService {
  getPlaceholder() {
    return {
      module: "harvest",
      status: "placeholder",
      todo: [
        "Define harvest planning and execution records.",
        "Add yield, quality, and settlement workflows.",
      ],
    };
  }
}
