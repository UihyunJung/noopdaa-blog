export default function Loading() {
  return (
    <article className="min-h-screen">
      {/* 히어로 헤더 스켈레톤 */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-14">
          <div className="mx-auto h-7 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto mt-5 h-9 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto mt-4 h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </header>

      {/* 본문 스켈레톤 */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </article>
  );
}
