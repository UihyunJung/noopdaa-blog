"use client";

import { useState } from "react";
import { Card } from "@noopdaa/ui";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface ViewsChartProps {
  data: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
}

export function ViewsChart({ data }: ViewsChartProps) {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");

  // 주별 데이터 집계
  const getWeeklyData = () => {
    const weeklyMap = new Map<string, { views: number; uniqueVisitors: number }>();

    data.forEach((item) => {
      const date = new Date(item.date);
      // 주의 시작일 (월요일 기준)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date);
      weekStart.setDate(diff);
      const weekKey = weekStart.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { views: 0, uniqueVisitors: 0 });
      }
      const stat = weeklyMap.get(weekKey)!;
      stat.views += item.views;
      stat.uniqueVisitors += item.uniqueVisitors;
    });

    return Array.from(weeklyMap.entries())
      .map(([date, stat]) => ({
        date,
        views: stat.views,
        uniqueVisitors: stat.uniqueVisitors,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = period === "daily" ? data : getWeeklyData();

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === "weekly") {
      return `${date.getMonth() + 1}/${date.getDate()}주`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">방문 트렌드</h2>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
          <button
            onClick={() => setPeriod("daily")}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              period === "daily"
                ? "bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            일별
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              period === "weekly"
                ? "bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            주별
          </button>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #fff)",
                border: "1px solid var(--tooltip-border, #e5e7eb)",
                borderRadius: "8px",
              }}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="views"
              name="페이지뷰"
              stroke="#8b5cf6"
              fill="url(#colorViews)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="uniqueVisitors"
              name="순 방문자"
              stroke="#22c55e"
              fill="url(#colorVisitors)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}
