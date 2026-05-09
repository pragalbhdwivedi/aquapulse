import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "./dto";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import {
  toCreateWaterQualityInput,
  toQueryWaterQualityInput,
  toUpdateWaterQualityInput,
  toWaterQualityItemResponse,
  toWaterQualityListResponse
} from "./mappers/water-quality.mapper";
import { WaterQualityService } from "./water-quality.service";

@Controller("water-quality")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class WaterQualityController {
  constructor(
    private readonly waterQualityService: WaterQualityService,
    private readonly waterQualityApplicationService: WaterQualityApplicationService
  ) {}

  // Collection handlers
  @Post()
  @RequireAuthentication()
  @RequireRoles("operator")
  async create(
    @Body() input: CreateWaterQualityDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.create>> {
    await this.waterQualityService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateWaterQualityInput,
      (mappedInput) => this.waterQualityApplicationService.create(mappedInput),
      toWaterQualityItemResponse
    );
  }

  @Get()
  @RequireAuthentication()
  @RequireRoles("operator")
  async list(
    @Query() query: QueryWaterQualityDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.list>> {
    return delegateList(
      query,
      toQueryWaterQualityInput,
      (mappedQuery) =>
        this.waterQualityApplicationService.list(
          mappedQuery,
          resolveWaterQualityReadRequesterScope(request?.user)
        ),
      toWaterQualityListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateWaterQualityDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateWaterQualityInput,
      (resourceId, mappedInput) => this.waterQualityApplicationService.update(resourceId, mappedInput),
      toWaterQualityItemResponse
    );
  }

  @Get(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async getById(
    @Param("id") id: string,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.getById>> {
    return delegateGetById(
      id,
      (resourceId) =>
        this.waterQualityApplicationService.getById(
          resourceId,
          resolveWaterQualityReadRequesterScope(request?.user)
        ),
      toWaterQualityItemResponse
    );
  }
}

function resolveWaterQualityReadRequesterScope(
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
