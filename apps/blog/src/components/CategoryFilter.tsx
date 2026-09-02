"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  currentCategory?: string;
}

// 카테고리 탭 — 알약 대신 밑줄로 활성 표시 (필터 바 안에서 가로 스크롤)
export function CategoryFilter({
  categories,
  currentCategory,
}: CategoryFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (slug?: string) => {
    startTransition(() => {
      router.push(slug ? `/posts?category=${slug}` : "/posts");
    });
  };

  const tabClass = (active: boolean) =>
    `shrink-0 px-2.5 pb-3 pt-3.5 text-sm transition-colors ${
      active
        ? "font-semibold text-ink shadow-[inset_0_-2px_0_var(--ink)]"
        : "font-medium text-ink-2 hover:text-ink"
    } ${isPending ? "opacity-60" : ""}`;

  return (
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1" aria-label="카테고리">
      <button
        type="button"
        onClick={() => handleClick()}
        disabled={isPending && !currentCategory}
        className={tabClass(!currentCategory)}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => handleClick(category.slug)}
          disabled={isPending}
          className={tabClass(currentCategory === category.slug)}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
}
