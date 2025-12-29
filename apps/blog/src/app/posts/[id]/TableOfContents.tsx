"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Markdown에서 헤딩 추출
    const matches = content.matchAll(/^(#{2,3})\s+(.+)$/gm);
    const extracted: Heading[] = [];

    for (const match of matches) {
      const level = match[1]?.length || 2;
      const text = match[2] || "";
      const id = text.toLowerCase().replace(/\s+/g, "-");
      extracted.push({ id, text, level });
    }

    setHeadings(extracted);
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
    <nav className="text-sm">
      <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">목차</h4>
      <ul className="space-y-2">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? "ml-4" : ""}>
            <a
              href={`#${id}`}
              className={`block text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${
                activeId === id
                  ? "font-medium text-primary-600 dark:text-primary-400"
                  : ""
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
