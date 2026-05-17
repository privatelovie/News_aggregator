"use client";

import { RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-3xl place-items-center px-4 py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-medium uppercase tracking-wide text-red-500">
          Something broke
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
          We could not load this view.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {error.message || "Try again in a moment."}
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950"
          onClick={reset}
          type="button"
        >
          <RefreshCcw className="size-4" />
          Retry
        </button>
      </section>
    </main>
  );
}
