import type { ReactNode } from "react";
import { ProtectedLayoutShell } from "./_components/protected-layout-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayoutShell>{children}</ProtectedLayoutShell>;
}
