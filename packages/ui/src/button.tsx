type ButtonProps = {
  label: string;
};

export function Button({ label }: ButtonProps) {
  return (
    <button
      type="button"
      style={{
        border: "none",
        borderRadius: "999px",
        padding: "0.9rem 1.25rem",
        fontWeight: 700,
        cursor: "pointer",
        background: "#0f766e",
        color: "#f8fafc"
      }}
    >
      {label}
    </button>
  );
}
