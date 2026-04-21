const webBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_ALERTS_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
);
const backendBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_ALERTS_VERIFY_API_BASE_URL ??
    process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
    "http://localhost:4000"
);
const expectedBackendAdapter = normalizeExpectedBackendAdapter(
  process.env.AQUAPULSE_ALERTS_VERIFY_EXPECT_BACKEND_ADAPTER ?? "postgres"
);
const alertId = (process.env.AQUAPULSE_ALERTS_VERIFY_ALERT_ID ?? "alert-1").trim() || "alert-1";
const verificationOwner =
  (process.env.AQUAPULSE_ALERTS_VERIFY_OWNER ?? "operator-verification").trim() ||
  "operator-verification";
const enableMutations = parseBoolean(process.env.AQUAPULSE_ALERTS_VERIFY_ENABLE_MUTATIONS);
const expectSeededSmoke = parseBoolean(process.env.AQUAPULSE_ALERTS_VERIFY_EXPECT_SEEDED_SMOKE);
const notePrefix = "Runtime verification";

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

async function verifyReads() {
  logStep(`Verifying backend diagnostics at ${backendBaseUrl}`);
  const backendRuntime = await readJsonResponse(`${backendBaseUrl}/api/diagnostics/runtime`);

  if (backendRuntime.alerts.effectiveAdapter !== expectedBackendAdapter) {
    throw new Error(
      `Expected backend alerts adapter ${expectedBackendAdapter}, received ${backendRuntime.alerts.effectiveAdapter}.`
    );
  }

  logStep(`Backend alerts adapter: ${backendRuntime.alerts.effectiveAdapter}`);
  logStep(`Backend alerts cutover active: ${backendRuntime.alerts.cutoverActive ? "yes" : "no"}`);

  logStep(`Verifying alerts workbench reads through ${webBaseUrl}`);
  const list = await readJsonResponse(
    `${webBaseUrl}/api/alerts?page=1&pageSize=20&sortBy=updatedAt_desc`
  );
  const summary = await readJsonResponse(`${webBaseUrl}/api/alerts/summary?page=1&pageSize=20`);
  const detail = await readJsonResponse(`${webBaseUrl}/api/alerts/${alertId}`);
  const savedViews = await readJsonResponse(`${webBaseUrl}/api/alerts/views`);
  const explanation = await readJsonResponse(`${webBaseUrl}/api/ai/alerts/explain`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      alertId,
      includeRecommendations: true
    })
  });

  if (!Array.isArray(list?.data?.items)) {
    throw new Error("Alerts list response shape is invalid.");
  }

  if (typeof summary?.data?.totalAlerts !== "number") {
    throw new Error("Alerts summary response shape is invalid.");
  }

  if (detail?.data?.id !== alertId) {
    throw new Error(`Alert detail verification expected ${alertId}, received ${detail?.data?.id}.`);
  }

  if (!Array.isArray(savedViews?.data)) {
    throw new Error("Saved views response shape is invalid.");
  }

  if (explanation?.data?.metadata?.advisoryOnly !== true) {
    throw new Error("AI explanation verification expected advisory-only semantics.");
  }

  if (expectSeededSmoke) {
    verifySeededSmokeExpectations({
      list,
      summary,
      detail,
      savedViews
    });
  }

  logStep(`Reads verified: ${list.data.items.length} alerts, ${summary.data.totalAlerts} total alerts.`);
  logStep(`AI explanations mode: ${explanation.data.metadata.mode}`);
}

function verifySeededSmokeExpectations({ list, summary, detail, savedViews }) {
  const ids = list.data.items.map((item) => item.id);

  if (!ids.includes("alert-1")) {
    throw new Error("Seeded smoke verification expected alert-1 in the alerts list.");
  }

  if (summary.data.totalAlerts !== 4) {
    throw new Error(`Seeded smoke verification expected 4 alerts, received ${summary.data.totalAlerts}.`);
  }

  if (
    summary.data.statusCounts.open !== 2 ||
    summary.data.statusCounts.acknowledged !== 1 ||
    summary.data.statusCounts.resolved !== 1
  ) {
    throw new Error("Seeded smoke verification found unexpected status counts.");
  }

  if (
    summary.data.assignmentCounts.assigned !== 3 ||
    summary.data.assignmentCounts.unassigned !== 1
  ) {
    throw new Error("Seeded smoke verification found unexpected assignment counts.");
  }

  if (
    summary.data.reviewStateCounts.unreviewed !== 1 ||
    summary.data.reviewStateCounts.underReview !== 1 ||
    summary.data.reviewStateCounts.reviewed !== 1 ||
    summary.data.reviewStateCounts.deferred !== 1
  ) {
    throw new Error("Seeded smoke verification found unexpected review-state counts.");
  }

  if (detail.data.id !== "alert-1" || detail.data.status !== "open") {
    throw new Error("Seeded smoke verification expected alert-1 detail to remain open.");
  }

  if (!savedViews.data.some((item) => item.id === "alert-view-1" && item.name === "Open queue")) {
    throw new Error("Seeded smoke verification expected the default saved view to be present.");
  }

  logStep("Seeded smoke dataset assertions passed.");
}

async function verifyMutations() {
  const savedViewName = `Runtime verification ${Date.now()}`;

  logStep(`Running bounded alert mutations for ${alertId}`);
  await readJsonResponse(`${webBaseUrl}/api/alerts/${alertId}/acknowledge`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      note: `${notePrefix}: acknowledge`
    })
  });
  await readJsonResponse(`${webBaseUrl}/api/alerts/${alertId}/assign`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      assignedTo: verificationOwner,
      note: `${notePrefix}: assign`
    })
  });
  await readJsonResponse(`${webBaseUrl}/api/alerts/${alertId}/review-state`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      reviewState: "under_review",
      reviewLabel: "runtime-verification",
      note: `${notePrefix}: review`
    })
  });
  await readJsonResponse(`${webBaseUrl}/api/alerts/bulk/resolve`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      alertIds: [alertId],
      note: `${notePrefix}: bulk resolve`
    })
  });

  const savedViews = await readJsonResponse(`${webBaseUrl}/api/alerts/views`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      name: savedViewName,
      presetId: "all_open",
      query: {
        page: 1,
        pageSize: 20,
        status: "open",
        sortBy: "updatedAt_desc"
      }
    })
  });

  const createdView = savedViews?.data?.find?.((item) => item.name === savedViewName);
  if (!createdView?.id) {
    throw new Error("Saved view verification could not find the newly created view.");
  }

  await readJsonResponse(`${webBaseUrl}/api/alerts/views/${createdView.id}/remove`, {
    method: "POST"
  });

  logStep("Lifecycle, triage, bulk action, and saved-view checks passed.");
}

async function main() {
  logStep("Alerts runtime verification started.");
  logStep(`Web base URL: ${webBaseUrl}`);
  logStep(`Backend base URL: ${backendBaseUrl}`);
  logStep(`Expected backend adapter: ${expectedBackendAdapter}`);
  logStep(`Mutations enabled: ${enableMutations ? "yes" : "no"}`);
  logStep(`Seeded smoke assertions: ${expectSeededSmoke ? "enabled" : "disabled"}`);

  await verifyReads();

  if (enableMutations) {
    await verifyMutations();
  } else {
    logStep(
      "Read-only verification completed. Set AQUAPULSE_ALERTS_VERIFY_ENABLE_MUTATIONS=true to exercise lifecycle, triage, bulk actions, and saved views against the running backend."
    );
  }

  logStep("Alerts runtime verification completed successfully.");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
