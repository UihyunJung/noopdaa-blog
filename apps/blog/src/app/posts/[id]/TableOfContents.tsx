"use client";

import { useEffect, useState } from "react";
import { HiOutlineListBullet } from "react-icons/hi2";

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
    <nav className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-800/50">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
        <HiOutlineListBullet className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        목차
      </h4>
      <ul className="mt-4 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-700">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block border-l-2 py-1.5 text-sm transition-all ${
                level === 3 ? "pl-6" : "pl-4"
              } ${
                activeId === id
                  ? "-ml-[2px] border-primary-600 font-medium text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "-ml-[2px] border-transparent text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
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
