import { Controller, Get } from "@nestjs/common";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(private readonly saleService: SalesService) {}

  @Get()
  getPlaceholder() {
    return this.saleService.getPlaceholder();
  }
}
