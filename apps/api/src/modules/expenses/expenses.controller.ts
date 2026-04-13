import { Controller, Get } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  getPlaceholder() {
    return this.expensesService.getPlaceholder();
  }
}
