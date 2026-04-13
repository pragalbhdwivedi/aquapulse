import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { CreateWaterQualityDto, QueryWaterQualityDto, UpdateWaterQualityDto } from "./dto";
import { WaterQualityApplicationService } from "./application/water-quality.application-service";
import {
  toCreateWaterQualityInput,
  toQueryWaterQualityInput,
  toUpdateWaterQualityInput,
  toWaterQualityItemResponse,
  toWaterQualityListResponse
} from "./mappers/water-quality.mapper";
import { WaterQualityService } from "./water-quality.service";

@Controller("water-quality")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class WaterQualityController {
  constructor(
    private readonly waterQualityService: WaterQualityService,
    private readonly waterQualityApplicationService: WaterQualityApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(@Body() input: CreateWaterQualityDto) {
    await this.waterQualityService.getPlaceholder();

    const result = await this.waterQualityApplicationService.create(toCreateWaterQualityInput(input));
    return toWaterQualityItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryWaterQualityDto) {
    const result = await this.waterQualityApplicationService.list(toQueryWaterQualityInput(query));
    return toWaterQualityListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateWaterQualityDto) {
    const result = await this.waterQualityApplicationService.update(id, toUpdateWaterQualityInput(input));
    return toWaterQualityItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.waterQualityApplicationService.getById(id);
    return toWaterQualityItemResponse(result.data);
  }
}
