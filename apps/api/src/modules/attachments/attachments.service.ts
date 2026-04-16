import { Injectable } from "@nestjs/common";

@Injectable()
export class AttachmentsService { async getPlaceholder() { return { ok: true, data: { module: "attachments", status: "placeholder" } }; } }
