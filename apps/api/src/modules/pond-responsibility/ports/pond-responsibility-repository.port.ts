import type { PondResponsibilityRecord } from "../pond-responsibility.models";

export const POND_RESPONSIBILITY_REPOSITORY = Symbol("POND_RESPONSIBILITY_REPOSITORY");

export interface PondResponsibilityRepositoryPort {
  listActiveByUserId(userId: string, at: string): Promise<readonly PondResponsibilityRecord[]>;
  hasActiveResponsibility(userId: string, pondId: string, at: string): Promise<boolean>;
}
