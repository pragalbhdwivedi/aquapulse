import { Injectable } from "@nestjs/common";
import type { AiResponseRecord, ListResponse } from "@aquapulse/types";
import type { CreateAiDto, QueryAiDto, UpdateAiDto } from "../dto";
import type { AiRepositoryPort } from "../ports/ai-repository.port";

const aiRecord: AiResponseRecord = {
  id: "ai-response-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  requestId: "ai-request-1",
  status: "draft",
  outputText: "Placeholder AI output",
  model: "gpt-placeholder"
};

@Injectable()
export class InMemoryAiRepository implements AiRepositoryPort {
  async create(_input: CreateAiDto): Promise<AiResponseRecord> {
    return aiRecord;
  }

  async update(_id: string, _input: UpdateAiDto): Promise<AiResponseRecord> {
    return aiRecord;
  }

  async getById(_id: string): Promise<AiResponseRecord> {
    return aiRecord;
  }

  async list(_query: QueryAiDto): Promise<ListResponse<AiResponseRecord>> {
    return { items: [aiRecord], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord> {
    return record;
  }
}
