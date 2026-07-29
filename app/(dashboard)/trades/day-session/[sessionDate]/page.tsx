import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../../../dashboard-template";
import { ExecutionEntryCard } from "./execution-entry-card";

export const metadata: Metadata = {
  description: "Enter executions and review one completed trading day.",
  title: "Trading Day | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function DaySessionPage({
  params,
}: {
  params: Promise<{ sessionDate: string }>;
}) {
  const { sessionDate } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) notFound();

  return (
    <DashboardPage>
      <ExecutionEntryCard sessionDate={sessionDate} />
      <DashboardUnavailableState
        compact
        description="The day summary and completed trades will appear here after the saved executions are reconstructed through V3."
        title="Trading day review"
      />
    </DashboardPage>
  );
}
