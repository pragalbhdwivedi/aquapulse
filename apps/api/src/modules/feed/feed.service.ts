import { Injectable } from "@nestjs/common";

@Injectable()
export class FeedService {
  getPlaceholder() {
    return {
      module: "feed",
      status: "placeholder",
      todo: [
        "Define feed plans, schedules, and actual consumption tracking.",
        "Add feed conversion metrics and usage reporting hooks.",
      ],
    };
  }
}
