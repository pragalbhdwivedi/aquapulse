import { Controller, Get } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Get()
  getPlaceholder() {
    return this.notificationService.getPlaceholder();
  }
}
