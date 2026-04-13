import { Injectable } from "@nestjs/common";

@Injectable()
export class InventoryService {
  getPlaceholder() {
    return {
      module: "inventory",
      status: "placeholder",
      todo: [
        "Define SKU, stock movement, and warehouse abstractions.",
        "Add reorder thresholds and transaction auditing.",
      ],
    };
  }
}
