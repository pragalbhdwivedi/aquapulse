import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import type { EndpointResponse } from "@aquapulse/types";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { RequireAuthentication } from "../../common/auth/auth-slice.decorator";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { RequireRoles } from "../../common/auth/require-roles.decorator";
import { delegateCreate, delegateGetById, delegateList, delegateUpdate } from "../../common/http/controller-delegation";
import { CreateTasksDto, QueryTasksDto, UpdateTasksDto } from "./dto";
import { TasksApplicationService } from "./application/tasks.application-service";
import { toCreateTasksInput, toQueryTasksInput, toTasksItemResponse, toTasksListResponse, toUpdateTasksInput } from "./mappers/tasks.mapper";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly tasksApplicationService: TasksApplicationService
  ) {}

  // Collection handlers
  @Post()
  @RequireAuthentication()
  @RequireRoles("operator")
  async create(
    @Body() input: CreateTasksDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.tasks.create>> {
    await this.tasksService.getPlaceholder();
    return delegateCreate(
      input,
      toCreateTasksInput,
      (mappedInput) => this.tasksApplicationService.create(mappedInput),
      toTasksItemResponse
    );
  }

  @Get()
  async list(
    @Query() query: QueryTasksDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.tasks.list>> {
    return delegateList(
      query,
      toQueryTasksInput,
      (mappedQuery) => this.tasksApplicationService.list(mappedQuery),
      toTasksListResponse
    );
  }

  // Resource handlers
  @Patch(":id")
  @RequireAuthentication()
  @RequireRoles("operator")
  async update(
    @Param("id") id: string,
    @Body() input: UpdateTasksDto
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.tasks.update>> {
    return delegateUpdate(
      id,
      input,
      toUpdateTasksInput,
      (resourceId, mappedInput) => this.tasksApplicationService.update(resourceId, mappedInput),
      toTasksItemResponse
    );
  }

  @Get(":id")
  async getById(
    @Param("id") id: string
  ): Promise<EndpointResponse<typeof aquaPulseEndpointCatalog.tasks.getById>> {
    return delegateGetById(id, (resourceId) => this.tasksApplicationService.getById(resourceId), toTasksItemResponse);
  }
}
