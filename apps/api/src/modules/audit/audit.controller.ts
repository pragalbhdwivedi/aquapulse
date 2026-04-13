import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { AuditApplicationService } from "./application/audit.application-service";
import { AuditService } from "./audit.service";
import { CreateAuditDto, QueryAuditDto, UpdateAuditDto } from "./dto";
import { toAuditItemResponse, toAuditListResponse, toCreateAuditInput, toQueryAuditInput, toUpdateAuditInput } from "./mappers/audit.mapper";

@Controller("audit")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditApplicationService: AuditApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(@Body() input: CreateAuditDto) {
    await this.auditService.getPlaceholder();

    const result = await this.auditApplicationService.create(toCreateAuditInput(input));
    return toAuditItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryAuditDto) {
    const result = await this.auditApplicationService.list(toQueryAuditInput(query));
    return toAuditListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateAuditDto) {
    const result = await this.auditApplicationService.update(id, toUpdateAuditInput(input));
    return toAuditItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.auditApplicationService.getById(id);
    return toAuditItemResponse(result.data);
  }
}
