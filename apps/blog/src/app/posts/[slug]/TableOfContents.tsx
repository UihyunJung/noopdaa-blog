"use client";

import { useEffect, useMemo, useState } from "react";
import GithubSlugger from "github-slugger";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

// 헤딩 텍스트의 인라인 마크다운(코드·볼드·링크 등) 제거
// — rehype-slug가 렌더링된 텍스트로 id를 만들므로 동일한 입력으로 맞춤
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크
    .replace(/`([^`]*)`/g, "$1") // 인라인 코드
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 볼드
    .replace(/__([^_]+)__/g, "$1") // 볼드
    .replace(/\*([^*]+)\*/g, "$1") // 이탤릭
    .replace(/_([^_]+)_/g, "$1") // 이탤릭
    .replace(/~~([^~]+)~~/g, "$1"); // 취소선
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  // content prop에서 파생되는 상태 — useMemo로 derived state
  // id는 rehype-slug(PostContent)와 동일하게 github-slugger로 생성 (중복 헤딩 -1 suffix 포함)
  const headings = useMemo<Heading[]>(() => {
    const slugger = new GithubSlugger();
    const matches = content.matchAll(/^(#{2,3})\s+(.+)$/gm);
    const extracted: Heading[] = [];
    for (const match of matches) {
      const level = match[1]?.length || 2;
      const text = stripInlineMarkdown(match[2] || "");
      extracted.push({ id: slugger.slug(text), text, level });
    }
    return extracted;
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="목차">
      <span className="font-mono text-[11px] tracking-[0.1em] text-ink-3">목차</span>
      <ul className="mt-3 border-l border-line">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`-ml-px block border-l py-1.5 text-[13px] leading-normal transition-colors ${
                level === 3 ? "pl-[26px]" : "pl-3.5"
              } ${
                activeId === id
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
