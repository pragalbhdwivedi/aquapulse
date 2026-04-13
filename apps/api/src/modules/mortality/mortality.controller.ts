import { Controller, Get } from "@nestjs/common";
import { MortalityService } from "./mortality.service";

@Controller("mortality")
export class MortalityController {
  constructor(private readonly mortalityService: MortalityService) {}

  @Get()
  getPlaceholder() {
    return this.mortalityService.getPlaceholder();
  }
}
