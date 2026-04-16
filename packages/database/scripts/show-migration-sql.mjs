import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requestedId = process.argv[2];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../migrations");
const manifestPath = path.join(migrationsDir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const migration =
  manifest.migrations.find((item) => item.id === requestedId) ?? manifest.migrations.at(-1);

if (!migration) {
  console.error("No migrations found.");
  process.exit(1);
}

const sql = await readFile(path.join(migrationsDir, migration.file), "utf8");
console.log(`-- ${migration.id} ${migration.name}`);
console.log(sql);
