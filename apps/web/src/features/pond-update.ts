import type { PondSummary, PondUpdateRequest } from "@aquapulse/types";
import { pondUpdateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSyncSubmitter,
  type MutationSyncSubmissionResult,
  type MutationSyncSuccess
} from "./mutation-refresh";

export type PondUpdateValidationError = SubmissionValidationError<keyof PondUpdateRequest>;
export type PondUpdateSuccess = MutationSyncSuccess<
  PondSummary,
  Awaited<ReturnType<AquaPulseRepositories["ponds"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["ponds"]["getById"]>>["data"]
>;
export type PondUpdateSubmissionResult = MutationSyncSubmissionResult<
  PondSummary,
  keyof PondUpdateRequest,
  Awaited<ReturnType<AquaPulseRepositories["ponds"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["ponds"]["getById"]>>["data"]
>;

export function createPondUpdateSubmitter(
  repositories: Pick<AquaPulseRepositories, "ponds">
) {
  return (pondId: string) =>
    createMutationSyncSubmitter({
      schema: pondUpdateSchema,
      fields: ["name", "code", "farmId", "kind", "status"] as const,
      submit: async (input: PondUpdateRequest) => {
        const response = await repositories.ponds.update(pondId, input);
        return response.data;
      },
      refreshList: async (_input, data) => {
        const refreshed = await repositories.ponds.list({
          page: 1,
          pageSize: 20,
          farmId: data.farmId
        });
        return refreshed.data;
      },
      refreshDetail: async (_input, data) => {
        const refreshed = await repositories.ponds.getById(data.id);
        return refreshed.data;
      }
    });
}

export async function submitPondUpdate(
  pondId: string,
  input: PondUpdateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<PondUpdateSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createPondUpdateSubmitter(repositories)(pondId);
  return submitter(input);
}
