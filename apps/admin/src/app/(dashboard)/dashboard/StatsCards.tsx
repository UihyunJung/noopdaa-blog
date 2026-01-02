"use client";

import { Card } from "@noopdaa/ui";
import {
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUser,
  HiOutlineChartBar,
} from "react-icons/hi2";

interface StatsCardsProps {
  postCount: number;
  totalViews: number;
  commentCount: number;
  todayPageViews: number;
  todayUniqueVisitors: number;
  yesterdayPageViews: number;
}

export function StatsCards({
  postCount,
  totalViews,
  commentCount,
  todayPageViews,
  todayUniqueVisitors,
  yesterdayPageViews,
}: StatsCardsProps) {
  // 어제 대비 증감률
  const changePercent =
    yesterdayPageViews > 0
      ? Math.round(((todayPageViews - yesterdayPageViews) / yesterdayPageViews) * 100)
      : todayPageViews > 0
        ? 100
        : 0;

  const stats = [
    {
      name: "총 포스트",
      value: postCount,
      icon: HiOutlineDocumentText,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      name: "총 조회수",
      value: totalViews.toLocaleString(),
      icon: HiOutlineEye,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    },
    {
      name: "총 댓글",
      value: commentCount,
      icon: HiOutlineChatBubbleLeftRight,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    },
    {
      name: "오늘 방문자",
      value: todayUniqueVisitors.toLocaleString(),
      subValue:
        changePercent !== 0
          ? `어제 대비 ${changePercent > 0 ? "+" : ""}${changePercent}%`
          : undefined,
      subValueColor: changePercent >= 0 ? "text-green-500" : "text-red-500",
      icon: HiOutlineUser,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    },
    {
      name: "오늘 페이지뷰",
      value: todayPageViews.toLocaleString(),
      icon: HiOutlineChartBar,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.name} className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${stat.color}`}>
            <stat.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            {"subValue" in stat && stat.subValue && (
              <p className={`text-xs ${stat.subValueColor}`}>{stat.subValue}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
