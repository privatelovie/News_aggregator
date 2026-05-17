"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    sendAnalyticsEvent("page_view", {
      path: `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`
    });
  }, [pathname, searchParams]);

  useReportWebVitals((metric) => {
    sendAnalyticsEvent("web_vital", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    });
  });

  return null;
}

export function sendAnalyticsEvent(
  type: string,
  payload: Record<string, unknown>
) {
  const body = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString()
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", body);
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  });
}
