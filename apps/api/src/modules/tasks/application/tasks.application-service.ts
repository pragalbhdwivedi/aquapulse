import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  ListResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSummary
} from "@aquapulse/types";
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import { TASKS_REPOSITORY, type TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

interface TaskReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
}

function shouldScopeTaskReadsByAssignee(
  requester: TaskReadRequesterScope | undefined
): requester is TaskReadRequesterScope & { readonly provider: "keycloak" } {
  return requester?.provider === "keycloak" && requester.id.trim().length > 0;
}

@Injectable()
export class TasksApplicationService {
  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepository: TasksRepositoryPort
  ) {}

  async create(input: TaskCreateRequest): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: await this.tasksRepository.create(input) }; }
  async update(id: string, input: TaskUpdateRequest): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: await this.tasksRepository.update(id, input) }; }
  async list(
    query: TasksListQueryContract,
    requester?: TaskReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<TaskSummary>>> {
    const scopedQuery: TasksListQueryContract = shouldScopeTaskReadsByAssignee(requester)
      ? {
          ...query,
          assigneeId: requester.id
        }
      : query;

    return { ok: true, data: await this.tasksRepository.list(scopedQuery) };
  }
  async getById(
    id: string,
    requester?: TaskReadRequesterScope
  ): Promise<ApiSuccessEnvelope<TaskSummary>> {
    if (shouldScopeTaskReadsByAssignee(requester)) {
      const scopedDetail = await this.tasksRepository.list({
        page: 1,
        pageSize: 1,
        taskId: id,
        assigneeId: requester.id
      });

      const task = scopedDetail.items[0];
      if (!task) {
        throw new NotFoundException(createNotFoundResponse("Task").error);
      }

      return { ok: true, data: task };
    }

    return { ok: true, data: await this.tasksRepository.getById(id) };
  }
}
