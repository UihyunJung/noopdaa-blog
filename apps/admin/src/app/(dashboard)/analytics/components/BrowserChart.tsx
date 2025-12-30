"use client";

import { Card } from "@noopdaa/ui";

interface BrowserChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const BROWSER_COLORS: Record<string, string> = {
  Chrome: "bg-yellow-500",
  Safari: "bg-blue-500",
  Firefox: "bg-orange-500",
  Edge: "bg-cyan-500",
  Whale: "bg-teal-500",
  Samsung: "bg-indigo-500",
  Opera: "bg-red-500",
  IE: "bg-blue-700",
  Other: "bg-gray-400",
};

export function BrowserChart({ data }: BrowserChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = data[0]?.value || 1;

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">브라우저</h2>

      {data.length > 0 && total > 0 ? (
        <div className="space-y-2">
          {data.slice(0, 5).map((item) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-16 truncate text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full ${BROWSER_COLORS[item.name] || "bg-gray-400"}`}
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm text-gray-500 dark:text-gray-400">{percentage}%</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[100px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}
