import { Module } from "@nestjs/common";
import { createPersistenceAdapterProvider, resolveConfiguredPersistenceAdapter } from "../../common/persistence/persistence-adapter.types";
import { PostgresFeedRepository } from "./adapters/postgres-feed.repository";
import { FeedApplicationService } from "./application/feed.application-service";
import { FeedController } from "./feed.controller";
import { FEED_REPOSITORY } from "./ports/feed-repository.port";
import { InMemoryFeedRepository } from "./repositories/in-memory-feed.repository";
import { FeedService } from "./feed.service";

export const FEED_ADAPTER_REGISTRY = { inMemory: InMemoryFeedRepository, postgres: PostgresFeedRepository };
export const FEED_ACTIVE_REPOSITORY = resolveConfiguredPersistenceAdapter(FEED_ADAPTER_REGISTRY, {
  token: FEED_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const FEED_PERSISTENCE_PROVIDER = createPersistenceAdapterProvider(FEED_REPOSITORY, FEED_ACTIVE_REPOSITORY, {
  token: FEED_REPOSITORY,
  defaultAdapter: "in-memory",
  allowRuntimeSwitch: true
});
export const FEED_ADAPTERS = [FEED_ADAPTER_REGISTRY.inMemory, FEED_ADAPTER_REGISTRY.postgres];
const FEED_PROVIDERS = [FeedService, ...FEED_ADAPTERS, FEED_PERSISTENCE_PROVIDER, FeedApplicationService];
const FEED_EXPORTS = [FeedService, FeedApplicationService];

@Module({
  imports: [],
  controllers: [FeedController],
  providers: FEED_PROVIDERS,
  exports: FEED_EXPORTS
})
export class FeedModule {}
