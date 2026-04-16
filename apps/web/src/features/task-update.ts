import type { TaskSummary, TaskUpdateRequest } from "@aquapulse/types";
import { taskUpdateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSyncSubmitter,
  type MutationSyncSubmissionResult,
  type MutationSyncSuccess
} from "./mutation-refresh";

export type TaskUpdateValidationError = SubmissionValidationError<keyof TaskUpdateRequest>;
export type TaskUpdateSuccess = MutationSyncSuccess<
  TaskSummary,
  Awaited<ReturnType<AquaPulseRepositories["tasks"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["tasks"]["getById"]>>["data"]
>;
export type TaskUpdateSubmissionResult = MutationSyncSubmissionResult<
  TaskSummary,
  keyof TaskUpdateRequest,
  Awaited<ReturnType<AquaPulseRepositories["tasks"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["tasks"]["getById"]>>["data"]
>;

export function createTaskUpdateSubmitter(
  repositories: Pick<AquaPulseRepositories, "tasks">
) {
  return (taskId: string) =>
    createMutationSyncSubmitter({
      schema: taskUpdateSchema,
      fields: ["title", "status", "assigneeId", "pondId"] as const,
      submit: async (input: TaskUpdateRequest) => {
        const response = await repositories.tasks.update(taskId, input);
        return response.data;
      },
      refreshList: async (_input, data) => {
        const refreshed = await repositories.tasks.list({
          page: 1,
          pageSize: 20,
          pondId: data.pondId
        });
        return refreshed.data;
      },
      refreshDetail: async (_input, data) => {
        const refreshed = await repositories.tasks.getById(data.id);
        return refreshed.data;
      }
    });
}

export async function submitTaskUpdate(
  taskId: string,
  input: TaskUpdateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<TaskUpdateSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createTaskUpdateSubmitter(repositories)(taskId);
  return submitter(input);
}
