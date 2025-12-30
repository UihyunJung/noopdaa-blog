"use client";

import { Card } from "@noopdaa/ui";

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
      icon: EyeIcon,
      color: "blue",
    },
    {
      name: "총 방문자",
      value: totalUniqueVisitors.toLocaleString(),
      icon: UsersIcon,
      color: "green",
    },
    {
      name: "오늘 페이지뷰",
      value: todayViews.toLocaleString(),
      icon: TrendingUpIcon,
      color: "purple",
    },
    {
      name: "오늘 방문자",
      value: todayUniqueVisitors.toLocaleString(),
      subValue: changePercent !== 0 ? `어제 대비 ${changePercent > 0 ? "+" : ""}${changePercent}%` : undefined,
      subValueColor: changePercent >= 0 ? "text-green-500" : "text-red-500",
      icon: UserIcon,
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
