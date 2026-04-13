import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  getPlaceholder() {
    return {
      module: "notifications",
      status: "placeholder",
      todo: [
        "Define channels, templates, and delivery preferences.",
        "Add queue integration and retry strategy.",
      ],
    };
  }
}
