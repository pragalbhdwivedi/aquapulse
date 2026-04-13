import { Injectable } from "@nestjs/common";

@Injectable()
export class PondsService {
  async getPlaceholder() {
    return { ok: true, data: { module: "ponds", status: "placeholder" } };
  }
}
