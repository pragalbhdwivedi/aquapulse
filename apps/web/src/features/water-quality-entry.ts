import type { WaterQualityCreateRequest, WaterQualityReading } from "@aquapulse/types";
import { waterQualityEntryCreateSchema } from "@aquapulse/validation";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import {
  createValidatedSubmitter,
  type SubmissionResult,
  type SubmissionSuccess,
  type SubmissionValidationError
} from "./form-submission";

export type WaterQualityEntryValidationError = SubmissionValidationError<keyof WaterQualityCreateRequest>;
export type WaterQualityEntrySuccess = SubmissionSuccess<WaterQualityReading>;
export type WaterQualityEntrySubmissionResult = SubmissionResult<
  WaterQualityReading,
  keyof WaterQualityCreateRequest
>;

export function createWaterQualityEntrySubmitter(
  repositories: Pick<AquaPulseRepositories, "waterQuality">
) {
  return createValidatedSubmitter({
    schema: waterQualityEntryCreateSchema,
    fields: ["pondId", "recordedAt", "temperatureC", "ph"] as const,
    submit: async (input: WaterQualityCreateRequest) => {
      const response = await repositories.waterQuality.create(input);
      return response.data;
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
