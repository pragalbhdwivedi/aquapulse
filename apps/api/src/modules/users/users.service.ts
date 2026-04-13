import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  getPlaceholder() {
    return {
      module: "users",
      status: "placeholder",
      todo: [
        "Define user entity boundaries and lifecycle flows.",
        "Add CRUD endpoints, DTOs, and access control rules.",
      ],
    };
  }
}
