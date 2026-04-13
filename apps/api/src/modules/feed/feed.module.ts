import { Module } from "@nestjs/common";
import { FeedApplicationService } from "./application/feed.application-service";
import { FeedController } from "./feed.controller";
import { FEED_REPOSITORY } from "./ports/feed-repository.port";
import { InMemoryFeedRepository } from "./repositories/in-memory-feed.repository";
import { FeedService } from "./feed.service";

const FEED_PERSISTENCE_PROVIDER = { provide: FEED_REPOSITORY, useClass: InMemoryFeedRepository };
const FEED_PROVIDERS = [FeedService, FEED_PERSISTENCE_PROVIDER, FeedApplicationService];
const FEED_EXPORTS = [FeedService, FeedApplicationService];

@Module({
  imports: [],
  controllers: [FeedController],
  providers: FEED_PROVIDERS,
  exports: FEED_EXPORTS
})
export class FeedModule {}
