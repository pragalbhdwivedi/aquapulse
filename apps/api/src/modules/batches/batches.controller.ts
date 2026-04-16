import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
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
  async create(
    @Body() input: CreateBatchesDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.batches.create>> {
    await this.batchesService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateBatchesInput,
      (mappedInput) => this.batchesApplicationService.create(mappedInput),
      toBatchesItemResponse
    );
  }

  @Get()
  async list(
    @Query() query: QueryBatchesDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.batches.list>> {
    return delegateList(
      query,
      toQueryBatchesInput,
      (mappedQuery) => this.batchesApplicationService.list(mappedQuery),
      toBatchesListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateBatchesDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.batches.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateBatchesInput,
      (resourceId, mappedInput) => this.batchesApplicationService.update(resourceId, mappedInput),
      toBatchesItemResponse
    );
  }

  @Get(":id")
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.batches.getById>> {
    return delegateGetById(
      id,
      (resourceId) => this.batchesApplicationService.getById(resourceId),
      toBatchesItemResponse
    );
  }
}
