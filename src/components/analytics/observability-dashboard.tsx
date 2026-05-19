"use client";

import { Activity, BarChart3, MousePointerClick, SearchCheck } from "lucide-react";
import { useEffect, useState } from "react";

type ObservabilityPayload = {
  rangeDays: number;
  metrics: {
    ctr: number;
    saveRate: number;
    summaryOpenRate: number;
    searchSuccessRate: number;
    trackedClicks: number;
  };
  eventCounts: Record<string, number>;
  retentionCohorts: Array<{ week: string; users: number }>;
};

export function ObservabilityDashboard() {
  const [data, setData] = useState<ObservabilityPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch("/api/analytics", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load observability metrics.");
        }

        const payload = (await response.json()) as { data: ObservabilityPayload };

        if (active) {
          setData(payload.data);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load observability metrics."
          );
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const metrics = data?.metrics;

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6">
      <section className="rounded-[2rem] border-[5px] border-black bg-[#ffd24a] p-5 text-black shadow-[10px_10px_0_#050505]">
        <p className="flex items-center gap-2 text-sm font-black uppercase">
          <Activity className="size-4" />
          Observability
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase">
          News product health
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-bold text-black/75">
          CTR, save rate, summary usage, search success, and retention cohorts
          from the last {data?.rangeDays ?? 30} days.
        </p>
      </section>

      {error && (
        <div className="rounded-[1.5rem] border-[4px] border-black bg-white p-4 text-sm font-black text-black">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<MousePointerClick className="size-5" />}
          label="CTR"
          value={formatPercent(metrics?.ctr)}
        />
        <MetricCard
          icon={<BarChart3 className="size-5" />}
          label="Save rate"
          value={formatPercent(metrics?.saveRate)}
        />
        <MetricCard
          icon={<Activity className="size-5" />}
          label="Summary open"
          value={formatPercent(metrics?.summaryOpenRate)}
        />
        <MetricCard
          icon={<SearchCheck className="size-5" />}
          label="Search success"
          value={formatPercent(metrics?.searchSuccessRate)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border-[5px] border-black bg-white p-4 text-black shadow-[8px_8px_0_#050505]">
          <h2 className="text-2xl font-black uppercase">Event counts</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(data?.eventCounts ?? {}).map(([event, count]) => (
              <div
                className="flex items-center justify-between rounded-full border-2 border-black px-3 py-2 text-sm font-black"
                key={event}
              >
                <span>{event}</span>
                <span className="rounded-full bg-[#ffd24a] px-2 py-0.5">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border-[5px] border-black bg-[#c9b8ff] p-4 text-black shadow-[8px_8px_0_#050505]">
          <h2 className="text-2xl font-black uppercase">Retention cohorts</h2>
          <div className="mt-4 space-y-3">
            {(data?.retentionCohorts ?? []).map((cohort) => (
              <div key={cohort.week}>
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>{cohort.week}</span>
                  <span>{cohort.users} users</span>
                </div>
                <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-black bg-white">
                  <div
                    className="h-full bg-[#ffd24a]"
                    style={{ width: `${Math.max(8, cohort.users * 12)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border-[5px] border-black bg-white p-4 text-black shadow-[8px_8px_0_#050505]">
      <div className="flex items-center gap-2 text-sm font-black uppercase">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function formatPercent(value?: number) {
  return `${Math.round((value ?? 0) * 100)}%`;
}
