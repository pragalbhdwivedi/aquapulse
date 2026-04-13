import { Controller, Get } from "@nestjs/common";
import { TreatmentsService } from "./treatments.service";

@Controller("treatments")
export class TreatmentsController {
  constructor(private readonly treatmentService: TreatmentsService) {}

  @Get()
  getPlaceholder() {
    return this.treatmentService.getPlaceholder();
  }
}
