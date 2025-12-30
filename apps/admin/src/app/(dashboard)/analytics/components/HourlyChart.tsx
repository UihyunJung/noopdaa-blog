"use client";

import { Card } from "@noopdaa/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HourlyChartProps {
  data: Array<{
    hour: string;
    views: number;
  }>;
}

export function HourlyChart({ data }: HourlyChartProps) {
  const hasData = data.some((item) => item.views > 0);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">시간대별 방문</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">최근 7일</span>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10 }}
              interval={2}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #fff)",
                border: "1px solid var(--tooltip-border, #e5e7eb)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value.toLocaleString(), "방문"]}
            />
            <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}
