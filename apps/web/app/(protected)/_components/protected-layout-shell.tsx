import Link from "next/link";
import type { ReactNode } from "react";
import { protectedNavigation } from "./navigation";

export function ProtectedLayoutShell({
  children,
  authLabel,
  sessionLabel,
  currentUserLabel,
  currentUserDetail,
  readSurfaceLabel
}: {
  children: ReactNode;
  authLabel?: string;
  sessionLabel?: string;
  currentUserLabel?: string;
  currentUserDetail?: string;
  readSurfaceLabel?: string;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr" }}>
      <aside style={{ padding: "1.5rem", borderRight: "1px solid #1f2937" }}>
        <h2>AquaPulse</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 0 }}>
          Auth: {authLabel ?? "disabled"}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 0 }}>
          Session: {sessionLabel ?? "bypassed"}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 0 }}>
          User: {currentUserLabel ?? "runtime-derived only"}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 0 }}>
          Identity: {currentUserDetail ?? "not resolved from backend session"}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 0 }}>
          Alerts detail: {readSurfaceLabel ?? "safe fallback"}
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
