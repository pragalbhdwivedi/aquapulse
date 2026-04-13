import { Controller, Get } from "@nestjs/common";
import { PondsService } from "./ponds.service";

@Controller("ponds")
export class PondsController {
  constructor(private readonly pondService: PondsService) {}

  @Get()
  getPlaceholder() {
    return this.pondService.getPlaceholder();
  }
}
