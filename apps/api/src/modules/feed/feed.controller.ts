import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "./dto";
import { FeedApplicationService } from "./application/feed.application-service";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class FeedController {
  constructor(private readonly feedService: FeedService, private readonly feedApplicationService: FeedApplicationService) {}
  @Post() async create(@Body() input: CreateFeedDto) { await this.feedService.getPlaceholder(); return createItemResponse((await this.feedApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateFeedDto) { return createItemResponse((await this.feedApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryFeedDto) { const result = await this.feedApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.feedApplicationService.getById(id)).data); }
}
