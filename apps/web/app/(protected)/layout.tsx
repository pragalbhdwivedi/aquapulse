import type { ReactNode } from "react";
import { formatFrontendSessionLabel } from "@web/features/auth-session";
import { readFrontendRuntimeDiagnostics } from "@web/features/runtime-diagnostics";
import { ProtectedLayoutShell } from "./_components/protected-layout-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const diagnostics = readFrontendRuntimeDiagnostics();

  return (
    <ProtectedLayoutShell
      authLabel={diagnostics.auth.effectiveMode}
      sessionLabel={formatFrontendSessionLabel(diagnostics.session)}
    >
      {children}
    </ProtectedLayoutShell>
  );
}
