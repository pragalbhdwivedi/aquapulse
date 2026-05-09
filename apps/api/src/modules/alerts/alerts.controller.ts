import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { AlertsLiveUpdatesBootstrapPayload, AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { createSuccessResponse } from "../../common/api/response-mapper";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsLiveUpdatesService } from "./live-updates/alerts-live-updates.service";
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
    private readonly alertsApplicationService: AlertsApplicationService,
    private readonly alertsLiveUpdatesService: AlertsLiveUpdatesService
  ) {}

  // Collection handlers
  @Post()
  @RequireAuthentication()
  @RequireRoles("operator")
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
    @Query() query: QueryAlertsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.list>> {
    return delegateList(
      query,
      toQueryAlertsInput,
      (mappedQuery) =>
        this.alertsApplicationService.list(
          mappedQuery,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsListResponse
    );
  }

  @Get("summary")
  @RequireAuthentication()
  @RequireRoles("operator")
  async summary(
    @Query() query: QueryAlertsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.summary>> {
    return delegateList(
      query,
      toQueryAlertsInput,
      (mappedQuery) =>
        this.alertsApplicationService.summary(
          mappedQuery,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsSummaryResponse
    );
  }

  @Get("views")
  @RequireAuthentication()
  @RequireRoles("operator")
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
  @RequireAuthentication()
  @RequireRoles("operator")
  async attachExplanation(
    @Param("id") id: string,
    @Body() input: AttachAlertExplanationDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.attachExplanation>> {
    return delegateUpdate(
      id,
      input,
      toAttachAlertExplanationInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.attachExplanation(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Get("live-updates/session")
  async issueLiveUpdatesSession(
    @Req()
    request: {
      readonly headers?: Record<string, string | string[] | undefined>;
      readonly url?: string;
      user?: AuthenticatedUserSession | null;
    }
  ) {
    const payload = await this.alertsLiveUpdatesService.issueSubscriptionBootstrap(request);
    return createSuccessResponse<AlertsLiveUpdatesBootstrapPayload>(payload);
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateAlertsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateAlertsInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.update(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Post("bulk/acknowledge")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkAcknowledge(
    @Body() input: BulkAcknowledgeAlertsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkAcknowledge>> {
    return delegateCreate(
      input,
      toBulkAcknowledgeAlertsInput,
      (mappedInput) =>
        this.alertsApplicationService.bulkAcknowledge(
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsBulkActionResponse
    );
  }

  @Post("bulk/resolve")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkResolve(
    @Body() input: BulkResolveAlertsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkResolve>> {
    return delegateCreate(
      input,
      toBulkResolveAlertsInput,
      (mappedInput) =>
        this.alertsApplicationService.bulkResolve(
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsBulkActionResponse
    );
  }

  @Post("bulk/assign")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkAssign(
    @Body() input: BulkAssignAlertsDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkAssign>> {
    return delegateCreate(
      input,
      toBulkAssignAlertsInput,
      (mappedInput) =>
        this.alertsApplicationService.bulkAssign(
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsBulkActionResponse
    );
  }

  @Post("bulk/review-state")
  @RequireAuthentication()
  @RequireRoles("operator")
  async bulkSetReviewState(
    @Body() input: BulkSetAlertReviewStateDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.bulkSetReviewState>> {
    return delegateCreate(
      input,
      toBulkSetAlertReviewStateInput,
      (mappedInput) =>
        this.alertsApplicationService.bulkSetReviewState(
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsBulkActionResponse
    );
  }

  @Post(":id/acknowledge")
  @RequireAuthentication()
  @RequireRoles("operator")
  async acknowledge(
    @Param("id") id: string,
    @Body() input: AcknowledgeAlertDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.acknowledge>> {
    return delegateUpdate(
      id,
      input,
      toAcknowledgeAlertInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.acknowledge(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Post(":id/resolve")
  @RequireAuthentication()
  @RequireRoles("operator")
  async resolve(
    @Param("id") id: string,
    @Body() input: ResolveAlertDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.resolve>> {
    return delegateUpdate(
      id,
      input,
      toResolveAlertInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.resolve(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Post(":id/assign")
  @RequireAuthentication()
  @RequireRoles("operator")
  async assign(
    @Param("id") id: string,
    @Body() input: AssignAlertDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.assign>> {
    return delegateUpdate(
      id,
      input,
      toAssignAlertInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.assign(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Post(":id/unassign")
  @RequireAuthentication()
  @RequireRoles("operator")
  async unassign(
    @Param("id") id: string,
    @Body() input: UnassignAlertDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.unassign>> {
    return delegateUpdate(
      id,
      input,
      toUnassignAlertInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.unassign(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Post(":id/review-state")
  @RequireAuthentication()
  @RequireRoles("operator")
  async setReviewState(
    @Param("id") id: string,
    @Body() input: SetAlertReviewStateDto,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.setReviewState>> {
    return delegateUpdate(
      id,
      input,
      toSetAlertReviewStateInput,
      (resourceId, mappedInput) =>
        this.alertsApplicationService.setReviewState(
          resourceId,
          mappedInput,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }

  @Get(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async getById(
    @Param("id") id: string,
    @Req() request?: { user?: AuthenticatedUserSession | null }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.getById>> {
    return delegateGetById(
      id,
      (resourceId) =>
        this.alertsApplicationService.getById(
          resourceId,
          resolveAlertAssignmentRequesterScope(request?.user)
        ),
      toAlertsItemResponse
    );
  }
}

function resolveAlertAssignmentRequesterScope(
  user: AuthenticatedUserSession | null | undefined
): { readonly id: string; readonly provider: "keycloak" | "local" } | undefined {
  if (!user || (user.provider !== "keycloak" && user.provider !== "local")) {
    return undefined;
  }

  return {
    id: user.id,
    provider: user.provider
  };
}
