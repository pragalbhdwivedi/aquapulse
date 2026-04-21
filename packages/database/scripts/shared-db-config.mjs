import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readSmokeDatabaseConfig(env = process.env) {
  const sslMode = env.AQUAPULSE_ALERTS_SMOKE_DB_SSL_MODE ?? env.DATABASE_SSL_MODE ?? "disable";

  return {
    host: env.AQUAPULSE_ALERTS_SMOKE_DB_HOST ?? env.DATABASE_HOST ?? "localhost",
    port: parseNumber(env.AQUAPULSE_ALERTS_SMOKE_DB_PORT ?? env.DATABASE_PORT, 54329),
    database: env.AQUAPULSE_ALERTS_SMOKE_DB_NAME ?? env.DATABASE_NAME ?? "aquapulse",
    user: env.AQUAPULSE_ALERTS_SMOKE_DB_USER ?? env.DATABASE_USER ?? "aquapulse",
    password:
      env.AQUAPULSE_ALERTS_SMOKE_DB_PASSWORD ?? env.DATABASE_PASSWORD ?? "change-me",
    ssl:
      sslMode === "require"
        ? {
            rejectUnauthorized: false
          }
        : undefined
  };
}

export async function createSmokeDatabaseClient(env = process.env) {
  const client = new Client(readSmokeDatabaseConfig(env));
  await client.connect();
  return client;
}

export function resolveProjectPath(relativePath) {
  return path.resolve(__dirname, "..", relativePath);
}

export async function readProjectFile(relativePath) {
  return readFile(resolveProjectPath(relativePath), "utf8");
}

export async function runSqlText(sql, env = process.env) {
  const client = await createSmokeDatabaseClient(env);

  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

export async function runProjectSqlFile(relativePath, env = process.env) {
  const sql = await readProjectFile(relativePath);
  await runSqlText(sql, env);
}
