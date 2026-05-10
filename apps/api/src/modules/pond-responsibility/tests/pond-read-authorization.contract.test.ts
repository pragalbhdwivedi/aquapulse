import { describe, expect, it } from "vitest";
import { PondReadAuthorizationService } from "../application/pond-read-authorization.service";
import type { PondResponsibilityRepositoryPort } from "../ports/pond-responsibility-repository.port";

describe("Pond responsibility foundation", () => {
  it("keeps local-safe pond reads broad", async () => {
    const repository: PondResponsibilityRepositoryPort = {
      async listActiveByUserId() {
        return [];
      },
      async hasActiveResponsibility() {
        return false;
      }
    };

    const service = new PondReadAuthorizationService(repository);

    await expect(service.canReadPond({ id: "user-1", provider: "local" }, "pond-1")).resolves.toBe(true);
    await expect(service.listReadablePondIds({ id: "user-1", provider: "local" })).resolves.toBeUndefined();
    await expect(service.canReadPond(undefined, "pond-1")).resolves.toBe(true);
    await expect(service.listReadablePondIds(undefined)).resolves.toBeUndefined();
  });

  it("returns bounded pond visibility in active keycloak mode", async () => {
    const repository: PondResponsibilityRepositoryPort = {
      async listActiveByUserId(userId) {
        if (userId !== "user-1") {
          return [];
        }

        return [
          {
            id: "responsibility-1",
            userId: "user-1",
            pondId: "pond-1",
            responsibilityType: "operator",
            active: true,
            startsAt: "2026-05-10T00:00:00.000Z",
            endsAt: undefined,
            createdAt: "2026-05-10T00:00:00.000Z",
            updatedAt: "2026-05-10T00:00:00.000Z"
          },
          {
            id: "responsibility-2",
            userId: "user-1",
            pondId: "pond-2",
            responsibilityType: "temporary",
            active: true,
            startsAt: "2026-05-10T00:00:00.000Z",
            endsAt: undefined,
            createdAt: "2026-05-10T00:00:00.000Z",
            updatedAt: "2026-05-10T00:00:00.000Z"
          },
          {
            id: "responsibility-3",
            userId: "user-1",
            pondId: "pond-2",
            responsibilityType: "temporary",
            active: true,
            startsAt: "2026-05-10T00:00:00.000Z",
            endsAt: undefined,
            createdAt: "2026-05-10T00:00:00.000Z",
            updatedAt: "2026-05-10T00:00:00.000Z"
          }
        ];
      },
      async hasActiveResponsibility(userId, pondId) {
        return userId === "user-1" && pondId === "pond-2";
      }
    };

    const service = new PondReadAuthorizationService(repository);

    await expect(
      service.listReadablePondIds(
        { id: "user-1", provider: "keycloak", roles: ["operator"] },
        "2026-05-10T12:00:00.000Z"
      )
    ).resolves.toEqual(["pond-1", "pond-2"]);
    await expect(
      service.canReadPond(
        { id: "user-1", provider: "keycloak", roles: ["operator"] },
        "pond-2",
        "2026-05-10T12:00:00.000Z"
      )
    ).resolves.toBe(true);
    await expect(
      service.canReadPond(
        { id: "user-1", provider: "keycloak", roles: ["operator"] },
        "pond-9",
        "2026-05-10T12:00:00.000Z"
      )
    ).resolves.toBe(false);
  });
});
