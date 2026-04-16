import type { ReactNode } from "react";

export function PageShell({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1>{title}</h1>
        <p style={{ color: "#94a3b8" }}>{description}</p>
      </header>
      {children}
    </section>
  );
}
