import { Module } from "@nestjs/common";
import { FeedApplicationService } from "./application/feed.application-service";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

@Module({ controllers: [FeedController], providers: [FeedService, FeedApplicationService], exports: [FeedService, FeedApplicationService] })
export class FeedModule {}
