import { Injectable } from "@nestjs/common";
import type { PondResponsibilityRepositoryPort } from "../ports/pond-responsibility-repository.port";
import type { PondResponsibilityRecord } from "../pond-responsibility.models";

const IN_MEMORY_POND_RESPONSIBILITIES: PondResponsibilityRecord[] = [
  {
    id: "pond-responsibility-1",
    userId: "user-1",
    pondId: "pond-1",
    responsibilityType: "operator",
    active: true,
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: undefined,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "pond-responsibility-2",
    userId: "user-1",
    pondId: "pond-2",
    responsibilityType: "temporary",
    active: true,
    startsAt: "2026-05-08T00:00:00.000Z",
    endsAt: "2026-05-12T00:00:00.000Z",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z"
  },
  {
    id: "pond-responsibility-3",
    userId: "user-2",
    pondId: "pond-3",
    responsibilityType: "pond_manager",
    active: true,
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: undefined,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "pond-responsibility-4",
    userId: "user-3",
    pondId: "pond-4",
    responsibilityType: "operator",
    active: false,
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: undefined,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "pond-responsibility-5",
    userId: "user-4",
    pondId: "pond-5",
    responsibilityType: "temporary",
    active: true,
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: "2026-05-05T00:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z"
  }
];

function isActiveAt(record: PondResponsibilityRecord, at: string): boolean {
  const atMillis = Date.parse(at);
  if (!record.active) {
    return false;
  }

  if (record.startsAt && Date.parse(record.startsAt) > atMillis) {
    return false;
  }

  if (record.endsAt && Date.parse(record.endsAt) < atMillis) {
    return false;
  }

  return true;
}

@Injectable()
export class InMemoryPondResponsibilityRepository implements PondResponsibilityRepositoryPort {
  async listActiveByUserId(userId: string, at: string): Promise<readonly PondResponsibilityRecord[]> {
    return IN_MEMORY_POND_RESPONSIBILITIES.filter(
      (record) => record.userId === userId && isActiveAt(record, at)
    );
  }

  async hasActiveResponsibility(userId: string, pondId: string, at: string): Promise<boolean> {
    return IN_MEMORY_POND_RESPONSIBILITIES.some(
      (record) => record.userId === userId && record.pondId === pondId && isActiveAt(record, at)
    );
  }
}
