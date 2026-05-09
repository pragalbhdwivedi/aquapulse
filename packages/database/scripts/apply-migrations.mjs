import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("migrations/0001_core_schema.sql");
console.log("Applied AquaPulse database migrations to the configured local database.");
