/**
 * 날짜 문자열 생성 유틸
 * @param daysOffset - 오늘 기준 오프셋 (0: 오늘, -1: 어제, -30: 30일 전)
 * @returns YYYY-MM-DD 형식 문자열
 */
export function getDateString(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  // 한국 시간(KST, UTC+9) 기준 날짜 (en-CA 로케일 → YYYY-MM-DD 형식)
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 문자열을 URL-safe slug로 변환
 */
export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
  return slug || `item-${Date.now().toString(36)}`;
}

/**
 * 한국어 날짜 포맷
 */
export function formatDateKR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
