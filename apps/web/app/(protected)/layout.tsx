import type { ReactNode } from "react";
import { formatFrontendSessionLabel } from "@web/features/auth-session";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { ProtectedLayoutShell } from "./_components/protected-layout-shell";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();

  return (
    <ProtectedLayoutShell
      authLabel={diagnostics.auth.effectiveMode}
      sessionLabel={formatFrontendSessionLabel(diagnostics.session)}
      currentUserLabel={
        diagnostics.session.currentUser?.displayName ??
        diagnostics.session.currentUser?.username ??
        diagnostics.session.currentUser?.id
      }
    >
      {children}
    </ProtectedLayoutShell>
  );
}
