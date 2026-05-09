import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("migrations/0001_core_schema.sql");
await runProjectSqlFile("seeds/water-quality-smoke.sql");
console.log("Applied migrations and loaded the AquaPulse water-quality smoke seed dataset.");
