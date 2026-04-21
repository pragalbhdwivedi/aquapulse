const webBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_WATER_QUALITY_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
);
const backendBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_WATER_QUALITY_VERIFY_API_BASE_URL ??
    process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
    "http://localhost:4000"
);
const expectedBackendAdapter = normalizeExpectedBackendAdapter(
  process.env.AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_BACKEND_ADAPTER ?? "postgres"
);
const pondId =
  (process.env.AQUAPULSE_WATER_QUALITY_VERIFY_POND_ID ?? "pond-1").trim() || "pond-1";
const existingReadingId =
  (process.env.AQUAPULSE_WATER_QUALITY_VERIFY_READING_ID ?? "wq-smoke-pond-1-latest").trim() ||
  "wq-smoke-pond-1-latest";
const expectSeededSmoke = parseBoolean(
  process.env.AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_SEEDED_SMOKE
);

function parseBoolean(value) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim();
  const parsed = new URL(trimmed);
  return parsed.toString().replace(/\/+$/, "");
}

function normalizeExpectedBackendAdapter(value) {
  return value === "in-memory" ? "in-memory" : "postgres";
}

function logStep(message) {
  process.stdout.write(`${message}\n`);
}

async function readJsonResponse(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init.headers ?? {})
    }
  });

  const rawBody = await response.text();
  const body = rawBody ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${url} failed with ${response.status}: ${JSON.stringify(body)}`
    );
  }

  return body;
}

function verifySeededSmokeExpectations({ list, seededDetail }) {
  if (!Array.isArray(list.data.items) || list.data.items.length !== 3) {
    throw new Error(
      `Seeded smoke verification expected exactly 3 pond-scoped readings, received ${list?.data?.items?.length ?? "unknown"}.`
    );
  }

  if (list.data.items[0]?.id !== existingReadingId) {
    throw new Error(
      `Seeded smoke verification expected the latest pond reading ${existingReadingId}, received ${list.data.items[0]?.id}.`
    );
  }

  if (seededDetail.data.pondId !== pondId) {
    throw new Error(
      `Seeded smoke verification expected detail pond ${pondId}, received ${seededDetail.data.pondId}.`
    );
  }

  if (seededDetail.data.id !== existingReadingId) {
    throw new Error(
      `Seeded smoke verification expected detail id ${existingReadingId}, received ${seededDetail.data.id}.`
    );
  }

  if (seededDetail.data.temperatureC !== 28.4 || seededDetail.data.ph !== 7.6) {
    throw new Error("Seeded smoke verification found unexpected latest water-quality values.");
  }

  logStep("Seeded smoke dataset assertions passed.");
}

async function main() {
  logStep("Water-quality runtime verification started.");
  logStep(`Web base URL: ${webBaseUrl}`);
  logStep(`Backend base URL: ${backendBaseUrl}`);
  logStep(`Expected backend adapter: ${expectedBackendAdapter}`);
  logStep(`Pond ID: ${pondId}`);

  logStep(`Verifying backend diagnostics at ${backendBaseUrl}`);
  const backendRuntime = await readJsonResponse(`${backendBaseUrl}/api/diagnostics/runtime`);

  if (backendRuntime.waterQuality.effectiveAdapter !== expectedBackendAdapter) {
    throw new Error(
      `Expected backend water-quality adapter ${expectedBackendAdapter}, received ${backendRuntime.waterQuality.effectiveAdapter}.`
    );
  }

  logStep(`Backend water-quality adapter: ${backendRuntime.waterQuality.effectiveAdapter}`);
  logStep(
    `Backend water-quality cutover active: ${backendRuntime.waterQuality.cutoverActive ? "yes" : "no"}`
  );

  logStep(`Verifying water-quality reads and create through ${webBaseUrl}`);
  const list = await readJsonResponse(
    `${webBaseUrl}/api/water-quality?page=1&pageSize=20&pondId=${encodeURIComponent(pondId)}`
  );
  const seededDetail = await readJsonResponse(
    `${webBaseUrl}/api/water-quality/${encodeURIComponent(existingReadingId)}`
  );
  const createdAt = new Date().toISOString();
  const created = await readJsonResponse(`${webBaseUrl}/api/water-quality`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      pondId,
      recordedAt: createdAt,
      temperatureC: 28.6,
      ph: 7.5
    })
  });
  const detail = await readJsonResponse(
    `${webBaseUrl}/api/water-quality/${encodeURIComponent(created?.data?.id ?? existingReadingId)}`
  );

  if (!Array.isArray(list?.data?.items)) {
    throw new Error("Water-quality list response shape is invalid.");
  }

  if (created?.data?.pondId !== pondId) {
    throw new Error(
      `Water-quality create verification expected pond ${pondId}, received ${created?.data?.pondId}.`
    );
  }

  if (!detail?.data?.id) {
    throw new Error("Water-quality detail response shape is invalid.");
  }

  if (expectSeededSmoke) {
    verifySeededSmokeExpectations({ list, seededDetail });
  }

  logStep(
    `Water-quality verification completed: ${list.data.items.length} listed reading(s), created ${created.data.id}, detail ${detail.data.id}.`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
