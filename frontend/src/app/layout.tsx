import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "CausalFunnel Analytics", template: "%s · CausalFunnel Analytics" },
  description: "Session journeys and click heatmaps from a lightweight tracking script.",
};

const demoUrl = `${(process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/demo/`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <Providers>
          <AppShell demoUrl={demoUrl}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
