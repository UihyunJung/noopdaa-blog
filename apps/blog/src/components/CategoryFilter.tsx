import Link from "next/link";
import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  currentCategory?: string;
}

export function CategoryFilter({
  categories,
  currentCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/posts"
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
          !currentCategory
            ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        전체
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/posts?category=${category.slug}`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            currentCategory === category.slug
              ? "bg-primary-600 text-white shadow-md shadow-primary-600/25"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
