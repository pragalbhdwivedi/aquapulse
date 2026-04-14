import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { CreatePondsDto, QueryPondsDto, UpdatePondsDto } from "./dto";
import { PondsApplicationService } from "./application/ponds.application-service";
import { toCreatePondsInput, toPondsItemResponse, toPondsListResponse, toQueryPondsInput, toUpdatePondsInput } from "./mappers/ponds.mapper";
import { PondsService } from "./ponds.service";

@Controller("ponds")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class PondsController {
  constructor(
    private readonly pondsService: PondsService,
    private readonly pondsApplicationService: PondsApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(
    @Body() input: CreatePondsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.create>> {
    await this.pondsService.getPlaceholder();
    return delegateCreate(
      input,
      toCreatePondsInput,
      (mappedInput) => this.pondsApplicationService.create(mappedInput),
      toPondsItemResponse
    );
  }

  @Get()
  async list(
    @Query() query: QueryPondsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.list>> {
    return delegateList(
      query,
      toQueryPondsInput,
      (mappedQuery) => this.pondsApplicationService.list(mappedQuery),
      toPondsListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() input: UpdatePondsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdatePondsInput,
      (resourceId, mappedInput) => this.pondsApplicationService.update(resourceId, mappedInput),
      toPondsItemResponse
    );
  }

  @Get(":id")
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.ponds.getById>> {
    return delegateGetById(id, (resourceId) => this.pondsApplicationService.getById(resourceId), toPondsItemResponse);
  }
}
