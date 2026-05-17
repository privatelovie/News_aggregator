export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>
    </div>
  );
}
