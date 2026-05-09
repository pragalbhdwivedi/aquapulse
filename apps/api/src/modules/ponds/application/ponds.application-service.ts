import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ApiSuccessEnvelope, ListResponse, PondSummary } from "@aquapulse/types";
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import { PondReadAuthorizationService } from "../../pond-responsibility/application/pond-read-authorization.service";
import type { CreatePondsDto, UpdatePondsDto } from "../dto";
import { PONDS_REPOSITORY, type PondsRepositoryPort } from "../ports/ponds-repository.port";
import type { PondListQueryContract } from "../query-contracts/ponds-query.contract";

interface PondReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}

interface PondReadAuthorizationPort {
  canReadPond(
    actor: PondReadRequesterScope | undefined,
    pondId: string,
    at?: string
  ): Promise<boolean>;
  listReadablePondIds(
    actor: PondReadRequesterScope | undefined,
    at?: string
  ): Promise<readonly string[] | undefined>;
}

@Injectable()
export class PondsApplicationService {
  constructor(
    @Inject(PONDS_REPOSITORY) private readonly pondsRepository: PondsRepositoryPort,
    private readonly pondReadAuthorizationService: PondReadAuthorizationPort = {
      canReadPond: async () => true,
      listReadablePondIds: async () => undefined
    }
  ) {}

  async create(_input: CreatePondsDto): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: await this.pondsRepository.create(_input) };
  }

  async update(_id: string, _input: UpdatePondsDto): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: await this.pondsRepository.update(_id, _input) };
  }

  async list(
    _query: PondListQueryContract,
    requester?: PondReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>> {
    const readablePondIds = await this.pondReadAuthorizationService.listReadablePondIds(requester);
    const scopedQuery: PondListQueryContract =
      readablePondIds === undefined
        ? _query
        : {
            ..._query,
            readablePondIds
          };

    return { ok: true, data: await this.pondsRepository.list(scopedQuery) };
  }

  async getById(
    _id: string,
    requester?: PondReadRequesterScope
  ): Promise<ApiSuccessEnvelope<PondSummary>> {
    const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, _id);

    if (!canReadPond) {
      throw new NotFoundException(createNotFoundResponse("Pond").error);
    }

    return { ok: true, data: await this.pondsRepository.getById(_id) };
  }
}
