import { Injectable } from "@nestjs/common";

@Injectable()
export class AiService {
  getPlaceholder() {
    return {
      module: "ai",
      status: "placeholder",
      todo: [
        "Define AI use cases, orchestration boundaries, and audit expectations.",
        "Add provider abstraction and async job handoff.",
      ],
    };
  }
}
