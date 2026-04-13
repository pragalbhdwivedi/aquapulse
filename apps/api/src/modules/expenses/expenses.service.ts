import { Injectable } from "@nestjs/common";

@Injectable()
export class ExpensesService {
  getPlaceholder() {
    return {
      module: "expenses",
      status: "placeholder",
      todo: [
        "Define cost categories and farm-level expense recording.",
        "Add approval and reporting hooks for spend visibility.",
      ],
    };
  }
}
