import {
  createAlertsLiveUpdatesVerifierHeaders,
  deriveAlertsLiveUpdatesWebSocketUrl,
  readAlertsLiveUpdatesVerificationConfig
} from "./lib/alerts-live-updates-runtime-verifier.mjs";

const config = readAlertsLiveUpdatesVerificationConfig(process.env);

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
    body
  };
}

function ensureJsonPayload(result, label) {
  if (!result.body || typeof result.body !== "object") {
    throw new Error(`${label} did not return a JSON payload.`);
  }
}

function ensureBootstrapPayload(result) {
  ensureJsonPayload(result, "Alerts live-updates bootstrap");

  if (result.body?.ok !== true || !result.body?.data || typeof result.body.data !== "object") {
    throw new Error("Alerts live-updates bootstrap did not return a bounded success envelope.");
  }

  return result.body.data;
}

function waitForWebSocketOpen(socket, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timed out waiting for the alerts websocket to connect after ${timeoutMs}ms.`));
    }, timeoutMs);

    socket.addEventListener("open", () => {
      clearTimeout(timeoutId);
      resolve(undefined);
    });

    socket.addEventListener("error", () => {
      clearTimeout(timeoutId);
      reject(new Error("The alerts websocket reported a connection error."));
    });
  });
}

function waitForLiveEvent(socket, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Timed out waiting for a live alerts event after ${timeoutMs}ms. The gateway may be idle, unreachable, or the triggering mutation did not emit an event.`
        )
      );
    }, timeoutMs);

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(typeof event.data === "string" ? event.data : String(event.data));
        if (payload?.source === "alerts_live_updates" && payload?.kind === "subscription_status") {
          return;
        }
        if (payload?.source !== "alerts" || typeof payload?.eventType !== "string") {
          clearTimeout(timeoutId);
          reject(new Error("Received a websocket message, but it was not a bounded alerts live-update payload."));
          return;
        }

        clearTimeout(timeoutId);
        resolve(payload);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(
          new Error(
            `Received a websocket message, but it could not be parsed as JSON: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });

    socket.addEventListener("error", () => {
      clearTimeout(timeoutId);
      reject(new Error("The alerts websocket errored while waiting for a live event."));
    });
  });
}

function waitForSubscriptionStatus(socket, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Timed out waiting for an alerts websocket subscription status after ${timeoutMs}ms.`
        )
      );
    }, timeoutMs);

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(typeof event.data === "string" ? event.data : String(event.data));
        if (payload?.source === "alerts_live_updates" && payload?.kind === "subscription_status") {
          clearTimeout(timeoutId);
          resolve(payload);
        }
      } catch {
        // Ignore non-JSON messages here and let the live-event waiter report a clearer failure later.
      }
    });

    socket.addEventListener("error", () => {
      clearTimeout(timeoutId);
      reject(new Error("The alerts websocket errored while waiting for a subscription status."));
    });
  });
}

async function verifyBackendRuntime() {
  logStep(`Verifying backend runtime diagnostics at ${config.backendBaseUrl}`);
  const result = await readJsonResponse(`${config.backendBaseUrl}/api/diagnostics/runtime`, {
    method: "GET",
    headers: createAlertsLiveUpdatesVerifierHeaders(config)
  });
  ensureJsonPayload(result, "Backend runtime diagnostics");

  if (!result.ok) {
    throw new Error(
      `GET ${config.backendBaseUrl}/api/diagnostics/runtime failed with ${result.status}: ${JSON.stringify(result.body)}`
    );
  }

  const runtime = result.body;
  if (!runtime?.alertsLiveUpdates?.gatewayPath) {
    throw new Error("Backend runtime diagnostics are missing alerts live-update gateway details.");
  }

  logStep(`Backend alerts adapter: ${runtime.alerts?.effectiveAdapter ?? "unknown"}`);
  logStep(
    `Backend alerts live gateway: ${runtime.alertsLiveUpdates.enabled ? "enabled" : "disabled"} / attached=${runtime.alertsLiveUpdates.gatewayAttached ? "yes" : "no"} / connections=${runtime.alertsLiveUpdates.activeConnections}`
  );
  logStep(`Backend alerts live subscription policy: ${runtime.alertsLiveUpdates.subscriptionPolicy}`);

  if (config.expectEnabled && runtime.alertsLiveUpdates.enabled !== true) {
    throw new Error(
      "Alerts live updates are disabled in the running backend. Enable AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES before running this verifier."
    );
  }

  if (
    runtime.alertsLiveUpdates.subscriptionPolicy === "authenticated_operator_required" &&
    !config.bearerToken
  ) {
    throw new Error(
      "Alerts live updates are auth-guarded in the running backend. Provide AQUAPULSE_ALERTS_LIVE_VERIFY_BEARER_TOKEN or AQUAPULSE_WEB_AUTH_BEARER_TOKEN for the bounded verifier."
    );
  }

  return runtime;
}

