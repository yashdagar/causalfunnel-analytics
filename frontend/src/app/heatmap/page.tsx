import type { Metadata } from "next";
import { Suspense } from "react";

import { HeatmapExplorer } from "@/components/heatmap/HeatmapExplorer";

export const metadata: Metadata = { title: "Heatmap" };

export default function HeatmapPage() {
  return (
    <Suspense>
      <HeatmapExplorer />
    </Suspense>
  );
}
