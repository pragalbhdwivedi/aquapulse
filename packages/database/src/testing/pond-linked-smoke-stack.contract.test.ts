import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(databaseRoot, "../..");

describe("Pond-linked cross-domain smoke stack", () => {
  it("keeps the shared pond-linked seed and verifier assets wired for the local smoke flow", async () => {
    const seedPath = path.join(databaseRoot, "seeds/pond-linked-smoke.sql");
    const verifierPath = path.join(repoRoot, "scripts/verify-pond-linked-smoke.mjs");
    const helperPath = path.join(repoRoot, "scripts/lib/pond-linked-smoke-verifier.mjs");
    const databasePackageJsonPath = path.join(databaseRoot, "package.json");
    const rootPackageJsonPath = path.join(repoRoot, "package.json");

    await access(seedPath);
    await access(verifierPath);
    await access(helperPath);

    const [seedSql, verifierScript, helperScript, databasePackageJsonRaw, rootPackageJsonRaw] =
      await Promise.all([
        readFile(seedPath, "utf8"),
        readFile(verifierPath, "utf8"),
        readFile(helperPath, "utf8"),
        readFile(databasePackageJsonPath, "utf8"),
        readFile(rootPackageJsonPath, "utf8")
      ]);
    const databasePackageJson = JSON.parse(databasePackageJsonRaw);
    const rootPackageJson = JSON.parse(rootPackageJsonRaw);

    expect(seedSql).toContain("INSERT INTO ponds");
    expect(seedSql).toContain("INSERT INTO water_quality");
    expect(seedSql).toContain("INSERT INTO feed_entries");
    expect(seedSql).toContain("INSERT INTO tasks");
    expect(seedSql).toContain("INSERT INTO alerts");
    expect(seedSql).toContain("'North Nursery'");
    expect(seedSql).toContain("'South Growout'");
    expect(seedSql).toContain("'feed-1'");
    expect(seedSql).toContain("'task-1'");
    expect(seedSql).toContain("'alert-1'");

    expect(verifierScript).toContain("/api/ponds");
    expect(verifierScript).toContain("/api/water-quality");
    expect(verifierScript).toContain("/api/feed");
    expect(verifierScript).toContain("/api/tasks");
    expect(verifierScript).toContain("/api/alerts");

    expect(helperScript).toContain("readPondLinkedSmokeVerificationConfig");
    expect(helperScript).toContain("collectReferencedPondIds");
    expect(helperScript).toContain("AQUAPULSE_POND_LINKED_VERIFY_EXPECT_SEEDED_SMOKE");

    expect(databasePackageJson.scripts["db:prepare:pond-linked-smoke"]).toBeDefined();
    expect(rootPackageJson.scripts["ponds:smoke:db:prepare:linked"]).toBeDefined();
    expect(rootPackageJson.scripts["ponds:verify-linked-smoke"]).toBeDefined();
  });
});
