import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
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
  async create(
    @Body() input: CreateAttachmentsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.attachments.create>> {
    await this.attachmentsService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateAttachmentsInput,
      (mappedInput) => this.attachmentsApplicationService.create(mappedInput),
      toAttachmentsItemResponse
    );
  }

  @Get()
  async list(
    @Query() query: QueryAttachmentsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.attachments.list>> {
    return delegateList(
      query,
      toQueryAttachmentsInput,
      (mappedQuery) => this.attachmentsApplicationService.list(mappedQuery),
      toAttachmentsListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateAttachmentsDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.attachments.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateAttachmentsInput,
      (resourceId, mappedInput) => this.attachmentsApplicationService.update(resourceId, mappedInput),
      toAttachmentsItemResponse
    );
  }

  @Get(":id")
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.attachments.getById>> {
    return delegateGetById(
      id,
      (resourceId) => this.attachmentsApplicationService.getById(resourceId),
      toAttachmentsItemResponse
    );
  }
}
