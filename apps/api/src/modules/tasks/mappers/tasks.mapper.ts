import type { ApiSuccessEnvelope, ListResponse, TaskSummary } from "@aquapulse/types";
import { toRepositoryListQuery } from "../../../common/dto/repository-query.mapper";
import type { CreateTasksDto, QueryTasksDto, UpdateTasksDto } from "../dto";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";
import { createItemResponse, createListResponse } from "../../../common/api/response-mapper";

export function toCreateTasksInput(input: CreateTasksDto): CreateTasksDto {
  return input;
}

export function toUpdateTasksInput(input: UpdateTasksDto): UpdateTasksDto {
  return input;
}

export function toQueryTasksInput(input: QueryTasksDto): TasksListQueryContract {
  return toRepositoryListQuery(input, {
    assigneeId: input.assigneeId,
    pondId: input.pondId,
    status: input.status
  });
}

export function toTasksItemResponse(item: TaskSummary): ApiSuccessEnvelope<TaskSummary> {
  return createItemResponse(item);
}

export function toTasksListResponse(list: ListResponse<TaskSummary>): ApiSuccessEnvelope<ListResponse<TaskSummary>> {
  return createListResponse(list.items, list.page);
}
