import { Controller, Get } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";

@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly attachmentService: AttachmentsService) {}

  @Get()
  getPlaceholder() {
    return this.attachmentService.getPlaceholder();
  }
}
