import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { FarmWorkspace } from "@aquapulse/types";
import { PostgresFarmWorkspaceStore } from "./workspace-store";

// Opt-in only: dedicated disposable database, never the deployment database URL.
const url = process.env.AQUAPULSE_FARM_TEST_DATABASE_URL;
describe.skipIf(!url)(
  "PostgreSQL farming migration, locking and restart",
  () => {
    it("applies the migration twice, rolls back failures and preserves concurrent writes after restart", async () => {
      const pool = new Pool({ connectionString: url });
      const state: FarmWorkspace = {
        schemaVersion: 1,
        organizationId: `integration-${randomUUID()}`,
        organizationName: "Synthetic integration test",
        memberships: [],
        legalEntities: [],
        farms: [],
        units: [],
        cycles: [],
        activities: [],
        materials: [],
        movements: [],
        erpJobs: [],
        audit: [],
        tasks: [],
        taskUpdates: [],
        photos: [],
        receipts: [],
      };
      let first = new PostgresFarmWorkspaceStore(
        { connectionString: url },
        state,
      );
      const second = new PostgresFarmWorkspaceStore(
        { connectionString: url },
        state,
      );
      try {
        const sql = await readFile(
          new URL(
            "../../migrations/0006_integrated_farming.sql",
            import.meta.url,
          ),
          "utf8",
        );
        await pool.query(sql);
        await pool.query(sql);
        await expect(
          first.transaction((workspace) => {
            workspace.organizationName = "Uncommitted";
            throw new Error("Abort test");
          }),
        ).rejects.toThrow("Abort test");
        await Promise.all(
          Array.from({ length: 12 }, (_, index) =>
            (index % 2 ? first : second).transaction((workspace) => {
              workspace.audit.push({
                id: randomUUID(),
                actorId: "synthetic",
                action: "test",
                resourceId: String(index),
                at: new Date().toISOString(),
              });
            }),
          ),
        );
        await first.dispose();
        first = new PostgresFarmWorkspaceStore(
          { connectionString: url },
          {
            ...state,
            organizationName: "Different bootstrap must not overwrite",
          },
        );
        const restored = await first.transaction((workspace) => workspace);
        expect(restored.audit).toHaveLength(12);
        expect(restored.organizationName).toBe(state.organizationName);
        const snapshot = JSON.stringify(restored);
        await pool.query(
          "DELETE FROM farm_workspaces WHERE organization_id = $1",
          [state.organizationId],
        );
        await pool.query(
          "INSERT INTO farm_workspaces (organization_id, state) VALUES ($1, $2::jsonb)",
          [state.organizationId, snapshot],
        );
        expect(
          (await second.transaction((workspace) => workspace)).audit,
        ).toEqual(restored.audit);
      } finally {
        await first.dispose();
        await second.dispose();
        await pool.query(
          "DELETE FROM farm_workspaces WHERE organization_id = $1",
          [state.organizationId],
        );
        await pool.end();
      }
    });
  },
);
