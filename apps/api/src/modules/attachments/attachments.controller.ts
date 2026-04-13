import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { AttachmentsApplicationService } from "./application/attachments.application-service";
import { AttachmentsService } from "./attachments.service";
import { CreateAttachmentsDto, QueryAttachmentsDto, UpdateAttachmentsDto } from "./dto";
import {
  toAttachmentsItemResponse,
  toAttachmentsListResponse,
  toCreateAttachmentsInput,
  toQueryAttachmentsInput,
  toUpdateAttachmentsInput
} from "./mappers/attachments.mapper";

@Controller("attachments")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly attachmentsApplicationService: AttachmentsApplicationService
  ) {}

  // Collection handlers
  @Post()
  async create(@Body() input: CreateAttachmentsDto) {
    await this.attachmentsService.getPlaceholder();

    const result = await this.attachmentsApplicationService.create(toCreateAttachmentsInput(input));
    return toAttachmentsItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryAttachmentsDto) {
    const result = await this.attachmentsApplicationService.list(toQueryAttachmentsInput(query));
    return toAttachmentsListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateAttachmentsDto) {
    const result = await this.attachmentsApplicationService.update(id, toUpdateAttachmentsInput(input));
    return toAttachmentsItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.attachmentsApplicationService.getById(id);
    return toAttachmentsItemResponse(result.data);
  }
}
