import type { WaterQualityCreateRequest, WaterQualityReading } from "@aquapulse/types";
import { waterQualityEntryCreateSchema } from "@aquapulse/validation";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import {
  type SubmissionValidationError
} from "./form-submission";
import {
  createMutationSubmitter,
  type MutationSubmissionResult,
  type MutationSuccess
} from "./mutation-refresh";

export type WaterQualityEntryValidationError = SubmissionValidationError<keyof WaterQualityCreateRequest>;
export type WaterQualityEntrySuccess = MutationSuccess<
  WaterQualityReading,
  Awaited<ReturnType<AquaPulseRepositories["waterQuality"]["listByPond"]>>["data"]
>;
export type WaterQualityEntrySubmissionResult = MutationSubmissionResult<
  WaterQualityReading,
  keyof WaterQualityCreateRequest,
  Awaited<ReturnType<AquaPulseRepositories["waterQuality"]["listByPond"]>>["data"]
>;

export function createWaterQualityEntrySubmitter(
  repositories: Pick<AquaPulseRepositories, "waterQuality">
) {
  return createMutationSubmitter({
    schema: waterQualityEntryCreateSchema,
    fields: ["pondId", "recordedAt", "temperatureC", "ph"] as const,
    submit: async (input: WaterQualityCreateRequest) => {
      const response = await repositories.waterQuality.create(input);
      return response.data;
    },
    refreshList: async (input) => {
      const refreshed = await repositories.waterQuality.listByPond(input.pondId, {
        page: 1,
        pageSize: 20
      });
      return refreshed.data;
    }
  });
}

export async function submitWaterQualityEntry(
  input: WaterQualityCreateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<WaterQualityEntrySubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createWaterQualityEntrySubmitter(repositories);
  return submitter(input);
}
