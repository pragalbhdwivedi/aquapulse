const webBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_TASKS_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
);
const backendBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_TASKS_VERIFY_API_BASE_URL ??
    process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
    "http://localhost:4000"
);
const expectedBackendAdapter = normalizeExpectedBackendAdapter(
  process.env.AQUAPULSE_TASKS_VERIFY_EXPECT_BACKEND_ADAPTER ?? "postgres"
);
const pondId =
  (process.env.AQUAPULSE_TASKS_VERIFY_POND_ID ?? "pond-1").trim() || "pond-1";
const existingTaskId =
  (process.env.AQUAPULSE_TASKS_VERIFY_TASK_ID ?? "task-1").trim() || "task-1";

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

async function main() {
  logStep("Tasks runtime verification started.");
  logStep(`Web base URL: ${webBaseUrl}`);
  logStep(`Backend base URL: ${backendBaseUrl}`);
  logStep(`Expected backend adapter: ${expectedBackendAdapter}`);
  logStep(`Pond ID: ${pondId}`);

  logStep(`Verifying backend diagnostics at ${backendBaseUrl}`);
  const backendRuntime = await readJsonResponse(`${backendBaseUrl}/api/diagnostics/runtime`);

  if (backendRuntime.tasks?.effectiveAdapter !== expectedBackendAdapter) {
    throw new Error(
      `Expected backend tasks adapter ${expectedBackendAdapter}, received ${backendRuntime.tasks?.effectiveAdapter ?? "unknown"}.`
    );
  }

  logStep(`Backend tasks adapter: ${backendRuntime.tasks.effectiveAdapter}`);
  logStep(`Backend tasks cutover active: ${backendRuntime.tasks.cutoverActive ? "yes" : "no"}`);

  logStep(`Verifying tasks reads and writes through ${webBaseUrl}`);
  const list = await readJsonResponse(
    `${webBaseUrl}/api/tasks?page=1&pageSize=20&pondId=${encodeURIComponent(pondId)}`
  );
  const seededDetail = await readJsonResponse(
    `${webBaseUrl}/api/tasks/${encodeURIComponent(existingTaskId)}`
  );
  const created = await readJsonResponse(`${webBaseUrl}/api/tasks`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      title: `Verifier task ${Date.now()}`,
      assigneeId: "user-verify",
      pondId
    })
  });
  const updated = await readJsonResponse(
    `${webBaseUrl}/api/tasks/${encodeURIComponent(created?.data?.id ?? existingTaskId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "Verifier task updated",
        status: "done",
        assigneeId: "user-verify"
      })
    }
  );
  const detail = await readJsonResponse(
    `${webBaseUrl}/api/tasks/${encodeURIComponent(created?.data?.id ?? existingTaskId)}`
  );

  if (!Array.isArray(list?.data?.items)) {
    throw new Error("Tasks list response shape is invalid.");
  }

  if (!seededDetail?.data?.id) {
    throw new Error("Tasks seeded detail response shape is invalid.");
  }

  if (created?.data?.pondId !== pondId) {
    throw new Error(
      `Tasks create verification expected pond ${pondId}, received ${created?.data?.pondId}.`
    );
  }

  if (updated?.data?.status !== "done") {
    throw new Error(
      `Tasks update verification expected status done, received ${updated?.data?.status}.`
    );
  }

  if (detail?.data?.id !== created?.data?.id) {
    throw new Error("Tasks detail verification did not return the created task.");
  }

  logStep(
    `Tasks verification completed: ${list.data.items.length} listed task(s), created ${created.data.id}, updated ${updated.data.id}, detail ${detail.data.id}.`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
