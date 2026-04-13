import { Injectable } from "@nestjs/common";

@Injectable()
export class ApprovalsService {
  getPlaceholder() {
    return {
      module: "approvals",
      status: "placeholder",
      todo: [
        "Define approval request lifecycle and decision model.",
        "Add workflow hooks for expenses, treatments, and tasks.",
      ],
    };
  }
}
