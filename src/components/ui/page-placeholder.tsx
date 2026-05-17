export function PagePlaceholder({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Scaffolded
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950 dark:text-white">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </section>
    </main>
  );
}
