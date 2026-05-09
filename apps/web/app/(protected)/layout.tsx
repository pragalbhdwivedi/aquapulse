import type { ReactNode } from "react";
import {
  deriveProtectedReadUiGuard,
  formatFrontendSessionLabel
} from "@web/features/auth-session";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { ProtectedLayoutShell } from "./_components/protected-layout-shell";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const listReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel: diagnostics.session.protectedReadGuardedSliceLabel,
    enforcedByBackend: diagnostics.session.protectedReadGuardedSliceEnforced
  });
  const detailReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.secondaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.secondaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.secondaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.secondaryProtectedReadSliceEnforced
  });
  const summaryReadGuard = deriveProtectedReadUiGuard(diagnostics.session, {
    sliceLabel:
      diagnostics.session.tertiaryProtectedReadGuardedSliceLabel ??
      diagnostics.auth.tertiaryProtectedReadSliceLabel,
    enforcedByBackend:
      diagnostics.session.tertiaryProtectedReadGuardedSliceEnforced ||
      diagnostics.auth.tertiaryProtectedReadSliceEnforced
  });

  return (
    <ProtectedLayoutShell
      authLabel={diagnostics.auth.effectiveMode}
      sessionLabel={formatFrontendSessionLabel(diagnostics.session)}
      currentUserLabel={
        diagnostics.session.currentUser?.displayName ??
        diagnostics.session.currentUser?.username ??
        diagnostics.session.currentUser?.id
      }
      currentUserDetail={
        diagnostics.session.currentUser
          ? `${diagnostics.session.currentUser.provider} / roles: ${diagnostics.session.currentUser.roles.join(", ") || "none"} / alerts: ${diagnostics.session.currentUser.alertsAccessLevel} (${diagnostics.session.currentUser.alertsAccessSource})`
          : undefined
      }
      readSurfaceLabel={`${diagnostics.session.protectedReadGuardedSliceLabel ?? diagnostics.auth.protectedReadSliceLabel ?? "alerts_list_read"} / ${listReadGuard.state} | ${diagnostics.session.secondaryProtectedReadGuardedSliceLabel ?? diagnostics.auth.secondaryProtectedReadSliceLabel ?? "alerts_detail_read"} / ${detailReadGuard.state} | ${diagnostics.session.tertiaryProtectedReadGuardedSliceLabel ?? diagnostics.auth.tertiaryProtectedReadSliceLabel ?? "alerts_summary_read"} / ${summaryReadGuard.state}`}
    >
      {children}
    </ProtectedLayoutShell>
  );
}
