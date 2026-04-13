import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "./dto";
import { BatchesApplicationService } from "./application/batches.application-service";
import { toBatchesItemResponse, toBatchesListResponse, toCreateBatchesInput, toQueryBatchesInput, toUpdateBatchesInput } from "./mappers/batches.mapper";
import { BatchesService } from "./batches.service";

@Controller("batches")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly batchesApplicationService: BatchesApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(@Body() input: CreateBatchesDto) {
    await this.batchesService.getPlaceholder();

    const result = await this.batchesApplicationService.create(toCreateBatchesInput(input));
    return toBatchesItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryBatchesDto) {
    const result = await this.batchesApplicationService.list(toQueryBatchesInput(query));
    return toBatchesListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateBatchesDto) {
    const result = await this.batchesApplicationService.update(id, toUpdateBatchesInput(input));
    return toBatchesItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.batchesApplicationService.getById(id);
    return toBatchesItemResponse(result.data);
  }
}
