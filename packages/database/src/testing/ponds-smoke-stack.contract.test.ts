import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(databaseRoot, "../..");

describe("Local ponds smoke stack", () => {
  it("keeps compose reuse, migration, seed, and verifier assets wired for the local smoke flow", async () => {
    const composePath = path.join(repoRoot, "infra/local/alerts-smoke.compose.yaml");
    const seedPath = path.join(databaseRoot, "seeds/ponds-smoke.sql");
    const verifierPath = path.join(repoRoot, "scripts/verify-ponds-runtime.mjs");
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

    expect(seedSql).toContain("INSERT INTO ponds");
    expect(seedSql).toContain("'pond-1'");
    expect(seedSql).toContain("'pond-4'");
    expect(seedSql).toContain("'maintenance'");
    expect(seedSql).toContain("'inactive'");
    expect(seedSql).toContain("'tank'");
    expect(seedSql).toContain("'cage'");
    expect(seedSql).toContain("'farm-2'");

    expect(verifierScript).toContain("AQUAPULSE_PONDS_VERIFY_EXPECT_SEEDED_SMOKE");
    expect(verifierScript).toContain("pond-1");
    expect(verifierScript).toContain("exactly 4 seeded ponds");

    expect(databasePackageJson.scripts["db:migrations:apply"]).toBeDefined();
    expect(databasePackageJson.scripts["db:seed:ponds-smoke"]).toBeDefined();
    expect(databasePackageJson.scripts["db:prepare:ponds-smoke"]).toBeDefined();
    expect(rootPackageJson.scripts["ponds:smoke:db:up"]).toBeDefined();
    expect(rootPackageJson.scripts["ponds:smoke:db:prepare"]).toBeDefined();
    expect(rootPackageJson.scripts["ponds:verify-runtime"]).toBeDefined();
  });
});
