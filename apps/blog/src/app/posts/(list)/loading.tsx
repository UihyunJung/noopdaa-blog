import { PostRowSkeleton } from "@/components/PostRowSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* 제목 스켈레톤 */}
      <div className="mx-auto flex max-w-[1120px] items-baseline justify-between px-5 pb-6 pt-10 sm:px-8 sm:pt-16">
        <div className="h-9 w-24 animate-pulse rounded bg-paper-3 sm:h-11" />
        <div className="h-4 w-28 animate-pulse rounded bg-paper-3" />
      </div>

      {/* 필터 바 스켈레톤 */}
      <div className="border-y border-line">
        <div className="mx-auto flex h-[52px] max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <div className="h-4 w-56 animate-pulse rounded bg-paper-3" />
          <div className="hidden h-9 w-[280px] animate-pulse rounded-md bg-paper-3 sm:block" />
        </div>
      </div>

      {/* 목록 스켈레톤 */}
      <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-2 sm:px-8 sm:pb-24">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
