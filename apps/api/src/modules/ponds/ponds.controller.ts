import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
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
  async create(@Body() input: CreatePondsDto) {
    await this.pondsService.getPlaceholder();

    const result = await this.pondsApplicationService.create(toCreatePondsInput(input));
    return toPondsItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryPondsDto) {
    const result = await this.pondsApplicationService.list(toQueryPondsInput(query));
    return toPondsListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdatePondsDto) {
    const result = await this.pondsApplicationService.update(id, toUpdatePondsInput(input));
    return toPondsItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.pondsApplicationService.getById(id);
    return toPondsItemResponse(result.data);
  }
}
