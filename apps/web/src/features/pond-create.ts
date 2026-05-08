import type { PondCreateRequest, PondSummary } from "@aquapulse/types";
import { pondCreateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSubmitter,
  type MutationSubmissionResult,
  type MutationSuccess
} from "./mutation-refresh";

export type PondCreateValidationError = SubmissionValidationError<keyof PondCreateRequest>;
export type PondCreateSuccess = MutationSuccess<
  PondSummary,
  Awaited<ReturnType<AquaPulseRepositories["ponds"]["list"]>>["data"]
>;
export type PondCreateSubmissionResult = MutationSubmissionResult<
  PondSummary,
  keyof PondCreateRequest,
  Awaited<ReturnType<AquaPulseRepositories["ponds"]["list"]>>["data"]
>;

export function createPondCreateSubmitter(
  repositories: Pick<AquaPulseRepositories, "ponds">
) {
  return createMutationSubmitter({
    schema: pondCreateSchema,
    fields: ["name", "code", "farmId", "kind"] as const,
    submit: async (input: PondCreateRequest) => {
      const response = await repositories.ponds.create(input);
      return response.data;
    },
    refreshList: async (input) => {
      const refreshed = await repositories.ponds.list({
        page: 1,
        pageSize: 20,
        farmId: input.farmId
      });
      return refreshed.data;
    }
  });
}

export async function submitPondCreate(
  input: PondCreateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<PondCreateSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createPondCreateSubmitter(repositories);
  return submitter(input);
}
