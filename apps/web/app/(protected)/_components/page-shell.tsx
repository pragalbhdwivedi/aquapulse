type PageShellProps = {
  title: string;
  description: string;
  todo: string[];
};

export function PageShell({ title, description, todo }: PageShellProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <header
        style={{
          border: "1px solid var(--app-border)",
          borderRadius: "20px",
          padding: "1.5rem",
          background: "var(--app-panel)",
        }}
      >
        <p style={{ margin: 0, color: "var(--app-muted)", fontSize: "0.9rem" }}>
          Placeholder route
        </p>
        <h1 style={{ margin: "0.5rem 0", fontSize: "2rem" }}>{title}</h1>
        <p style={{ margin: 0, lineHeight: 1.7 }}>{description}</p>
      </header>

      <div
        style={{
          border: "1px solid var(--app-border)",
          borderRadius: "20px",
          padding: "1.5rem",
          background: "var(--app-panel)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>TODO</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          {todo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
