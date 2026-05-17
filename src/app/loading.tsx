import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="min-h-[28rem]" />
        <div className="space-y-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-48" />
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
