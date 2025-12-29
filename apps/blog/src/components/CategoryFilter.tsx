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
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !currentCategory
            ? "bg-primary-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
      >
        전체
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/posts?category=${category.slug}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            currentCategory === category.slug
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
