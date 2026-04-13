import { Injectable } from "@nestjs/common";

@Injectable()
export class BatchesService {
  async getPlaceholder() { return { ok: true, data: { module: "batches", status: "placeholder" } }; }
}
