import { describe, expect, it } from "vitest";
import {
  cancelInlineEdit,
  completeInlineEdit,
  createInlineEditState,
  failInlineEdit,
  patchInlineEditDraft,
  startInlineEdit
} from "../features/inline-edit";

describe("Shared inline edit helper", () => {
  it("supports the task-style edit lifecycle", () => {
    const initial = createInlineEditState({
      title: "Inspect aerator",
      status: "todo",
      assigneeId: ""
    });

    const editing = startInlineEdit(initial);
    const changed = patchInlineEditDraft(editing, {
      title: "Inspect aerator complete",
      status: "done"
    });
    const completed = completeInlineEdit(changed, changed.draftValue, "Task updated.");

    expect(completed.isEditing).toBe(false);
    expect(completed.initialValue.title).toBe("Inspect aerator complete");
    expect(completed.feedback?.tone).toBe("success");
  });

  it("supports the feed-style cancel and failure lifecycle", () => {
    const initial = createInlineEditState({
      feedType: "Starter Feed",
      quantityKg: "18",
      fedAt: "2026-04-14T06:00:00.000Z",
      batchId: "batch-1"
    });

    const editing = startInlineEdit(initial);
    const changed = patchInlineEditDraft(editing, {
      feedType: "Grower Feed",
      quantityKg: "24"
    });
    const failed = failInlineEdit(changed, "Please review the feed entry details.");
    const cancelled = cancelInlineEdit(failed);

    expect(failed.feedback?.tone).toBe("error");
    expect(cancelled.isEditing).toBe(false);
    expect(cancelled.draftValue.feedType).toBe("Starter Feed");
  });
});
