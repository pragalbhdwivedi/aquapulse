import Link from "next/link";
import type { ReactNode } from "react";
import { protectedNavigation } from "./navigation";

type ProtectedLayoutShellProps = {
  children: ReactNode;
};

export function ProtectedLayoutShell({ children }: ProtectedLayoutShellProps) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <aside style={{ padding: "1.5rem", borderRight: "1px solid #1f2937", background: "#111827" }}>
        <h2 style={{ marginTop: 0 }}>AquaPulse</h2>
        <p style={{ color: "#94a3b8" }}>Protected workspace shell</p>
        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
            {protectedNavigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} style={{ color: "#e2e8f0", textDecoration: "none" }}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main style={{ padding: "1.5rem" }}>{children}</main>
    </div>
  );
}
