import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

export const metadata: Metadata = {
  title: "AquaPulse",
  description: "Aquaculture operations platform monorepo scaffold"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        style={
          {
            margin: 0,
            "--app-bg": "#0b1120",
            "--app-panel": "#111827",
            "--app-fg": "#e5e7eb",
            "--app-muted": "#94a3b8",
            "--app-border": "#1f2937",
            background: "var(--app-bg)",
            color: "var(--app-fg)",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
