import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { CreateFeedDto, QueryFeedDto, UpdateFeedDto } from "./dto";
import { FeedApplicationService } from "./application/feed.application-service";
import { toCreateFeedInput, toFeedItemResponse, toFeedListResponse, toQueryFeedInput, toUpdateFeedInput } from "./mappers/feed.mapper";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly feedApplicationService: FeedApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(@Body() input: CreateFeedDto) {
    await this.feedService.getPlaceholder();

    const result = await this.feedApplicationService.create(toCreateFeedInput(input));
    return toFeedItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryFeedDto) {
    const result = await this.feedApplicationService.list(toQueryFeedInput(query));
    return toFeedListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateFeedDto) {
    const result = await this.feedApplicationService.update(id, toUpdateFeedInput(input));
    return toFeedItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.feedApplicationService.getById(id);
    return toFeedItemResponse(result.data);
  }
}
