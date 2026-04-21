import type { ReactNode } from "react";
import { readFrontendRuntimeDiagnostics } from "@web/features/runtime-diagnostics";
import { ProtectedLayoutShell } from "./_components/protected-layout-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const diagnostics = readFrontendRuntimeDiagnostics({
    NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE,
    NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL,
    NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM,
    NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID,
    NEXT_PUBLIC_AQUAPULSE_WEB_LOCAL_AUTH_USER_LABEL:
      process.env.NEXT_PUBLIC_AQUAPULSE_WEB_LOCAL_AUTH_USER_LABEL,
    AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL
  });

  return <ProtectedLayoutShell authLabel={diagnostics.auth.effectiveMode}>{children}</ProtectedLayoutShell>;
}
