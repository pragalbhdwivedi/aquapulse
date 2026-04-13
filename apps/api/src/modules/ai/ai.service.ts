import { Injectable } from "@nestjs/common";

@Injectable()
export class AiService { async getPlaceholder() { return { ok: true, data: { module: "ai", status: "placeholder" } }; } }
