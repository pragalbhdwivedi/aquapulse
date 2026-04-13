import { Injectable } from "@nestjs/common";

@Injectable()
export class WaterQualityService {
  async getPlaceholder() { return { ok: true, data: { module: "water-quality", status: "placeholder" } }; }
}
