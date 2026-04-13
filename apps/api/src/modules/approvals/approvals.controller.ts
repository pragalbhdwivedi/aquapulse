import { Controller, Get } from "@nestjs/common";
import { ApprovalsService } from "./approvals.service";

@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvalService: ApprovalsService) {}

  @Get()
  getPlaceholder() {
    return this.approvalService.getPlaceholder();
  }
}
