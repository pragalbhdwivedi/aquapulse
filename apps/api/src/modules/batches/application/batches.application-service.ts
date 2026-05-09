import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ApiSuccessEnvelope, BatchSummary, ListResponse } from "@aquapulse/types";
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import { PondReadAuthorizationService } from "../../pond-responsibility/application/pond-read-authorization.service";
import type { CreateBatchesDto, UpdateBatchesDto } from "../dto";
import { BATCHES_REPOSITORY, type BatchesRepositoryPort } from "../ports/batches-repository.port";
import type { BatchesListQueryContract } from "../query-contracts/batches-query.contract";

interface BatchReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}

interface PondReadAuthorizationPort {
  canReadPond(
    actor: BatchReadRequesterScope | undefined,
    pondId: string,
    at?: string
  ): Promise<boolean>;
  listReadablePondIds(
    actor: BatchReadRequesterScope | undefined,
    at?: string
  ): Promise<readonly string[] | undefined>;
}

@Injectable()
export class BatchesApplicationService {
  constructor(
    @Inject(BATCHES_REPOSITORY) private readonly batchesRepository: BatchesRepositoryPort,
    private readonly pondReadAuthorizationService: PondReadAuthorizationPort = {
      canReadPond: async () => true,
      listReadablePondIds: async () => undefined
    }
  ) {}

  async create(_input: CreateBatchesDto): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: await this.batchesRepository.create(_input) }; }
  async update(_id: string, _input: UpdateBatchesDto): Promise<ApiSuccessEnvelope<BatchSummary>> { return { ok: true, data: await this.batchesRepository.update(_id, _input) }; }
  async list(
    _query: BatchesListQueryContract,
    requester?: BatchReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<BatchSummary>>> {
    const readablePondIds = await this.pondReadAuthorizationService.listReadablePondIds(requester);
    const scopedQuery: BatchesListQueryContract =
      readablePondIds === undefined
        ? _query
        : {
            ..._query,
            readablePondIds
          };

    return { ok: true, data: await this.batchesRepository.list(scopedQuery) };
  }
  async getById(
    _id: string,
    requester?: BatchReadRequesterScope
  ): Promise<ApiSuccessEnvelope<BatchSummary>> {
    const readablePondIds = await this.pondReadAuthorizationService.listReadablePondIds(requester);

    if (readablePondIds !== undefined) {
      const scopedDetail = await this.batchesRepository.list({
        page: 1,
        pageSize: 1,
        batchId: _id,
        readablePondIds
      });

      const batch = scopedDetail.items[0];
      if (!batch) {
        throw new NotFoundException(createNotFoundResponse("Batch").error);
      }

      return { ok: true, data: batch };
    }

    const batch = await this.batchesRepository.getById(_id);
    const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, batch.pondId);

    if (!canReadPond) {
      throw new NotFoundException(createNotFoundResponse("Batch").error);
    }

    return { ok: true, data: batch };
  }
}
