import Link from "next/link";
import type { ReactNode } from "react";
import { protectedNavigation } from "./navigation";

export function ProtectedLayoutShell({
  children,
  authLabel
}: {
  children: ReactNode;
  authLabel?: string;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr" }}>
      <aside style={{ padding: "1.5rem", borderRight: "1px solid #1f2937" }}>
        <h2>AquaPulse</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 0 }}>
          Auth: {authLabel ?? "disabled"}
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {protectedNavigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href} style={{ color: "#e2e8f0", textDecoration: "none" }}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ padding: "1.5rem" }}>{children}</main>
    </div>
  );
}
