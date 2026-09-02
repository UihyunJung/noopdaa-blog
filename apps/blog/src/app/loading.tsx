import { PostRowSkeleton } from "@/components/PostRowSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* 대문 이미지 스켈레톤 */}
      <div className="h-[180px] animate-pulse border-b border-line bg-paper-3 sm:h-[300px] lg:h-[400px]" />

      {/* 좌우명 스켈레톤 */}
      <div className="mx-auto max-w-[1120px] px-5 pb-7 pt-10 sm:px-8 sm:pt-16 lg:pb-14 lg:pt-[72px]">
        <div className="h-12 w-2/3 animate-pulse rounded bg-paper-3 sm:h-16 lg:w-1/2" />
      </div>

      {/* 카테고리 줄 스켈레톤 */}
      <div className="mx-auto max-w-[1120px] px-5 pb-10 sm:px-8 sm:pb-[72px]">
        <div className="flex h-12 items-center gap-3 border-y border-line">
          <div className="h-3 w-12 animate-pulse rounded bg-paper-3" />
          <div className="h-4 w-48 animate-pulse rounded bg-paper-3" />
        </div>
      </div>

      {/* 최근 포스트 스켈레톤 */}
      <section className="mx-auto max-w-[1120px] px-5 pb-14 sm:px-8 sm:pb-24">
        <div className="border-t border-ink pb-1 pt-4">
          <div className="h-6 w-28 animate-pulse rounded bg-paper-3" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <PostRowSkeleton key={i} />
        ))}
      </section>
    </div>
  );
}
