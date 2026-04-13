import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { AiApplicationService } from "./application/ai.application-service";
import { AiService } from "./ai.service";
import { CreateAiDto, DashboardQueryDto, DraftIncidentDto, ExplainAlertDto, GenerateHandoverDto, QueryAiDto, RewriteTextDto, SummarizePondDto, UpdateAiDto } from "./dto";
import {
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
  async create(@Body() input: CreateAiDto) {
    await this.aiService.getPlaceholder();

    const result = await this.aiApplicationService.create(toCreateAiInput(input));
    return toAiItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryAiDto) {
    const result = await this.aiApplicationService.list(toQueryAiInput(query));
    return toAiListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateAiDto) {
    const result = await this.aiApplicationService.update(id, toUpdateAiInput(input));
    return toAiItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.aiApplicationService.getById(id);
    return toAiItemResponse(result.data);
  }

  // Specialized AI handlers
  @Post("alerts/explain")
  async explainAlert(@Body() input: ExplainAlertDto) {
    const result = await this.aiApplicationService.explainAlert(toExplainAlertInput(input));
    return toAiAlertsExplainResponse(result.data);
  }

  @Post("ponds/summarize")
  async summarizePond(@Body() input: SummarizePondDto) {
    const result = await this.aiApplicationService.summarizePond(toSummarizePondInput(input));
    return toAiPondsSummarizeResponse(result.data);
  }

  @Post("handover/generate")
  async generateHandover(@Body() input: GenerateHandoverDto) {
    const result = await this.aiApplicationService.generateHandover(toGenerateHandoverInput(input));
    return toAiHandoverGenerateResponse(result.data);
  }

  @Post("text/rewrite")
  async rewriteText(@Body() input: RewriteTextDto) {
    const result = await this.aiApplicationService.rewriteText(toRewriteTextInput(input));
    return toAiTextRewriteResponse(result.data);
  }

  @Post("dashboard/query")
  async queryDashboard(@Body() input: DashboardQueryDto) {
    const result = await this.aiApplicationService.queryDashboard(toDashboardQueryInput(input));
    return toAiDashboardQueryResponse(result.data);
  }

  @Post("incidents/draft")
  async draftIncident(@Body() input: DraftIncidentDto) {
    const result = await this.aiApplicationService.draftIncident(toDraftIncidentInput(input));
    return toAiIncidentsDraftResponse(result.data);
  }
}
