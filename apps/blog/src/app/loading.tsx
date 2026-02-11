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
      {/* 히어로 섹션 스켈레톤 */}
      <div className="h-[420px] animate-pulse bg-zinc-100 dark:bg-zinc-800 sm:h-[480px] lg:h-[520px]" />

      {/* 최근 포스트 스켈레톤 */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-2 h-5 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
