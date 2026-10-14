import { Monitor, Smartphone, Tablet } from "lucide-react";

import type { Device } from "@/lib/types";

const ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

export function DeviceIcon({ device, className }: { device: Device | null; className?: string }) {
  if (!device) return null;
  const Icon = ICONS[device];
  return <Icon className={className} aria-label={device} role="img" />;
}
