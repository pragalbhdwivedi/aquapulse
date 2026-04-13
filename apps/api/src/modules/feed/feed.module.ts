import { Module } from "@nestjs/common";
import { FeedApplicationService } from "./application/feed.application-service";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

const FEED_PROVIDERS = [FeedService, FeedApplicationService];
const FEED_EXPORTS = [FeedService, FeedApplicationService];

@Module({
  imports: [],
  controllers: [FeedController],
  providers: FEED_PROVIDERS,
  exports: FEED_EXPORTS
})
export class FeedModule {}
