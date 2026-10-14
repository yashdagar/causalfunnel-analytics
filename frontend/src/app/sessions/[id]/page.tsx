import type { Metadata } from "next";

import { SessionJourney } from "@/components/sessions/SessionJourney";

export const metadata: Metadata = { title: "Session" };

export default async function SessionPage({ params }: PageProps<"/sessions/[id]">) {
  const { id } = await params;
  return <SessionJourney id={decodeURIComponent(id)} />;
}
