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
        className="w-full rounded-xl border-0 bg-zinc-100 py-3 pl-11 pr-4 text-sm text-zinc-900 placeholder-zinc-500 ring-1 ring-transparent transition-all focus:bg-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 dark:focus:bg-zinc-800 sm:w-72"
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        ) : (
          <HiOutlineMagnifyingGlass className="h-4 w-4 text-zinc-400" />
        )}
      </div>
    </form>
  );
}
