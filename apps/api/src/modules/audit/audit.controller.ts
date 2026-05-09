import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditService } from "./audit.service";
import { CreateAuditDto, QueryAuditDto, UpdateAuditDto } from "./dto";
import { toAuditItemResponse, toAuditListResponse, toCreateAuditInput, toQueryAuditInput, toUpdateAuditInput } from "./mappers/audit.mapper";

@Controller("audit")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditApplicationService: AuditApplicationService
  ) {}

  // Collection handlers
  @Post()
  @RequireAuthentication()
  @RequireRoles("operator")
  async create(
    @Body() input: CreateAuditDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.audit.create>> {
    await this.auditService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateAuditInput,
      (mappedInput) => this.auditApplicationService.create(mappedInput),
      toAuditItemResponse
    );
  }

  @Get()
  @RequireAuthentication()
  @RequireRoles("operator")
  async list(
    @Query() query: QueryAuditDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.audit.list>> {
    return delegateList(
      query,
      toQueryAuditInput,
      (mappedQuery) => this.auditApplicationService.list(mappedQuery, resolveAuditReadRequesterScope(request?.user)),
      toAuditListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateAuditDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.audit.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateAuditInput,
      (resourceId, mappedInput) => this.auditApplicationService.update(resourceId, mappedInput),
      toAuditItemResponse
    );
  }

  @Get(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async getById(
    @Param("id") id: string,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.audit.getById>> {
    return delegateGetById(
      id,
      (resourceId) =>
        this.auditApplicationService.getById(resourceId, resolveAuditReadRequesterScope(request?.user)),
      toAuditItemResponse
    );
  }
}

function resolveAuditReadRequesterScope(
  user: AuthenticatedUserSession | null | undefined
): { readonly id: string; readonly provider: "keycloak" | "local" } | undefined {
  if (!user?.id || (user.provider !== "keycloak" && user.provider !== "local")) {
    return undefined;
  }

  return {
    id: user.id,
    provider: user.provider
  };
}
