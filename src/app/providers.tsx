"use client";

import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense>
        <AnalyticsProvider />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
