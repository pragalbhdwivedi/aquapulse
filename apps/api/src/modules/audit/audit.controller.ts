import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
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
  async list(
    @Query() query: QueryAuditDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.audit.list>> {
    return delegateList(
      query,
      toQueryAuditInput,
      (mappedQuery) => this.auditApplicationService.list(mappedQuery),
      toAuditListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
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
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.audit.getById>> {
    return delegateGetById(id, (resourceId) => this.auditApplicationService.getById(resourceId), toAuditItemResponse);
  }
}
