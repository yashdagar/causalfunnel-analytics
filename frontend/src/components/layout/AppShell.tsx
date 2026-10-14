"use client";

import { ExternalLink, Flame, ListTree, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { cn } from "@/components/ui/cn";
import { useMounted } from "@/lib/useMounted";

import { DemoUrlContext } from "./DemoLink";

const NAV = [
  { href: "/sessions", label: "Sessions", icon: ListTree },
  { href: "/heatmap", label: "Heatmap", icon: Flame },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-hover hover:text-text"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppShell({ demoUrl, children }: { demoUrl: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <DemoUrlContext.Provider value={demoUrl}>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-6">
            <Link href="/sessions" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">CF</span>
              <span className="hidden sm:inline">CausalFunnel Analytics</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Main">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium",
                      active ? "bg-brand-soft text-brand-text" : "text-muted hover:bg-surface-hover hover:text-text",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-1">
              <a
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted hover:bg-surface-hover hover:text-text"
              >
                <span className="hidden sm:inline">Open demo store</span>
                <span className="sm:hidden">Demo</span>
                <ExternalLink className="size-3.5" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      </div>
    </DemoUrlContext.Provider>
  );
}
