"use client";

import { Card } from "@noopdaa/ui";

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
      icon: PostIcon,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      name: "총 조회수",
      value: totalViews.toLocaleString(),
      icon: ViewIcon,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    },
    {
      name: "총 댓글",
      value: commentCount,
      icon: CommentIcon,
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
      icon: UserIcon,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    },
    {
      name: "오늘 페이지뷰",
      value: todayPageViews.toLocaleString(),
      icon: ChartIcon,
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

function PostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ViewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
