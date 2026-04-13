import { Inject, Injectable } from "@nestjs/common";
import type { ApiSuccessEnvelope, ListResponse, PondSummary } from "@aquapulse/types";
import type { CreatePondsDto, QueryPondsDto, UpdatePondsDto } from "../dto";
import { PONDS_REPOSITORY, type PondsRepositoryPort } from "../ports/ponds-repository.port";

@Injectable()
export class PondsApplicationService {
  constructor(
    @Inject(PONDS_REPOSITORY) private readonly pondsRepository: PondsRepositoryPort
  ) {}

  async create(_input: CreatePondsDto): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: await this.pondsRepository.create(_input) };
  }

  async update(_id: string, _input: UpdatePondsDto): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: await this.pondsRepository.update(_id, _input) };
  }

  async list(_query: QueryPondsDto): Promise<ApiSuccessEnvelope<ListResponse<PondSummary>>> {
    return { ok: true, data: await this.pondsRepository.list(_query) };
  }

  async getById(_id: string): Promise<ApiSuccessEnvelope<PondSummary>> {
    return { ok: true, data: await this.pondsRepository.getById(_id) };
  }
}
