import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
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
  async create(
    @Body() input: CreateWaterQualityDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.create>> {
    await this.waterQualityService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateWaterQualityInput,
      (mappedInput) => this.waterQualityApplicationService.create(mappedInput),
      toWaterQualityItemResponse
    );
  }

  @Get()
  async list(
    @Query() query: QueryWaterQualityDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.list>> {
    return delegateList(
      query,
      toQueryWaterQualityInput,
      (mappedQuery) => this.waterQualityApplicationService.list(mappedQuery),
      toWaterQualityListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateWaterQualityDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateWaterQualityInput,
      (resourceId, mappedInput) => this.waterQualityApplicationService.update(resourceId, mappedInput),
      toWaterQualityItemResponse
    );
  }

  @Get(":id")
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.waterQuality.getById>> {
    return delegateGetById(
      id,
      (resourceId) => this.waterQualityApplicationService.getById(resourceId),
      toWaterQualityItemResponse
    );
  }
}
