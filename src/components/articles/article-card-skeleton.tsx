import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
  return (
    <div className="min-h-[26rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-4 p-5">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-9" />
        </div>
      </div>
    </div>
  );
}
