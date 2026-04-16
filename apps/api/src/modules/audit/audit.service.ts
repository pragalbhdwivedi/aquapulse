import { Injectable } from "@nestjs/common";

@Injectable()
export class AuditService { async getPlaceholder() { return { ok: true, data: { module: "audit", status: "placeholder" } }; } }
