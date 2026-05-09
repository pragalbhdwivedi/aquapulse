import type {
  WaterQualityReading,
  WaterQualityUpdateRequest
} from "@aquapulse/types";
import { waterQualityEntryUpdateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSyncSubmitter,
  type MutationSyncSubmissionResult,
  type MutationSyncSuccess
} from "./mutation-refresh";

export type WaterQualityUpdateValidationError = SubmissionValidationError<
  keyof WaterQualityUpdateRequest
>;
export type WaterQualityUpdateSuccess = MutationSyncSuccess<
  WaterQualityReading,
  Awaited<ReturnType<AquaPulseRepositories["waterQuality"]["listByPond"]>>["data"],
  WaterQualityReading
>;
export type WaterQualityUpdateSubmissionResult = MutationSyncSubmissionResult<
  WaterQualityReading,
  keyof WaterQualityUpdateRequest,
  Awaited<ReturnType<AquaPulseRepositories["waterQuality"]["listByPond"]>>["data"],
  WaterQualityReading
>;

export function createWaterQualityUpdateSubmitter(
  repositories: Pick<AquaPulseRepositories, "waterQuality">
) {
  return (readingId: string, pondId: string) =>
    createMutationSyncSubmitter({
      schema: waterQualityEntryUpdateSchema,
      fields: ["pondId", "recordedAt", "temperatureC", "ph"] as const,
      submit: async (input: WaterQualityUpdateRequest) => {
        const response = await repositories.waterQuality.update(readingId, input);
        return response.data;
      },
      refreshList: async () => {
        const refreshed = await repositories.waterQuality.listByPond(pondId, {
          page: 1,
          pageSize: 20
        });
        return refreshed.data;
      },
      refreshDetail: async (_input, data) => {
        const refreshed = await repositories.waterQuality.getById(data.id);
        return refreshed.data;
      }
    });
}

export async function submitWaterQualityUpdate(
  readingId: string,
  pondId: string,
  input: WaterQualityUpdateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<WaterQualityUpdateSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createWaterQualityUpdateSubmitter(repositories)(readingId, pondId);
  return submitter(input);
}
