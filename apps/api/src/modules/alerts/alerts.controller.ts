import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsService } from "./alerts.service";
import { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "./dto";

@Controller("alerts")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService, private readonly alertsApplicationService: AlertsApplicationService) {}
  @Post() async create(@Body() input: CreateAlertsDto) { await this.alertsService.getPlaceholder(); return createItemResponse((await this.alertsApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateAlertsDto) { return createItemResponse((await this.alertsApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryAlertsDto) { const result = await this.alertsApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.alertsApplicationService.getById(id)).data); }
}
