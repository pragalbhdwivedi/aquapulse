import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "./dto";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import { WaterQualityService } from "./water-quality.service";

@Controller("water-quality")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class WaterQualityController {
  constructor(private readonly waterQualityService: WaterQualityService, private readonly waterQualityApplicationService: WaterQualityApplicationService) {}
  @Post() async create(@Body() input: CreateWaterQualityDto) { await this.waterQualityService.getPlaceholder(); return createItemResponse((await this.waterQualityApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateWaterQualityDto) { return createItemResponse((await this.waterQualityApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryWaterQualityDto) { const result = await this.waterQualityApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.waterQualityApplicationService.getById(id)).data); }
}
