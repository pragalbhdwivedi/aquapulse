import { Controller, Get } from "@nestjs/common";
import { PondsService } from "./ponds.service";

@Controller("ponds")
export class PondsController {
  constructor(private readonly pondsService: PondsService) {}

  @Get()
  getPlaceholder() {
    return this.pondsService.getPlaceholder();
  }
}
