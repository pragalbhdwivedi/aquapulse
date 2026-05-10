import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ApiSuccessEnvelope,
  ListResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSummary
} from "@aquapulse/types";
import { createForbiddenResponse, createNotFoundResponse } from "../../../common/api/response-mapper";
import { PondReadAuthorizationService } from "../../pond-responsibility/application/pond-read-authorization.service";
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
    @Inject(TASKS_REPOSITORY) private readonly tasksRepository: TasksRepositoryPort,
    private readonly pondReadAuthorizationService: PondReadAuthorizationService = new PondReadAuthorizationService({
      canReadPond: async () => true,
      listActiveByUserId: async () => [],
      hasActiveResponsibility: async () => true
    } as never)
  ) {}

  async create(
    input: TaskCreateRequest,
    requester?: TaskReadRequesterScope
  ): Promise<ApiSuccessEnvelope<TaskSummary>> {
    if (input.pondId) {
      const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, input.pondId);

      if (!canReadPond) {
        throw new ForbiddenException(createForbiddenResponse().error);
      }
    }

    return { ok: true, data: await this.tasksRepository.create(input) };
  }
  async update(
    id: string,
    input: TaskUpdateRequest,
    requester?: TaskReadRequesterScope
  ): Promise<ApiSuccessEnvelope<TaskSummary>> {
    await this.assertTaskVisibleToRequester(id, requester);

    const currentTask = await this.tasksRepository.getById(id);
    if (input.pondId && input.pondId !== currentTask.pondId) {
      const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, input.pondId);

      if (!canReadPond) {
        throw new ForbiddenException(createForbiddenResponse().error);
      }
    }

    return { ok: true, data: await this.tasksRepository.update(id, input) };
  }
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

  private async assertTaskVisibleToRequester(
    id: string,
    requester?: TaskReadRequesterScope
  ) {
    if (!shouldScopeTaskReadsByAssignee(requester)) {
      return;
    }

    const scopedDetail = await this.tasksRepository.list({
      page: 1,
      pageSize: 1,
      taskId: id,
      assigneeId: requester.id
    });

    if (scopedDetail.items.length === 0) {
      throw new NotFoundException(createNotFoundResponse("Task").error);
    }
  }
}
