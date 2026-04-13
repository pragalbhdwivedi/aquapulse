import { Injectable } from "@nestjs/common";

@Injectable()
export class IntegrationsService {
  getPlaceholder() {
    return {
      module: "integrations",
      status: "placeholder",
      todo: [
        "Define external provider contracts and sync boundaries.",
        "Add inbound and outbound integration orchestration.",
      ],
    };
  }
}
