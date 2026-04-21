import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("migrations/0001_core_schema.sql");
await runProjectSqlFile("seeds/alerts-smoke.sql");
console.log("Applied migrations and loaded the AquaPulse alerts smoke seed dataset.");
