import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(databaseRoot, "../..");

describe("Local water-quality smoke stack", () => {
  it("keeps compose reuse, migration, seed, and verifier assets wired for the local smoke flow", async () => {
    const composePath = path.join(repoRoot, "infra/local/alerts-smoke.compose.yaml");
    const seedPath = path.join(databaseRoot, "seeds/water-quality-smoke.sql");
    const verifierPath = path.join(repoRoot, "scripts/verify-water-quality-runtime.mjs");
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

    expect(seedSql).toContain("INSERT INTO water_quality");
    expect(seedSql).toContain("'wq-smoke-pond-1-latest'");
    expect(seedSql).toContain("'wq-smoke-pond-2-breach'");
    expect(seedSql).toContain("'wq-smoke-pond-3-missing-ph'");
    expect(seedSql).toContain("'pond-3'");

    expect(verifierScript).toContain("AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_SEEDED_SMOKE");
    expect(verifierScript).toContain("wq-smoke-pond-1-latest");
    expect(verifierScript).toContain("exactly 3 pond-scoped readings");

    expect(databasePackageJson.scripts["db:migrations:apply"]).toBeDefined();
    expect(databasePackageJson.scripts["db:seed:water-quality-smoke"]).toBeDefined();
    expect(databasePackageJson.scripts["db:prepare:water-quality-smoke"]).toBeDefined();
    expect(rootPackageJson.scripts["water-quality:smoke:db:up"]).toBeDefined();
    expect(rootPackageJson.scripts["water-quality:smoke:db:prepare"]).toBeDefined();
    expect(rootPackageJson.scripts["water-quality:verify-runtime"]).toBeDefined();
  });
});
