"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
          <h1>Neural News could not start.</h1>
          <button onClick={reset} type="button">
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
