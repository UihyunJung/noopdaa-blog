"use client";

import { Card } from "@noopdaa/ui";

interface ReferrerTableProps {
  data: Array<{
    source: string;
    views: number;
  }>;
}

export function ReferrerTable({ data }: ReferrerTableProps) {
  const total = data.reduce((sum, item) => sum + item.views, 0);

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">유입 경로</h2>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item) => {
            const percentage = total > 0 ? Math.round((item.views / total) * 100) : 0;
            return (
              <div key={item.source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SourceIcon source={item.source} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.views.toLocaleString()}
                  </span>
                  <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}

function SourceIcon({ source }: { source: string }) {
  const getColor = () => {
    switch (source.toLowerCase()) {
      case "google":
        return "text-blue-500";
      case "naver":
        return "text-green-500";
      case "twitter":
        return "text-sky-500";
      case "facebook":
        return "text-indigo-500";
      case "github":
        return "text-gray-700 dark:text-gray-300";
      case "direct":
        return "text-purple-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <svg className={`h-4 w-4 ${getColor()}`} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
