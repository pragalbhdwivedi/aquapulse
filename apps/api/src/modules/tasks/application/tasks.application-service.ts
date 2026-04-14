import { Inject, Injectable } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  ListResponse,
  TaskCreateRequest,
  TaskSummary
} from "@aquapulse/types";
import type { UpdateTasksDto } from "../dto";
import { TASKS_REPOSITORY, type TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

@Injectable()
export class TasksApplicationService {
  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepository: TasksRepositoryPort
  ) {}

  async create(input: TaskCreateRequest): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: await this.tasksRepository.create(input) }; }
  async update(_id: string, _input: UpdateTasksDto): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: await this.tasksRepository.update(_id, _input) }; }
  async list(_query: TasksListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<TaskSummary>>> { return { ok: true, data: await this.tasksRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: await this.tasksRepository.getById(_id) }; }
}
