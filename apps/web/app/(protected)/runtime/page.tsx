import {
  probeBackendRuntimeDiagnostics,
  readRuntimeProbeConfig
} from "@web/features/runtime-diagnostics";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { PageShell } from "../_components/page-shell";
import { RuntimeDiagnosticsCard } from "../_components/runtime-diagnostics-card";

export default async function RuntimePage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const backendProbe = await probeBackendRuntimeDiagnostics(
    readRuntimeProbeConfig({
      AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES: process.env.AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES,
      NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES:
        process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES,
      AQUAPULSE_WEB_RUNTIME_PROBE_TIMEOUT_MS: process.env.AQUAPULSE_WEB_RUNTIME_PROBE_TIMEOUT_MS,
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL
    })
  );

  return (
    <PageShell
      title="Runtime Diagnostics"
      description="Compact runtime visibility for local development and staged cutover work."
    >
      <RuntimeDiagnosticsCard diagnostics={diagnostics} backendProbe={backendProbe} />
      <p style={{ color: "#94a3b8", margin: 0 }}>
        Backend diagnostics are also available at <code>/api/health</code> and <code>/api/diagnostics/runtime</code>.
      </p>
      <p style={{ color: "#94a3b8", margin: 0 }}>
        The bounded auth-aligned read surfaces in this stage are <code>GET /api/alerts/:id</code> for detail and <code>GET /api/alerts/summary</code> for queue summary reuse when session and forwarding state allow it.
      </p>
    </PageShell>
  );
}
