"use client";

import { Card } from "@noopdaa/ui";
import {
  HiOutlineEye,
  HiOutlineUsers,
  HiOutlineArrowTrendingUp,
  HiOutlineUser,
} from "react-icons/hi2";

interface AnalyticsOverviewProps {
  totalViews: number;
  totalUniqueVisitors: number;
  todayViews: number;
  todayUniqueVisitors: number;
  yesterdayViews: number;
}

export function AnalyticsOverview({
  totalViews,
  totalUniqueVisitors,
  todayViews,
  todayUniqueVisitors,
  yesterdayViews,
}: AnalyticsOverviewProps) {
  // 어제 대비 증감률
  const changePercent =
    yesterdayViews > 0 ? Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100) : todayViews > 0 ? 100 : 0;

  const stats = [
    {
      name: "총 페이지뷰",
      value: totalViews.toLocaleString(),
      icon: HiOutlineEye,
      color: "blue",
    },
    {
      name: "총 방문자",
      value: totalUniqueVisitors.toLocaleString(),
      icon: HiOutlineUsers,
      color: "green",
    },
    {
      name: "오늘 페이지뷰",
      value: todayViews.toLocaleString(),
      icon: HiOutlineArrowTrendingUp,
      color: "purple",
    },
    {
      name: "오늘 방문자",
      value: todayUniqueVisitors.toLocaleString(),
      subValue: changePercent !== 0 ? `어제 대비 ${changePercent > 0 ? "+" : ""}${changePercent}%` : undefined,
      subValueColor: changePercent >= 0 ? "text-green-500" : "text-red-500",
      icon: HiOutlineUser,
      color: "orange",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                stat.color === "blue"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : stat.color === "green"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : stat.color === "purple"
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              }`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              {stat.subValue && <p className={`text-xs ${stat.subValueColor}`}>{stat.subValue}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
