import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
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
  @RequireAuthentication()
  @RequireRoles("operator")
  async create(
    @Body() input: CreateFeedDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.feed.create>> {
    await this.feedService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateFeedInput,
      (mappedInput) =>
        this.feedApplicationService.create(mappedInput, resolveFeedReadRequesterScope(request?.user)),
      toFeedItemResponse
    );
  }

  @Get()
  @RequireAuthentication()
  @RequireRoles("operator")
  async list(
    @Query() query: QueryFeedDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.feed.list>> {
    return delegateList(
      query,
      toQueryFeedInput,
      (mappedQuery) =>
        this.feedApplicationService.list(mappedQuery, resolveFeedReadRequesterScope(request?.user)),
      toFeedListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateFeedDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.feed.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateFeedInput,
      (resourceId, mappedInput) =>
        this.feedApplicationService.update(
          resourceId,
          mappedInput,
          resolveFeedReadRequesterScope(request?.user)
        ),
      toFeedItemResponse
    );
  }

  @Get(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async getById(
    @Param("id") id: string,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.feed.getById>> {
    return delegateGetById(
      id,
      (resourceId) => this.feedApplicationService.getById(resourceId, resolveFeedReadRequesterScope(request?.user)),
      toFeedItemResponse
    );
  }
}

function resolveFeedReadRequesterScope(
  user: AuthenticatedUserSession | null | undefined
): { readonly id: string; readonly provider: "keycloak" | "local"; readonly roles: readonly string[] } | undefined {
  if (!user?.id || (user.provider !== "keycloak" && user.provider !== "local")) {
    return undefined;
  }

  return {
    id: user.id,
    provider: user.provider,
    roles: user.roles
  };
}
