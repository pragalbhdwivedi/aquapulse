import type { BatchesListQueryRequest } from "@aquapulse/types";

export interface BatchesListQueryContract extends BatchesListQueryRequest {
  readonly batchId?: string;
  readonly readablePondIds?: readonly string[];
}
