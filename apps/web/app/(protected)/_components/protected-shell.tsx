import Link from "next/link";
import type { ReactNode } from "react";
import { navigationSections } from "./navigation";

type ProtectedShellProps = {
  children: ReactNode;
};

export function ProtectedShell({ children }: ProtectedShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        background: "var(--app-bg)",
        color: "var(--app-fg)",
      }}
    >
      <aside
        style={{
          padding: "1.5rem",
          borderRight: "1px solid var(--app-border)",
          background: "var(--app-panel)",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", letterSpacing: "0.08em" }}>
            AquaPulse
          </p>
          <h1 style={{ margin: "0.5rem 0 0", fontSize: "1.5rem" }}>Operations</h1>
          {/* TODO: Replace with authenticated user/workspace context. */}
        </div>

        <nav aria-label="Primary navigation">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
            {navigationSections.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "0.8rem 0.9rem",
                    borderRadius: "12px",
                    color: "var(--app-fg)",
                    textDecoration: "none",
                    background: "transparent",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div style={{ minWidth: 0 }}>
        <header
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--app-border)",
            background: "var(--app-panel)",
          }}
        >
          {/* TODO: Add breadcrumbs, search, notifications, and profile actions. */}
          <strong>Protected Workspace Shell</strong>
        </header>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}
