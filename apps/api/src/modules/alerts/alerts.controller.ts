import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsService } from "./alerts.service";
import { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "./dto";
import { toAlertsItemResponse, toAlertsListResponse, toCreateAlertsInput, toQueryAlertsInput, toUpdateAlertsInput } from "./mappers/alerts.mapper";

@Controller("alerts")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly alertsApplicationService: AlertsApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(
    @Body() input: CreateAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.create>> {
    await this.alertsService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateAlertsInput,
      (mappedInput) => this.alertsApplicationService.create(mappedInput),
      toAlertsItemResponse
    );
  }

  @Get()
  async list(
    @Query() query: QueryAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.list>> {
    return delegateList(
      query,
      toQueryAlertsInput,
      (mappedQuery) => this.alertsApplicationService.list(mappedQuery),
      toAlertsListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateAlertsInput,
      (resourceId, mappedInput) => this.alertsApplicationService.update(resourceId, mappedInput),
      toAlertsItemResponse
    );
  }

  @Get(":id")
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.getById>> {
    return delegateGetById(
      id,
      (resourceId) => this.alertsApplicationService.getById(resourceId),
      toAlertsItemResponse
    );
  }
}
