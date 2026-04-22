import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("migrations/0001_core_schema.sql");
await runProjectSqlFile("seeds/pond-linked-smoke.sql");
