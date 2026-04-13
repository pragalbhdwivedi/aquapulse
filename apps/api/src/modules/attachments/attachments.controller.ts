import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsService } from "./attachments.service";
import { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "./dto";

@Controller("attachments")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService, private readonly attachmentsApplicationService: AttachmentsApplicationService) {}
  @Post() async create(@Body() input: CreateAttachmentsDto) { await this.attachmentsService.getPlaceholder(); return createItemResponse((await this.attachmentsApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateAttachmentsDto) { return createItemResponse((await this.attachmentsApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryAttachmentsDto) { const result = await this.attachmentsApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.attachmentsApplicationService.getById(id)).data); }
}
