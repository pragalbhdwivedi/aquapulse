import { Injectable } from "@nestjs/common";

@Injectable()
export class PondsService {
  getPlaceholder() {
    return {
      module: "ponds",
      status: "placeholder",
      todo: [
        "Model pond and unit hierarchy metadata.",
        "Add mapping, status, and assignment workflows.",
      ],
    };
  }
}
