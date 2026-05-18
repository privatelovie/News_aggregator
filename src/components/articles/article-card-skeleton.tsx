import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
  return (
    <div className="min-h-[30rem] overflow-hidden rounded-[1.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0_#050505] dark:bg-slate-950">
      <Skeleton className="aspect-[16/10] rounded-none border-b-[4px] border-black" />
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
