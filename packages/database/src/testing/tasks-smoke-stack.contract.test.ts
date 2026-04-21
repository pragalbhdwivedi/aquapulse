import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(databaseRoot, "../..");

describe("Local tasks smoke stack", () => {
  it("keeps compose reuse, migration, seed, and verifier assets wired for the local smoke flow", async () => {
    const composePath = path.join(repoRoot, "infra/local/alerts-smoke.compose.yaml");
    const seedPath = path.join(databaseRoot, "seeds/tasks-smoke.sql");
    const verifierPath = path.join(repoRoot, "scripts/verify-tasks-runtime.mjs");
    const databasePackageJsonPath = path.join(databaseRoot, "package.json");
    const rootPackageJsonPath = path.join(repoRoot, "package.json");

    await access(composePath);
    await access(seedPath);
    await access(verifierPath);

    const [composeYaml, seedSql, verifierScript, databasePackageJsonRaw, rootPackageJsonRaw] =
      await Promise.all([
        readFile(composePath, "utf8"),
        readFile(seedPath, "utf8"),
        readFile(verifierPath, "utf8"),
        readFile(databasePackageJsonPath, "utf8"),
        readFile(rootPackageJsonPath, "utf8")
      ]);
    const databasePackageJson = JSON.parse(databasePackageJsonRaw);
    const rootPackageJson = JSON.parse(rootPackageJsonRaw);

    expect(composeYaml).toContain("postgres:16-alpine");
    expect(composeYaml).toContain("54329:5432");

    expect(seedSql).toContain("INSERT INTO tasks");
    expect(seedSql).toContain("'task-1'");
    expect(seedSql).toContain("'task-4'");
    expect(seedSql).toContain("'in_progress'");
    expect(seedSql).toContain("'cancelled'");
    expect(seedSql).toContain("'pond-2'");
    expect(seedSql).toContain("'user-2'");

    expect(verifierScript).toContain("AQUAPULSE_TASKS_VERIFY_EXPECT_SEEDED_SMOKE");
    expect(verifierScript).toContain("task-1");
    expect(verifierScript).toContain("exactly 3 pond-scoped tasks");

    expect(databasePackageJson.scripts["db:migrations:apply"]).toBeDefined();
    expect(databasePackageJson.scripts["db:seed:tasks-smoke"]).toBeDefined();
    expect(databasePackageJson.scripts["db:prepare:tasks-smoke"]).toBeDefined();
    expect(rootPackageJson.scripts["tasks:smoke:db:up"]).toBeDefined();
    expect(rootPackageJson.scripts["tasks:smoke:db:prepare"]).toBeDefined();
    expect(rootPackageJson.scripts["tasks:verify-runtime"]).toBeDefined();
  });
});
