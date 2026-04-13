import { Injectable } from "@nestjs/common";

@Injectable()
export class FeedService { async getPlaceholder() { return { ok: true, data: { module: "feed", status: "placeholder" } }; } }
