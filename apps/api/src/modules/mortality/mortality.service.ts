import { Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope } from "@aquapulse/types";

@Injectable()
export class MortalityService {
  getPlaceholder(): ApiSuccessEnvelope<{ module: string; status: string; todo: string[] }> {
    return {
      ok: true,
      data: {
        module: "mortality",
        status: "placeholder",
        todo: ["TODO: add DTOs, handlers, and real business rules."],
      },
    };
  }
}
