"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";

import { swrFetcher } from "@/lib/queries";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: true }}>{children}</SWRConfig>
    </ThemeProvider>
  );
}
