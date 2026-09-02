"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      if (query.trim()) {
        router.push(`/posts?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push("/posts");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="search"
        placeholder="검색어를 입력하세요..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isPending}
        aria-label="검색"
        className="h-9 w-full rounded-md border border-transparent bg-paper-3 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-ink-3 focus:border-ink focus:bg-paper-2 focus:outline-none focus:ring-0 disabled:opacity-50 sm:w-[280px]"
      />
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        {isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        ) : (
          <HiOutlineMagnifyingGlass className="h-4 w-4 text-ink-3" />
        )}
      </div>
    </form>
  );
}
