import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { CreatePondsDto, QueryPondsDto, UpdatePondsDto } from "./dto";
import { PondsApplicationService } from "./application/ponds.application-service";
import { toCreatePondsInput, toPondsItemResponse, toPondsListResponse, toQueryPondsInput, toUpdatePondsInput } from "./mappers/ponds.mapper";
import { PondsService } from "./ponds.service";

@Controller("ponds")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class PondsController {
  constructor(
    private readonly pondsService: PondsService,
    private readonly pondsApplicationService: PondsApplicationService
  ) {}

  // Collection handlers
  @Post()
  @RequireAuthentication()
  @RequireRoles("operator")
  async create(
    @Body() input: CreatePondsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.create>> {
    await this.pondsService.getPlaceholder();
    return delegateCreate(
      input,
      toCreatePondsInput,
      (mappedInput) => this.pondsApplicationService.create(mappedInput),
      toPondsItemResponse
    );
  }

  @Get()
  @RequireAuthentication()
  @RequireRoles("operator")
  async list(
    @Query() query: QueryPondsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.list>> {
    return delegateList(
      query,
      toQueryPondsInput,
      (mappedQuery) => this.pondsApplicationService.list(mappedQuery, resolvePondReadRequesterScope(request?.user)),
      toPondsListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdatePondsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdatePondsInput,
      (resourceId, mappedInput) => this.pondsApplicationService.update(resourceId, mappedInput),
      toPondsItemResponse
    );
  }

  @Get(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async getById(
    @Param("id") id: string,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.getById>> {
    return delegateGetById(
      id,
      (resourceId) => this.pondsApplicationService.getById(resourceId, resolvePondReadRequesterScope(request?.user)),
      toPondsItemResponse
    );
  }
}

function resolvePondReadRequesterScope(
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
