import type { CSSProperties, ReactNode } from "react";

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
            background: "#0b1120",
            color: "#e2e8f0",
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
