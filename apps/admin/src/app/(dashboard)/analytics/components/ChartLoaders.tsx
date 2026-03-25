"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 ${height}`} />
  );
}

// recharts 사용 컴포넌트를 dynamic import (번들 크기 최적화)
export const ViewsChartLazy = dynamic(
  () => import("./ViewsChart").then((mod) => ({ default: mod.ViewsChart })),
  { ssr: false, loading: () => <ChartSkeleton height="h-[350px]" /> }
);

export const DeviceChartLazy = dynamic(
  () => import("./DeviceChart").then((mod) => ({ default: mod.DeviceChart })),
  { ssr: false, loading: () => <ChartSkeleton height="h-[180px]" /> }
);

export const HourlyChartLazy = dynamic(
  () => import("./HourlyChart").then((mod) => ({ default: mod.HourlyChart })),
  { ssr: false, loading: () => <ChartSkeleton height="h-[250px]" /> }
);
