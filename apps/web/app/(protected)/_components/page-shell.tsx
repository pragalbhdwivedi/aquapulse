import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
        <h1 style={{ margin: "0 0 0.5rem" }}>{title}</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>{description}</p>
      </header>
      {children}
    </section>
  );
}
