import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { CreatePondsDto, QueryPondsDto, UpdatePondsDto } from "./dto";
import { PondsApplicationService } from "./application/ponds.application-service";
import { PondsService } from "./ponds.service";

@Controller("ponds")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class PondsController {
  constructor(
    private readonly pondsService: PondsService,
    private readonly pondsApplicationService: PondsApplicationService
  ) {}

  @Post()
  async create(@Body() input: CreatePondsDto) {
    await this.pondsService.getPlaceholder();
    return createItemResponse((await this.pondsApplicationService.create(input)).data);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdatePondsDto) {
    return createItemResponse((await this.pondsApplicationService.update(id, input)).data);
  }

  @Get()
  async list(@Query() query: QueryPondsDto) {
    const result = await this.pondsApplicationService.list(query);
    return createListResponse(result.data.items, result.data.page);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return createItemResponse((await this.pondsApplicationService.getById(id)).data);
  }
}
