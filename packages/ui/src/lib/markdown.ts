/**
 * 마크다운 원문에서 서식 기호를 걷어내 순수 텍스트만 남긴다.
 * 발췌(excerpt)·메타 설명·RSS description처럼 서식이 렌더링되지 않는 자리에 쓴다.
 */
export function stripMarkdown(markdown: string): string {
  return (
    markdown
      // 코드 블록·HTML 태그는 통째로 제거
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]+>/g, " ")
      // 이미지는 alt, 링크는 텍스트만 남김
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // 줄 머리 기호: 헤딩, 인용, 목록, 수평선
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
      .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, "")
      // 표 구분자 (| --- |)
      .replace(/\|/g, " ")
      .replace(/-{3,}/g, " ")
      // 인라인 서식: 굵게 → 기울임 → 취소선 → 코드
      // (_기울임_은 snake_case 식별자를 망가뜨려 제외)
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * 마크다운 본문에서 지정 길이의 발췌를 만든다. 잘린 경우 말줄임표를 붙인다.
 */
export function makeExcerpt(markdown: string, maxLength = 200): string {
  const text = stripMarkdown(markdown);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
