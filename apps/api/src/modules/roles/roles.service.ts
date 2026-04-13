import { Injectable } from "@nestjs/common";

@Injectable()
export class RolesService {
  getPlaceholder() {
    return {
      module: "roles",
      status: "placeholder",
      todo: [
        "Define role and permission models.",
        "Add RBAC policy evaluation and admin management endpoints.",
      ],
    };
  }
}
