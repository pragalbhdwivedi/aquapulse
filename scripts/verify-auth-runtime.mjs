import {
  createVerifierRequestHeaders,
  deriveProtectedExpectation,
  readAuthRuntimeVerificationConfig
} from "./lib/auth-runtime-verifier.mjs";

const config = readAuthRuntimeVerificationConfig(process.env);

function logStep(message) {
  process.stdout.write(`${message}\n`);
}

async function readJsonResponse(url, init = {}) {
  const response = await fetch(url, init);
  const rawBody = await response.text();
  const body = rawBody ? JSON.parse(rawBody) : undefined;

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    body
  };
}

function ensureJsonEnvelope(result, label) {
  if (!result.body || typeof result.body !== "object") {
    throw new Error(`${label} did not return a JSON payload.`);
  }
}

async function verifyBackendHealth() {
  logStep(`Verifying backend health at ${config.backendBaseUrl}`);
  const result = await readJsonResponse(`${config.backendBaseUrl}/api/health`, {
    method: "GET",
    headers: createVerifierRequestHeaders(config)
  });
  ensureJsonEnvelope(result, "Backend health");

  if (!result.ok) {
    throw new Error(
      `GET ${config.backendBaseUrl}/api/health failed with ${result.status}: ${JSON.stringify(result.body)}`
    );
  }

  const runtime = result.body.runtime;
  if (!runtime?.auth?.effectiveMode) {
    throw new Error("Backend health payload is missing auth runtime diagnostics.");
  }

  if (
    config.expectedAuthMode !== "auto" &&
    runtime.auth.effectiveMode !== config.expectedAuthMode
  ) {
    throw new Error(
      `Expected backend auth mode ${config.expectedAuthMode}, received ${runtime.auth.effectiveMode}.`
    );
  }

  logStep(`Backend auth mode: ${runtime.auth.effectiveMode}`);
  logStep(`Backend auth verification: ${runtime.auth.verificationStatus}`);
  logStep(`Backend protected alerts slices enforced: lifecycle=${runtime.auth.protectedOperatorSliceEnforced ? "yes" : "no"}, triage=${runtime.auth.secondaryProtectedSliceEnforced ? "yes" : "no"}, bulk=${runtime.auth.tertiaryProtectedSliceEnforced ? "yes" : "no"}, saved_views=${runtime.auth.quaternaryProtectedSliceEnforced ? "yes" : "no"}`);

  return runtime;
}

async function verifyCurrentSession() {
  logStep(`Verifying current-session through ${config.webBaseUrl}`);
  const result = await readJsonResponse(`${config.webBaseUrl}/api/auth/session`, {
    method: "GET",
    headers: createVerifierRequestHeaders(config)
  });
  ensureJsonEnvelope(result, "Current session");

  if (!result.ok) {
    throw new Error(
      `GET ${config.webBaseUrl}/api/auth/session failed with ${result.status}: ${JSON.stringify(result.body)}`
    );
  }

  const session = result.body.data;
  if (!session?.effectiveMode || !session?.availabilityState) {
    throw new Error("Current-session payload is incomplete.");
  }

  logStep(`Current-session mode: ${session.effectiveMode}`);
  logStep(`Current-session availability: ${session.availabilityState}`);
  logStep(`Current-session auth source: ${session.authSource}`);
  logStep(`Current-session user: ${session.user?.displayName ?? session.user?.username ?? session.user?.id ?? "not resolved"}`);
  logStep(`Web proxy forwarded auth: ${result.headers.get("x-aquapulse-auth-forwarded") ?? "unknown"} (${result.headers.get("x-aquapulse-auth-forwarding-source") ?? "unknown"})`);

  return {
    session,
    forwardingHeader: result.headers.get("x-aquapulse-auth-forwarded") ?? "unknown",
    forwardingSource: result.headers.get("x-aquapulse-auth-forwarding-source") ?? "unknown"
  };
}

