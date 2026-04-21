import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(databaseRoot, "../..");

describe("Local alerts smoke stack", () => {
  it("keeps compose, migration, and seed assets wired for the local smoke flow", async () => {
    const composePath = path.join(repoRoot, "infra/local/alerts-smoke.compose.yaml");
    const seedPath = path.join(databaseRoot, "seeds/alerts-smoke.sql");
    const databasePackageJsonPath = path.join(databaseRoot, "package.json");
    const rootPackageJsonPath = path.join(repoRoot, "package.json");

    await access(composePath);
    await access(seedPath);

    const [composeYaml, seedSql, databasePackageJsonRaw, rootPackageJsonRaw] = await Promise.all([
      readFile(composePath, "utf8"),
      readFile(seedPath, "utf8"),
      readFile(databasePackageJsonPath, "utf8"),
      readFile(rootPackageJsonPath, "utf8")
    ]);
    const databasePackageJson = JSON.parse(databasePackageJsonRaw);
    const rootPackageJson = JSON.parse(rootPackageJsonRaw);

    expect(composeYaml).toContain("postgres:16-alpine");
    expect(composeYaml).toContain("54329:5432");

    expect(seedSql).toContain("INSERT INTO alerts");
    expect(seedSql).toContain("'alert-1'");
    expect(seedSql).toContain("'acknowledged'");
    expect(seedSql).toContain("'resolved'");
    expect(seedSql).toContain("'under_review'");
    expect(seedSql).toContain("'deferred'");
    expect(seedSql).toContain("'alert-view-1'");

    expect(databasePackageJson.scripts["db:migrations:apply"]).toBeDefined();
    expect(databasePackageJson.scripts["db:seed:alerts-smoke"]).toBeDefined();
    expect(databasePackageJson.scripts["db:prepare:alerts-smoke"]).toBeDefined();
    expect(rootPackageJson.scripts["alerts:smoke:db:up"]).toBeDefined();
    expect(rootPackageJson.scripts["alerts:smoke:db:prepare"]).toBeDefined();
  });
});
