import { Inject, Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, BatchSummary, ListResponse } from "@aquapulse/types";
import type { CreateBatchesDto, UpdateBatchesDto } from "../dto";
import { BATCHES_REPOSITORY, type BatchesRepositoryPort } from "../ports/batches-repository.port";
import type { BatchesListQueryContract } from "../query-contracts/batches-query.contract";

@Injectable()
export class BatchesApplicationService {
  constructor(
    @Inject(BATCHES_REPOSITORY) private readonly batchesRepository: BatchesRepositoryPort
  ) {}

  async create(_input: CreateBatchesDto): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: await this.batchesRepository.create(_input) }; }
  async update(_id: string, _input: UpdateBatchesDto): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: await this.batchesRepository.update(_id, _input) }; }
  async list(_query: BatchesListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<BatchSummary>>> { return { ok: true, data: await this.batchesRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: await this.batchesRepository.getById(_id) }; }
}
