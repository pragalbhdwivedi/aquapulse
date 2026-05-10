import type { PondsListQueryRequest } from "@aquapulse/types";

export interface PondListQueryContract extends PondsListQueryRequest {
  readonly readablePondIds?: readonly string[];
}
