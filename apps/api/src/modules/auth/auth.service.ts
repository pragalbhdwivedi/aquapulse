import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  getPlaceholder() {
    return {
      module: "auth",
      status: "placeholder",
      todo: [
        "Define authentication flows and session strategy.",
        "Add guards, DTOs, and provider integrations.",
      ],
    };
  }
}
