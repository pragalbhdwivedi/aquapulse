import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
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
  async create(@Body() input: CreateTasksDto) {
    await this.tasksService.getPlaceholder();

    const result = await this.tasksApplicationService.create(toCreateTasksInput(input));
    return toTasksItemResponse(result.data);
  }

  @Get()
  async list(@Query() query: QueryTasksDto) {
    const result = await this.tasksApplicationService.list(toQueryTasksInput(query));
    return toTasksListResponse(result.data);
  }

  // Resource handlers
  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: UpdateTasksDto) {
    const result = await this.tasksApplicationService.update(id, toUpdateTasksInput(input));
    return toTasksItemResponse(result.data);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const result = await this.tasksApplicationService.getById(id);
    return toTasksItemResponse(result.data);
  }
}