async function triggerRepresentativeMutation() {
  const mutationUrl = `${config.webBaseUrl}/api/alerts/${config.alertId}/${config.mutationPath}`;
  logStep(`Triggering representative alerts mutation through ${mutationUrl}`);
  const result = await readJsonResponse(mutationUrl, {
    method: "POST",
    headers: createAlertsLiveUpdatesVerifierHeaders(config, {
      "content-type": "application/json"
    }),
    body: JSON.stringify(config.mutationBody)
  });
  ensureJsonPayload(result, "Alerts live-update trigger mutation");

  if (!result.ok) {
    throw new Error(
      `POST ${mutationUrl} failed with ${result.status}: ${JSON.stringify(result.body)}`
    );
  }
}

async function main() {
  logStep("Alerts live-update verification started.");
  logStep(`Web base URL: ${config.webBaseUrl}`);
  logStep(`Backend base URL: ${config.backendBaseUrl}`);
  logStep(`Verifier bearer token: ${config.bearerToken ? "provided" : "not provided"}`);

  const runtime = await verifyBackendRuntime();
  const shouldUseBootstrap =
    config.subscriptionMode === "local_proxy_bootstrap" ||
    (config.subscriptionMode === "auto" && !config.webSocketUrl);
  let webSocketUrl;

  if (shouldUseBootstrap) {
    logStep(`Resolving websocket target through bootstrap route: ${config.bootstrapEndpoint}`);
    const bootstrapResult = await readJsonResponse(config.bootstrapEndpoint, {
      method: "GET",
      headers: createAlertsLiveUpdatesVerifierHeaders(config)
    });
    const bootstrap = ensureBootstrapPayload(bootstrapResult);

    logStep(
      `Bootstrap subscription transport: ${bootstrap.subscriptionTransport} / auth state: ${bootstrap.subscriptionAuthState} / forwarded auth: ${bootstrap.forwardedAuthPresent ? "present" : "absent"}`
    );

    if (!bootstrapResult.ok) {
      throw new Error(
        `GET ${config.bootstrapEndpoint} failed with ${bootstrapResult.status}: ${JSON.stringify(bootstrapResult.body)}`
      );
    }

    if (!bootstrap.webSocketUrl) {
      throw new Error(
        `Bootstrap route did not return a websocket target. Current state: ${bootstrap.subscriptionAuthState}.`
      );
    }

    webSocketUrl = bootstrap.webSocketUrl;
  } else {
    webSocketUrl = deriveAlertsLiveUpdatesWebSocketUrl({
      backendBaseUrl: config.backendBaseUrl,
      gatewayPath: runtime.alertsLiveUpdates.gatewayPath,
      explicitWebSocketUrl: config.webSocketUrl,
      bearerToken: config.bearerToken
    });
  }

  logStep(`Connecting to websocket target: ${webSocketUrl}`);
  const socket = new WebSocket(webSocketUrl);

  try {
    await waitForWebSocketOpen(socket, config.timeoutMs);
    logStep("Alerts websocket connection: active");
    const subscriptionStatus = await waitForSubscriptionStatus(socket, config.timeoutMs);
    logStep(`Alerts websocket subscription auth state: ${subscriptionStatus.subscriptionAuthState}`);

    const eventPromise = waitForLiveEvent(socket, config.timeoutMs);
    await triggerRepresentativeMutation();
    const event = await eventPromise;

    logStep(`Received alerts live event: ${event.eventType}`);
    logStep(`Live event timestamp: ${event.timestamp}`);
    logStep("Alerts live-update verification completed successfully.");
  } finally {
    socket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
