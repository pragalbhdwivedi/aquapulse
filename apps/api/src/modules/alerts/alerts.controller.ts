import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
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
  async create(@Body() input: CreateAlertsDto) {
    await this.alertsService.getPlaceholder();

    const result = await this.alertsApplicationService.create(toCreateAlertsInput(input));
    return toAlertsItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryAlertsDto) {
    const result = await this.alertsApplicationService.list(toQueryAlertsInput(query));
    return toAlertsListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateAlertsDto) {
    const result = await this.alertsApplicationService.update(id, toUpdateAlertsInput(input));
    return toAlertsItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.alertsApplicationService.getById(id);
    return toAlertsItemResponse(result.data);
  }
}
