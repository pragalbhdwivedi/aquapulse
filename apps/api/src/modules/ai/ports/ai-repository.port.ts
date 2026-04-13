import type { AiResponseRecord, ListResponse } from "@aquapulse/types";
import type { CreateAiDto, QueryAiDto, UpdateAiDto } from "../dto";

export const AI_REPOSITORY = Symbol("AI_REPOSITORY");

export interface AiRepositoryPort {
  create(input: CreateAiDto): Promise<AiResponseRecord>;
  update(id: string, input: UpdateAiDto): Promise<AiResponseRecord>;
  getById(id: string): Promise<AiResponseRecord>;
  list(query: QueryAiDto): Promise<ListResponse<AiResponseRecord>>;
  saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord>;
}
