import { Controller, Get } from "@nestjs/common";
import { BatchesService } from "./batches.service";

@Controller("batches")
export class BatchesController {
  constructor(private readonly batcheService: BatchesService) {}

  @Get()
  getPlaceholder() {
    return this.batcheService.getPlaceholder();
  }
}
