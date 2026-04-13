import type { ReactNode } from "react";
import { ProtectedLayoutShell } from "./_components/protected-layout-shell";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <ProtectedLayoutShell>{children}</ProtectedLayoutShell>;
}
