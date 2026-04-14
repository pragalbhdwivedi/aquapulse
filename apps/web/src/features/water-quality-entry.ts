import type { WaterQualityCreateRequest, WaterQualityReading } from "@aquapulse/types";
import { waterQualityEntryCreateSchema } from "@aquapulse/validation";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import { createApiClients, type AquaPulseClientSource } from "../clients";

export interface WaterQualityEntryValidationError {
  readonly status: "validation_error";
  readonly fieldErrors: Partial<Record<keyof WaterQualityCreateRequest, string>>;
}

export interface WaterQualityEntrySuccess {
  readonly status: "success";
  readonly data: WaterQualityReading;
}

export type WaterQualityEntrySubmissionResult =
  | WaterQualityEntryValidationError
  | WaterQualityEntrySuccess;

export function createWaterQualityEntrySubmitter(
  repositories: Pick<AquaPulseRepositories, "waterQuality">
) {
  return async (
    input: WaterQualityCreateRequest
  ): Promise<WaterQualityEntrySubmissionResult> => {
    const parsed = waterQualityEntryCreateSchema.safeParse(input);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return {
        status: "validation_error",
        fieldErrors: {
          pondId: flattened.pondId?.[0],
          recordedAt: flattened.recordedAt?.[0],
          temperatureC: flattened.temperatureC?.[0],
          ph: flattened.ph?.[0]
        }
      };
    }

    const response = await repositories.waterQuality.create(parsed.data);
    return {
      status: "success",
      data: response.data
    };
  };
}

export async function submitWaterQualityEntry(
  input: WaterQualityCreateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<WaterQualityEntrySubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createWaterQualityEntrySubmitter(repositories);
  return submitter(input);
}