async function expectProtectedResponse({
  label,
  url,
  body,
  expectedOutcome
}) {
  const headers = createVerifierRequestHeaders(config, {
    "content-type": "application/json"
  });
  const result = await readJsonResponse(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  ensureJsonEnvelope(result, label);

  if (expectedOutcome === "success") {
    if (!result.ok) {
      throw new Error(
        `${label} expected success but received ${result.status}: ${JSON.stringify(result.body)}`
      );
    }

    logStep(`${label}: succeeded`);
    return result.body;
  }

  if (result.status !== 401 && result.status !== 403) {
    throw new Error(
      `${label} expected an auth failure but received ${result.status}: ${JSON.stringify(result.body)}`
    );
  }

  logStep(`${label}: rejected as expected with ${result.status}`);
  return result.body;
}

async function verifyProtectedSlices(backendRuntime, currentSession) {
  const expectedOutcome = deriveProtectedExpectation({
    effectiveAuthMode: backendRuntime.auth.effectiveMode,
    sessionAvailabilityState: currentSession.session.availabilityState
  });

  logStep(`Protected alerts expectation: ${expectedOutcome}`);

  if (!config.enableMutations && expectedOutcome === "success") {
    logStep(
      "Protected mutation checks were skipped. Set AQUAPULSE_AUTH_VERIFY_ENABLE_MUTATIONS=true to verify success-path lifecycle, triage, bulk, and saved-view mutation slices."
    );
    return;
  }

  const lifecycleAlertId =
    expectedOutcome === "success" ? config.alertId : "alert-auth-verifier-missing";
  const triageAlertId =
    expectedOutcome === "success" ? config.alertId : "alert-auth-verifier-missing";
  const bulkAlertIds =
    expectedOutcome === "success" ? [config.alertId] : ["alert-auth-verifier-missing"];
  const removeViewId =
    expectedOutcome === "success" ? null : "alert-view-auth-verifier-missing";

  await expectProtectedResponse({
    label: "Lifecycle slice",
    url: `${config.webBaseUrl}/api/alerts/${lifecycleAlertId}/acknowledge`,
    body: {
      note: "Auth runtime verification acknowledge"
    },
    expectedOutcome
  });

  await expectProtectedResponse({
    label: "Triage slice",
    url: `${config.webBaseUrl}/api/alerts/${triageAlertId}/assign`,
    body: {
      assignedTo: config.verificationOwner,
      note: "Auth runtime verification assign"
    },
    expectedOutcome
  });

  await expectProtectedResponse({
    label: "Bulk slice",
    url: `${config.webBaseUrl}/api/alerts/bulk/review-state`,
    body: {
      alertIds: bulkAlertIds,
      reviewState: "under_review",
      reviewLabel: "auth-runtime-verifier",
      note: "Auth runtime verification bulk review"
    },
    expectedOutcome
  });

  if (expectedOutcome === "success") {
    const savedViews = await expectProtectedResponse({
      label: "Saved-view create slice",
      url: `${config.webBaseUrl}/api/alerts/views`,
      body: {
        name: `Auth runtime verification ${Date.now()}`,
        presetId: "all_open",
        query: {
          page: 1,
          pageSize: 20,
          status: "open",
          sortBy: "updatedAt_desc"
        }
      },
      expectedOutcome
    });

    const createdView = savedViews?.data?.find?.((item) =>
      String(item?.name ?? "").startsWith("Auth runtime verification ")
    );
    if (!createdView?.id) {
      throw new Error("Saved-view create verification did not return the created view.");
    }

    await expectProtectedResponse({
      label: "Saved-view remove slice",
      url: `${config.webBaseUrl}/api/alerts/views/${createdView.id}/remove`,
      body: {},
      expectedOutcome
    });
  } else {
    await expectProtectedResponse({
      label: "Saved-view remove slice",
      url: `${config.webBaseUrl}/api/alerts/views/${removeViewId}/remove`,
      body: {},
      expectedOutcome
    });
  }
}

async function main() {
  logStep("Auth runtime verification started.");
  logStep(`Web base URL: ${config.webBaseUrl}`);
  logStep(`Backend base URL: ${config.backendBaseUrl}`);
  logStep(`Expected auth mode: ${config.expectedAuthMode}`);
  logStep(`Verifier bearer token: ${config.bearerToken ? "provided" : "not provided"}`);
  logStep(`Mutation checks enabled: ${config.enableMutations ? "yes" : "no"}`);

  const backendRuntime = await verifyBackendHealth();
  const currentSession = await verifyCurrentSession();

  await verifyProtectedSlices(backendRuntime, currentSession);

  logStep("Auth runtime verification completed successfully.");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
