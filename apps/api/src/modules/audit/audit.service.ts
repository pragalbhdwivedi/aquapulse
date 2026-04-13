import { Injectable } from "@nestjs/common";

@Injectable()
export class AuditService {
  getPlaceholder() {
    return {
      module: "audit",
      status: "placeholder",
      todo: [
        "Define auditable actions and event storage shape.",
        "Add timeline queries and actor attribution rules.",
      ],
    };
  }
}
