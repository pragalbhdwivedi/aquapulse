import { Injectable } from "@nestjs/common";

@Injectable()
export class AlertsService { async getPlaceholder() { return { ok: true, data: { module: "alerts", status: "placeholder" } }; } }
