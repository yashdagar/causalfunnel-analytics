import { ListTree } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/States";

export const metadata: Metadata = { title: "Sessions" };

export default function SessionsPage() {
  return (
    <div className="card">
      <EmptyState icon={<ListTree className="size-6" />} title="Pick a session">
        Select a session on the left to see every page view and click in order.
      </EmptyState>
    </div>
  );
}
