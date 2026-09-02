/**
 * 날짜를 "2026.04.04" 형식으로 표시한다 (KST 기준).
 * 목록·상세·댓글 등 화면에 보이는 날짜는 모두 이 형식을 쓴다.
 */
export function formatDateDot(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\s/g, "")
    .replace(/\.$/, "");
}

/** 조회수 표시 ("1,234 조회") */
export function formatViews(count: number | null | undefined): string {
  return `${(count ?? 0).toLocaleString("ko-KR")} 조회`;
}
