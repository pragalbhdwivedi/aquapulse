import type { ListResponse, PondSummary } from "@aquapulse/types";
import type { CreatePondsDto, UpdatePondsDto } from "../dto";
import type { PondListQueryContract } from "../query-contracts/ponds-query.contract";

export const PONDS_REPOSITORY = Symbol("PONDS_REPOSITORY");

export interface PondsRepositoryPort {
  create(input: CreatePondsDto): Promise<PondSummary>;
  update(id: string, input: UpdatePondsDto): Promise<PondSummary>;
  getById(id: string): Promise<PondSummary>;
  list(query: PondListQueryContract): Promise<ListResponse<PondSummary>>;
}
