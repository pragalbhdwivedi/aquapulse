import { Injectable } from "@nestjs/common";

@Injectable()
export class SalesService {
  getPlaceholder() {
    return {
      module: "sales",
      status: "placeholder",
      todo: [
        "Define sales orders, buyers, and fulfillment records.",
        "Add pricing, invoicing, and payment integrations.",
      ],
    };
  }
}
