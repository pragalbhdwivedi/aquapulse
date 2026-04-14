import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsService } from "./alerts.service";
import {
  AcknowledgeAlertDto,
  AssignAlertDto,
  CreateAlertsDto,
  QueryAlertsDto,
  ResolveAlertDto,
  SetAlertReviewStateDto,
  UnassignAlertDto,
  UpdateAlertsDto
} from "./dto";
import {
  toAcknowledgeAlertInput,
  toAssignAlertInput,
  toAlertsItemResponse,
  toAlertsListResponse,
  toCreateAlertsInput,
  toQueryAlertsInput,
  toResolveAlertInput,
  toSetAlertReviewStateInput,
  toUnassignAlertInput,
  toUpdateAlertsInput
} from "./mappers/alerts.mapper";

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

  @Post(":id/acknowledge")
  async acknowledge(
    @Param("id") id: string,
    @Body() input: AcknowledgeAlertDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.acknowledge>> {
    return delegateUpdate(
      id,
      input,
      toAcknowledgeAlertInput,
      (resourceId, mappedInput) => this.alertsApplicationService.acknowledge(resourceId, mappedInput),
      toAlertsItemResponse
    );
  }

  @Post(":id/resolve")
  async resolve(
    @Param("id") id: string,
    @Body() input: ResolveAlertDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.resolve>> {
    return delegateUpdate(
      id,
      input,
      toResolveAlertInput,
      (resourceId, mappedInput) => this.alertsApplicationService.resolve(resourceId, mappedInput),
      toAlertsItemResponse
    );
  }

  @Post(":id/assign")
  async assign(
    @Param("id") id: string,
    @Body() input: AssignAlertDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.assign>> {
    return delegateUpdate(
      id,
      input,
      toAssignAlertInput,
      (resourceId, mappedInput) => this.alertsApplicationService.assign(resourceId, mappedInput),
      toAlertsItemResponse
    );
  }

  @Post(":id/unassign")
  async unassign(
    @Param("id") id: string,
    @Body() input: UnassignAlertDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.unassign>> {
    return delegateUpdate(
      id,
      input,
      toUnassignAlertInput,
      (resourceId, mappedInput) => this.alertsApplicationService.unassign(resourceId, mappedInput),
      toAlertsItemResponse
    );
  }

  @Post(":id/review-state")
  async setReviewState(
    @Param("id") id: string,
    @Body() input: SetAlertReviewStateDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.setReviewState>> {
    return delegateUpdate(
      id,
      input,
      toSetAlertReviewStateInput,
      (resourceId, mappedInput) => this.alertsApplicationService.setReviewState(resourceId, mappedInput),
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
