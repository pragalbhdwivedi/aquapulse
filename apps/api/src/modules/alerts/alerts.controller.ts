import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsService } from "./alerts.service";
import {
  AcknowledgeAlertDto,
  AssignAlertDto,
  AttachAlertExplanationDto,
  BulkAcknowledgeAlertsDto,
  BulkAssignAlertsDto,
  BulkResolveAlertsDto,
  BulkSetAlertReviewStateDto,
  CreateAlertSavedViewDto,
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
  toAlertSavedViewsResponse,
  toAlertsBulkActionResponse,
  toAlertsItemResponse,
  toAlertsListResponse,
  toAlertsSummaryResponse,
  toAttachAlertExplanationInput,
  toBulkAcknowledgeAlertsInput,
  toBulkAssignAlertsInput,
  toBulkResolveAlertsInput,
  toBulkSetAlertReviewStateInput,
  toCreateAlertSavedViewInput,
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
  @RequireAuthentication()
  @RequireRoles("operator")
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

  @Get("summary")
  @RequireAuthentication()
  @RequireRoles("operator")
  async summary(
    @Query() query: QueryAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.summary>> {
    return delegateList(
      query,
      toQueryAlertsInput,
      (mappedQuery) => this.alertsApplicationService.summary(mappedQuery),
      toAlertsSummaryResponse
    );
  }

  @Get("views")
  async listSavedViews(): Promise<
    EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.listSavedViews>
  > {
    return delegateList(
      {},
      () => undefined,
      () => this.alertsApplicationService.listSavedViews(),
      toAlertSavedViewsResponse
    );
  }

  @Post("views")
  @RequireAuthentication()
  @RequireRoles("operator")
  async saveSavedView(
    @Body() input: CreateAlertSavedViewDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.saveSavedView>> {
    return delegateCreate(
      input,
      toCreateAlertSavedViewInput,
      (mappedInput) => this.alertsApplicationService.saveSavedView(mappedInput),
      toAlertSavedViewsResponse
    );
  }

  @Post("views/:id/remove")
  @RequireAuthentication()
  @RequireRoles("operator")
  async removeSavedView(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.removeSavedView>> {
    return delegateGetById(
      id,
      (resourceId) => this.alertsApplicationService.removeSavedView(resourceId),
      toAlertSavedViewsResponse
    );
  }

  @Post(":id/attach-explanation")
  async attachExplanation(
    @Param("id") id: string,
    @Body() input: AttachAlertExplanationDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.attachExplanation>> {
    return delegateUpdate(
      id,
      input,
      toAttachAlertExplanationInput,
      (resourceId, mappedInput) => this.alertsApplicationService.attachExplanation(resourceId, mappedInput),
      toAlertsItemResponse
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

  @Post("bulk/acknowledge")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkAcknowledge(
    @Body() input: BulkAcknowledgeAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkAcknowledge>> {
    return delegateCreate(
      input,
      toBulkAcknowledgeAlertsInput,
      (mappedInput) => this.alertsApplicationService.bulkAcknowledge(mappedInput),
      toAlertsBulkActionResponse
    );
  }

  @Post("bulk/resolve")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkResolve(
    @Body() input: BulkResolveAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkResolve>> {
    return delegateCreate(
      input,
      toBulkResolveAlertsInput,
      (mappedInput) => this.alertsApplicationService.bulkResolve(mappedInput),
      toAlertsBulkActionResponse
    );
  }

  @Post("bulk/assign")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkAssign(
    @Body() input: BulkAssignAlertsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkAssign>> {
    return delegateCreate(
      input,
      toBulkAssignAlertsInput,
      (mappedInput) => this.alertsApplicationService.bulkAssign(mappedInput),
      toAlertsBulkActionResponse
    );
  }

  @Post("bulk/review-state")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkSetReviewState(
    @Body() input: BulkSetAlertReviewStateDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkSetReviewState>> {
    return delegateCreate(
      input,
      toBulkSetAlertReviewStateInput,
      (mappedInput) => this.alertsApplicationService.bulkSetReviewState(mappedInput),
      toAlertsBulkActionResponse
    );
  }

  @Post(":id/acknowledge")
  @RequireAuthentication()
  @RequireRoles("operator")
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
  @RequireAuthentication()
  @RequireRoles("operator")
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
  @RequireAuthentication()
  @RequireRoles("operator")
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
  @RequireAuthentication()
  @RequireRoles("operator")
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
  @RequireAuthentication()
  @RequireRoles("operator")
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
  @RequireAuthentication()
  @RequireRoles("operator")
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
