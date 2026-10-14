"use client";

import { useParams } from "next/navigation";

import { SessionList } from "@/components/sessions/SessionList";
import { cn } from "@/components/ui/cn";

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id?: string }>();
  const selectedId = params.id ? decodeURIComponent(params.id) : undefined;

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-7rem)] lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className={cn("min-h-0 lg:flex lg:flex-col", selectedId && "hidden")}>
        <SessionList selectedId={selectedId} />
      </div>
      <div className={cn("scrollbar-thin min-h-0 lg:overflow-y-auto", !selectedId && "hidden lg:block")}>{children}</div>
    </div>
  );
}
