"use client";

import Link from "next/link";
import { Card } from "@noopdaa/ui";

interface TopPostsProps {
  data: Array<{
    id: string;
    title: string;
    views: number;
  }>;
}

export function TopPosts({ data }: TopPostsProps) {
  const maxViews = data[0]?.views || 1;

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">인기 포스트 TOP 10</h2>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/posts/${item.id}/edit`}
                    className="truncate text-sm text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    title={item.title}
                  >
                    {item.title}
                  </Link>
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {item.views.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${(item.views / maxViews) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}
