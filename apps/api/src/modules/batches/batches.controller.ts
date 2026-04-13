import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "./dto";
import { BatchesApplicationService } from "./application/batches.application-service";
import { BatchesService } from "./batches.service";

@Controller("batches")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService, private readonly batchesApplicationService: BatchesApplicationService) {}
  @Post() async create(@Body() input: CreateBatchesDto) { await this.batchesService.getPlaceholder(); return createItemResponse((await this.batchesApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateBatchesDto) { return createItemResponse((await this.batchesApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryBatchesDto) { const result = await this.batchesApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.batchesApplicationService.getById(id)).data); }
}
