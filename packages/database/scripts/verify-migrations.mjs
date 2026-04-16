import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../migrations");
const manifestPath = path.join(migrationsDir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

for (const migration of manifest.migrations) {
  const filePath = path.join(migrationsDir, migration.file);
  await access(filePath);
}

console.log(
  `Verified ${manifest.migrations.length} migration file(s) for schema version ${manifest.schemaVersion}.`
);
