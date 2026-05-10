import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { AuthenticatedUserSession, EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateAction, delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { AiApplicationService } from "./application/ai.application-service";
import { AiService } from "./ai.service";
import { AlertExplanationFeedbackDto, ApprovalNoteDraftDto, CreateAiDto, DashboardQueryDto, DraftIncidentDto, ExplainAlertDto, GenerateHandoverDto, QueryAiDto, RewriteTextDto, SummarizePondDto, UpdateAiDto } from "./dto";
import {
  toAlertExplanationFeedbackInput,
  toAlertExplanationFeedbackResponse,
  toAiApprovalNoteDraftResponse,
  toAiAlertsExplainResponse,
  toAiDashboardQueryResponse,
  toAiHandoverGenerateResponse,
  toAiIncidentsDraftResponse,
  toAiItemResponse,
  toAiListResponse,
  toAiPondsSummarizeResponse,
  toAiTextRewriteResponse,
  toCreateAiInput,
  toDashboardQueryInput,
  toDraftApprovalNoteInput,
  toDraftIncidentInput,
  toExplainAlertInput,
  toGenerateHandoverInput,
  toQueryAiInput,
  toRewriteTextInput,
  toSummarizePondInput,
  toUpdateAiInput
} from "./mappers/ai.mapper";

@Controller("ai")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiApplicationService: AiApplicationService
  ) {}

  // Collection handlers
  @Post()
  @RequireAuthentication()
  @RequireRoles("operator")
  async create(
    @Body() input: CreateAiDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.create>> {
    await this.aiService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateAiInput,
      (mappedInput) => this.aiApplicationService.create(mappedInput),
      toAiItemResponse
    );
  }

  @Get()
  @RequireAuthentication()
  @RequireRoles("operator")
  async list(
    @Query() query: QueryAiDto,
    @Req()
    request?: {
      user?: AuthenticatedUserSession | null;
    }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.list>> {
    return delegateList(
      query,
      toQueryAiInput,
      (mappedQuery) =>
        this.aiApplicationService.list(mappedQuery, resolveAiHistoryRequesterScope(request?.user)),
      toAiListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateAiDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateAiInput,
      (resourceId, mappedInput) => this.aiApplicationService.update(resourceId, mappedInput),
      toAiItemResponse
    );
  }

  @Get(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async getById(
    @Param("id") id: string,
    @Req()
    request?: {
      user?: AuthenticatedUserSession | null;
    }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.getById>> {
    return delegateGetById(
      id,
      (resourceId) =>
        this.aiApplicationService.getById(resourceId, resolveAiHistoryRequesterScope(request?.user)),
      toAiItemResponse
    );
  }

  // Specialized AI handlers
  @Post("alerts/explain")
  @RequireAuthentication()
  @RequireRoles("operator")
  async explainAlert(
    @Body() input: ExplainAlertDto,
    @Req()
    request?: {
      user?: AuthenticatedUserSession | null;
    }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.explainAlert>> {
    return delegateAction(
      input,
      toExplainAlertInput,
      (mappedInput) =>
        this.aiApplicationService.explainAlert(
          mappedInput,
          resolveAiHistoryRequesterScope(request?.user)
        ),
      toAiAlertsExplainResponse
    );
  }

  @Post("alerts/explain/feedback")
  @RequireAuthentication()
  @RequireRoles("operator")
  async submitAlertExplanationFeedback(
    @Body() input: AlertExplanationFeedbackDto,
    @Req()
    request?: {
      user?: AuthenticatedUserSession | null;
    }
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.alerts.submitExplanationFeedback>> {
    return delegateAction(
      input,
      toAlertExplanationFeedbackInput,
      (mappedInput) =>
        this.aiApplicationService.submitAlertExplanationFeedback(
          mappedInput,
          resolveAiHistoryRequesterScope(request?.user)
        ),
      toAlertExplanationFeedbackResponse
    );
  }

  @Post("ponds/summarize")
  @RequireAuthentication()
  @RequireRoles("operator")
  async summarizePond(
    @Body() input: SummarizePondDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.summarizePond>> {
    return delegateAction(
      input,
      toSummarizePondInput,
      (mappedInput) => this.aiApplicationService.summarizePond(mappedInput),
      toAiPondsSummarizeResponse
    );
  }

  @Post("handover/generate")
  @RequireAuthentication()
  @RequireRoles("operator")
  async generateHandover(
    @Body() input: GenerateHandoverDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.generateHandover>> {
    return delegateAction(
      input,
      toGenerateHandoverInput,
      (mappedInput) => this.aiApplicationService.generateHandover(mappedInput),
      toAiHandoverGenerateResponse
    );
  }

  @Post("text/rewrite")
  @RequireAuthentication()
  @RequireRoles("operator")
  async rewriteText(
    @Body() input: RewriteTextDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.rewriteText>> {
    return delegateAction(
      input,
      toRewriteTextInput,
      (mappedInput) => this.aiApplicationService.rewriteText(mappedInput),
      toAiTextRewriteResponse
    );
  }

  @Post("dashboard/query")
  @RequireAuthentication()
  @RequireRoles("operator")
  async queryDashboard(
    @Body() input: DashboardQueryDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.queryDashboard>> {
    return delegateAction(
      input,
      toDashboardQueryInput,
      (mappedInput) => this.aiApplicationService.queryDashboard(mappedInput),
      toAiDashboardQueryResponse
    );
  }

  @Post("incidents/draft")
  @RequireAuthentication()
  @RequireRoles("operator")
  async draftIncident(
    @Body() input: DraftIncidentDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.draftIncident>> {
    return delegateAction(
      input,
      toDraftIncidentInput,
      (mappedInput) => this.aiApplicationService.draftIncident(mappedInput),
      toAiIncidentsDraftResponse
    );
  }

  @Post("approvals/draft-note")
  @RequireAuthentication()
  @RequireRoles("operator")
  async draftApprovalNote(
    @Body() input: ApprovalNoteDraftDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ai.draftApprovalNote>> {
    return delegateAction(
      input,
      toDraftApprovalNoteInput,
      (mappedInput) => this.aiApplicationService.draftApprovalNote(mappedInput),
      toAiApprovalNoteDraftResponse
    );
  }
}

function resolveAiHistoryRequesterScope(
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
