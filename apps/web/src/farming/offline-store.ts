import type { FarmWorkspaceView } from "@aquapulse/types";
export interface FarmOutboxItem {
  id: string;
  scope: string;
  operation: "activities" | "task-updates" | "photos";
  payload: Record<string, unknown>;
  status: "pending" | "conflict" | "blocked";
  error?: string;
  createdAt: string;
}
type Entry = { key: string; value: unknown };
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("aquapulse-field-v1", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("entries", { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function entries(): Promise<Entry[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("entries").objectStore("entries").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
async function write(key: string, value?: unknown) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("entries", "readwrite");
      if (value === undefined) tx.objectStore("entries").delete(key);
      else tx.objectStore("entries").put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export const farmScope = (
  workspace: Pick<FarmWorkspaceView, "organizationId" | "actorId">,
) => JSON.stringify([workspace.organizationId, workspace.actorId]);
export async function cacheFarmWorkspace(workspace: FarmWorkspaceView) {
  // Device cache excludes membership administration, finance and full audit history.
  await write("workspace", {
    ...workspace,
    memberships: undefined,
    erpJobs: [],
    audit: [],
  });
}
export async function cachedFarmWorkspace(): Promise<
  FarmWorkspaceView | undefined
> {
  return (await entries()).find((entry) => entry.key === "workspace")?.value as
    | FarmWorkspaceView
    | undefined;
}
export async function forgetCachedFarmWorkspace() {
  await write("workspace");
}
export async function farmOutbox(scope: string): Promise<FarmOutboxItem[]> {
  return (await entries())
    .filter((entry) => entry.key.startsWith("outbox:"))
    .map((entry) => entry.value as FarmOutboxItem)
    .filter((entry) => entry.scope === scope)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function saveFarmOutbox(item: FarmOutboxItem) {
  await write(`outbox:${item.id}`, item);
}
export async function removeFarmOutbox(id: string) {
  await write(`outbox:${id}`);
}
export async function clearFarmDevice() {
  for (const entry of await entries()) await write(entry.key);
}

export async function reconcileFarmOutbox(
  scope: string,
  currentScope: string,
  items: FarmOutboxItem[],
  send: (operation: string, payload: Record<string, unknown>) => Promise<void>,
  save = saveFarmOutbox,
  remove = removeFarmOutbox,
) {
  if (scope !== currentScope)
    throw new Error(
      "The connected account differs from the capture account. Switch accounts before synchronising.",
    );
  let synced = 0;
  for (const item of items) {
    if (item.scope !== scope || item.status !== "pending") continue;
    try {
      await send(item.operation, item.payload);
      await remove(item.id);
      synced++;
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? Number(error.status)
          : 0;
      await save({
        ...item,
        status:
          status === 409
            ? "conflict"
            : status >= 400 && status < 500
              ? "blocked"
              : "pending",
        error: error instanceof Error ? error.message : "Reconnect failed.",
      });
      if (status === 401 || status === 403 || status === 0 || status >= 500)
        break;
    }
  }
  return synced;
}
