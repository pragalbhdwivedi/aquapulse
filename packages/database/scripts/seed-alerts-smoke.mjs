import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("seeds/alerts-smoke.sql");
console.log("Loaded the AquaPulse alerts smoke seed dataset.");
