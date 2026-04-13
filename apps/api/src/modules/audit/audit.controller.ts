import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditService } from "./audit.service";
import { CreateAuditDto, QueryAuditDto, UpdateAuditDto } from "./dto";

@Controller("audit")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AuditController {
  constructor(private readonly auditService: AuditService, private readonly auditApplicationService: AuditApplicationService) {}
  @Post() async create(@Body() input: CreateAuditDto) { await this.auditService.getPlaceholder(); return createItemResponse((await this.auditApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateAuditDto) { return createItemResponse((await this.auditApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryAuditDto) { const result = await this.auditApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.auditApplicationService.getById(id)).data); }
}
