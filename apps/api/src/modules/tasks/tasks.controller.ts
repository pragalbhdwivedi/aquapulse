import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { PlaceholderAuditInterceptor } from "../../common/audit/placeholder-audit.interceptor";
import { PlaceholderAuthGuard } from "../../common/auth/placeholder-auth.guard";
import { PlaceholderRoleGuard } from "../../common/auth/placeholder-role.guard";
import { createItemResponse, createListResponse } from "../../common/api/response-mapper";
import { CreateTasksDto, QueryTasksDto, UpdateTasksDto } from "./dto";
import { TasksApplicationService } from "./application/tasks.application-service";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(PlaceholderAuthGuard, PlaceholderRoleGuard)
@UseInterceptors(PlaceholderAuditInterceptor)
export class TasksController {
  constructor(private readonly tasksService: TasksService, private readonly tasksApplicationService: TasksApplicationService) {}
  @Post() async create(@Body() input: CreateTasksDto) { await this.tasksService.getPlaceholder(); return createItemResponse((await this.tasksApplicationService.create(input)).data); }
  @Patch(":id") async update(@Param("id") id: string, @Body() input: UpdateTasksDto) { return createItemResponse((await this.tasksApplicationService.update(id, input)).data); }
  @Get() async list(@Query() query: QueryTasksDto) { const result = await this.tasksApplicationService.list(query); return createListResponse(result.data.items, result.data.page); }
  @Get(":id") async getById(@Param("id") id: string) { return createItemResponse((await this.tasksApplicationService.getById(id)).data); }
}
