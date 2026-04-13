import { Injectable } from "@nestjs/common";

@Injectable()
export class MapsService {
  getPlaceholder() {
    return {
      module: "maps",
      status: "placeholder",
      todo: [
        "Define spatial data model for pond layouts and boundaries.",
        "Add geo query and layer integration contracts.",
      ],
    };
  }
}
