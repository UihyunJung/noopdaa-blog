"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  currentCategory?: string;
}

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

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleClick()}
        disabled={isPending && !currentCategory}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
          !currentCategory
            ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        } ${isPending ? "opacity-60" : ""}`}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => handleClick(category.slug)}
          disabled={isPending}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            currentCategory === category.slug
              ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          } ${isPending ? "opacity-60" : ""}`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
