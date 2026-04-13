import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { AiApplicationService } from "./application/ai.application-service";
import { AiService } from "./ai.service";
import { CreateAiDto, DashboardQueryDto, DraftIncidentDto, ExplainAlertDto, GenerateHandoverDto, QueryAiDto, RewriteTextDto, SummarizePondDto, UpdateAiDto } from "./dto";

@Controller("ai")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AiController {
  constructor(private readonly aiService: AiService, private readonly aiApplicationService: AiApplicationService) {}
  @Post() async create(@Body() input: CreateAiDto) { await this.aiService.getPlaceholder(); return createItemResponse((await this.aiApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateAiDto) { return createItemResponse((await this.aiApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryAiDto) { const result = await this.aiApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.aiApplicationService.getById(id)).data); }
  @Post("alerts/explain") async explainAlert(@Body() input: ExplainAlertDto) { return createItemResponse((await this.aiApplicationService.explainAlert(input)).data); }
  @Post("ponds/summarize") async summarizePond(@Body() input: SummarizePondDto) { return createItemResponse((await this.aiApplicationService.summarizePond(input)).data); }
  @Post("handover/generate") async generateHandover(@Body() input: GenerateHandoverDto) { return createItemResponse((await this.aiApplicationService.generateHandover(input)).data); }
  @Post("text/rewrite") async rewriteText(@Body() input: RewriteTextDto) { return createItemResponse((await this.aiApplicationService.rewriteText(input)).data); }
  @Post("dashboard/query") async queryDashboard(@Body() input: DashboardQueryDto) { return createItemResponse((await this.aiApplicationService.queryDashboard(input)).data); }
  @Post("incidents/draft") async draftIncident(@Body() input: DraftIncidentDto) { return createItemResponse((await this.aiApplicationService.draftIncident(input)).data); }
}
