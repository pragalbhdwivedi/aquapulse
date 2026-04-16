import type { CSSProperties, ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b1120", color: "#e2e8f0", fontFamily: "ui-sans-serif, system-ui, sans-serif" } as CSSProperties}>
        {children}
      </body>
    </html>
  );
}
