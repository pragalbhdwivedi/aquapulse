import { describe, expect, it, vi } from "vitest";
import {
  farmScope,
  reconcileFarmOutbox,
  type FarmOutboxItem,
} from "./offline-store";
const scope = farmScope({
  organizationId: "farm-business",
  actorId: "operator",
});
const item = (id: string): FarmOutboxItem => ({
  id,
  scope,
  operation: "activities",
  payload: { submissionId: id },
  status: "pending",
  createdAt: "2026-02-01T00:00:00Z",
});
describe("offline capture reconciliation", () => {
  it("never sends another user's device records", async () => {
    const send = vi.fn();
    await expect(
      reconcileFarmOutbox(
        scope,
        farmScope({ organizationId: "farm-business", actorId: "other" }),
        [item("one")],
        send,
      ),
    ).rejects.toThrow("account differs");
    expect(send).not.toHaveBeenCalled();
  });
  it("removes only confirmed records and leaves ambiguous failures retryable with the original ID", async () => {
    const remove = vi.fn();
    const save = vi.fn();
    let attempts = 0;
    const send = vi.fn(async () => {
      if (++attempts === 2) throw new Error("Connection lost");
    });
    expect(
      await reconcileFarmOutbox(
        scope,
        scope,
        [item("one"), item("two"), item("three")],
        send,
        save,
        remove,
      ),
    ).toBe(1);
    expect(remove).toHaveBeenCalledExactlyOnceWith("one");
    expect(save.mock.calls[0][0]).toMatchObject({
      id: "two",
      status: "pending",
      payload: { submissionId: "two" },
    });
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("retains conflicts and stops immediately after revoked access", async () => {
    const save = vi.fn();
    const send = vi.fn(async () => {
      throw Object.assign(new Error("Access revoked"), { status: 403 });
    });
    expect(
      await reconcileFarmOutbox(
        scope,
        scope,
        [item("one"), item("two")],
        send,
        save,
        vi.fn(),
      ),
    ).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].status).toBe("blocked");
    const conflictSave = vi.fn();
    await reconcileFarmOutbox(
      scope,
      scope,
      [item("one")],
      async () => {
        throw Object.assign(new Error("Closed cycle"), { status: 409 });
      },
      conflictSave,
      vi.fn(),
    );
    expect(conflictSave.mock.calls[0][0].status).toBe("conflict");
  });
});
