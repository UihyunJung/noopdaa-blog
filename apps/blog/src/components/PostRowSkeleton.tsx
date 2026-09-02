// PostRow와 같은 격자로 그린 로딩 스켈레톤 (홈·목록 loading.tsx에서 공용)
export function PostRowSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[minmax(0,1fr)_96px] gap-4 border-t border-line py-5 sm:grid-cols-[112px_minmax(0,1fr)_200px] sm:gap-8 sm:py-7">
      <div className="hidden h-4 w-20 rounded bg-paper-3 sm:block" />
      <div className="space-y-3">
        <div className="h-3 w-16 rounded bg-paper-3" />
        <div className="h-6 w-3/4 rounded bg-paper-3" />
        <div className="hidden h-4 w-full rounded bg-paper-3 sm:block" />
        <div className="h-3 w-12 rounded bg-paper-3" />
      </div>
      <div className="h-16 w-24 bg-paper-3 sm:h-[125px] sm:w-[200px]" />
    </div>
  );
}
