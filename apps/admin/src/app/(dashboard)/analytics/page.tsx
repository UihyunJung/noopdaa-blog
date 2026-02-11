import { createServerClient } from "@/lib/supabase/server";
import { getDateString } from "@/lib/utils";
import { AnalyticsOverview } from "./components/AnalyticsOverview";
import { ViewsChart } from "./components/ViewsChart";
import { TopPosts } from "./components/TopPosts";
import { ReferrerTable } from "./components/ReferrerTable";
import { DeviceChart } from "./components/DeviceChart";
import { BrowserChart } from "./components/BrowserChart";
import { HourlyChart } from "./components/HourlyChart";

export const revalidate = 60;

export default async function AnalyticsPage() {
  const supabase = await createServerClient();

  const todayStr = getDateString(0);
  const yesterdayStr = getDateString(-1);
  const thirtyDaysAgoStr = getDateString(-30);
  const sevenDaysAgoStr = getDateString(-7);

  // 모든 쿼리를 병렬로 실행
  const [
    { count: totalViews },
    { count: todayViews },
    { count: yesterdayViews },
    { data: todayUniqueData },
    { data: uniqueData },
    { data: dailyData },
    { data: postViewsData },
    { data: referrerData },
    { data: deviceData },
    { data: browserData },
    { data: hourlyData },
  ] = await Promise.all([
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase.from("page_views").select("*", { count: "exact", head: true })
      .gte("viewed_at", `${todayStr}T00:00:00`).lt("viewed_at", `${todayStr}T23:59:59`),
    supabase.from("page_views").select("*", { count: "exact", head: true })
      .gte("viewed_at", `${yesterdayStr}T00:00:00`).lt("viewed_at", `${yesterdayStr}T23:59:59`),
    supabase.from("page_views").select("visitor_id")
      .gte("viewed_at", `${todayStr}T00:00:00`).lt("viewed_at", `${todayStr}T23:59:59`),
    supabase.from("page_views").select("ip_hash"),
    supabase.from("page_views").select("viewed_at, visitor_id").gte("viewed_at", thirtyDaysAgoStr),
    supabase.from("page_views").select("post_id, posts(id, title)")
      .not("post_id", "is", null).gte("viewed_at", thirtyDaysAgoStr),
    supabase.from("page_views").select("referrer").gte("viewed_at", thirtyDaysAgoStr),
    supabase.from("page_views").select("device_type").gte("viewed_at", thirtyDaysAgoStr),
    supabase.from("page_views").select("browser").gte("viewed_at", thirtyDaysAgoStr),
    supabase.from("page_views").select("viewed_at").gte("viewed_at", sevenDaysAgoStr),
  ]);

  const todayUniqueVisitors = new Set(todayUniqueData?.map((v) => v.visitor_id)).size;
  const totalUniqueVisitors = new Set(uniqueData?.map((v) => v.ip_hash)).size;

  // 일별 통계 집계
  const dailyStats = new Map<string, { views: number; visitors: Set<string> }>();
  dailyData?.forEach((row) => {
    const date = row.viewed_at.split("T")[0] ?? "";
    if (!date) return;
    if (!dailyStats.has(date)) {
      dailyStats.set(date, { views: 0, visitors: new Set() });
    }
    const stat = dailyStats.get(date)!;
    stat.views++;
    stat.visitors.add(row.visitor_id);
  });

  const chartData = Array.from(dailyStats.entries())
    .map(([date, stat]) => ({
      date,
      views: stat.views,
      uniqueVisitors: stat.visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 인기 포스트 집계
  const postStats = new Map<string, { title: string; views: number }>();
  postViewsData?.forEach((row) => {
    if (row.post_id && row.posts) {
      const post = row.posts as { id: string; title: string };
      if (!postStats.has(row.post_id)) {
        postStats.set(row.post_id, { title: post.title, views: 0 });
      }
      postStats.get(row.post_id)!.views++;
    }
  });

  const topPosts = Array.from(postStats.entries())
    .map(([id, stat]) => ({ id, title: stat.title, views: stat.views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 유입 경로 집계
  const referrerStats = new Map<string, number>();
  referrerData?.forEach((row) => {
    const referrer = parseReferrerDomain(row.referrer);
    referrerStats.set(referrer, (referrerStats.get(referrer) || 0) + 1);
  });

  const referrers = Array.from(referrerStats.entries())
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 디바이스 집계
  const deviceStats = new Map<string, number>();
  deviceData?.forEach((row) => {
    const device = row.device_type || "unknown";
    deviceStats.set(device, (deviceStats.get(device) || 0) + 1);
  });

  const devices = Array.from(deviceStats.entries()).map(([name, value]) => ({
    name: name === "desktop" ? "데스크톱" : name === "mobile" ? "모바일" : name === "tablet" ? "태블릿" : "기타",
    value,
  }));

  // 브라우저 집계
  const browserStats = new Map<string, number>();
  browserData?.forEach((row) => {
    const browser = row.browser || "Other";
    browserStats.set(browser, (browserStats.get(browser) || 0) + 1);
  });

  const browsers = Array.from(browserStats.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 시간대별 집계
  const hourlyStats = new Array(24).fill(0);
  hourlyData?.forEach((row) => {
    const hour = new Date(row.viewed_at).getHours();
    hourlyStats[hour]++;
  });

  const hourlyChartData = hourlyStats.map((views, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}시`,
    views,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">통계</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">최근 30일 기준</span>
      </div>

      <AnalyticsOverview
        totalViews={totalViews || 0}
        totalUniqueVisitors={totalUniqueVisitors}
        todayViews={todayViews || 0}
        todayUniqueVisitors={todayUniqueVisitors}
        yesterdayViews={yesterdayViews || 0}
      />

      <ViewsChart data={chartData} />

      <TopPosts data={topPosts} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ReferrerTable data={referrers} />
        <div className="space-y-4 sm:space-y-6">
          <DeviceChart data={devices} />
          <BrowserChart data={browsers} />
        </div>
      </div>

      <HourlyChart data={hourlyChartData} />
    </div>
  );
}

function parseReferrerDomain(referrer: string | null): string {
  if (!referrer) return "Direct";

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("google")) return "Google";
    if (hostname.includes("naver")) return "Naver";
    if (hostname.includes("daum")) return "Daum";
    if (hostname.includes("bing")) return "Bing";
    if (hostname.includes("yahoo")) return "Yahoo";
    if (hostname.includes("twitter") || hostname.includes("t.co")) return "Twitter";
    if (hostname.includes("facebook") || hostname.includes("fb.")) return "Facebook";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("github")) return "GitHub";

    return hostname;
  } catch {
    return "Other";
  }
}
