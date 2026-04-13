import { Controller, Get } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";

@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  getPlaceholder() {
    return this.attachmentsService.getPlaceholder();
  }
}
