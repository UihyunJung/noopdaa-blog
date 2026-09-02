export default function Loading() {
  return (
    <article className="min-h-screen">
      {/* 제목 영역 스켈레톤 */}
      <header className="mx-auto max-w-[1000px] px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-[72px]">
        <div className="flex max-w-[760px] flex-col gap-5">
          <div className="h-3 w-10 animate-pulse rounded bg-paper-3" />
          <div className="h-9 w-full animate-pulse rounded bg-paper-3 sm:h-11" />
          <div className="h-9 w-2/3 animate-pulse rounded bg-paper-3 sm:h-11" />
          <div className="h-4 w-40 animate-pulse rounded bg-paper-3" />
        </div>
      </header>

      {/* 커버 이미지 스켈레톤 */}
      <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
        <div className="aspect-[21/9] animate-pulse border border-line bg-paper-3" />
      </div>

      {/* 본문 스켈레톤 */}
      <div className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-[680px] space-y-4">
          <div className="h-4 animate-pulse rounded bg-paper-3" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-paper-3" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-paper-3" />
          <div className="h-4 animate-pulse rounded bg-paper-3" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-paper-3" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-paper-3" />
        </div>
      </div>
    </article>
  );
}
