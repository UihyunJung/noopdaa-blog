function PostCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/10] rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 space-y-3">
        <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* 헤더 스켈레톤 */}
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="h-9 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-3 h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* 포스트 그리드 스켈레톤 */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
