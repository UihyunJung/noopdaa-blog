import { createServerClient } from "@/lib/supabase/server";
import { AnalyticsOverview } from "./components/AnalyticsOverview";
import { ViewsChart } from "./components/ViewsChart";
import { TopPages } from "./components/TopPages";
import { TopPosts } from "./components/TopPosts";
import { ReferrerTable } from "./components/ReferrerTable";
import { DeviceChart } from "./components/DeviceChart";
import { BrowserChart } from "./components/BrowserChart";
import { HourlyChart } from "./components/HourlyChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createServerClient();

  // 오늘과 어제 날짜
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 30일 전 날짜
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  // 총 페이지뷰
  const { count: totalViews } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true });

  // 오늘 페이지뷰
  const { count: todayViews } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("viewed_at", `${todayStr}T00:00:00`)
    .lt("viewed_at", `${todayStr}T23:59:59`);

  // 어제 페이지뷰
  const { count: yesterdayViews } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("viewed_at", `${yesterdayStr}T00:00:00`)
    .lt("viewed_at", `${yesterdayStr}T23:59:59`);

  // 오늘 순 방문자
  const { data: todayUniqueData } = await supabase
    .from("page_views")
    .select("visitor_id")
    .gte("viewed_at", `${todayStr}T00:00:00`)
    .lt("viewed_at", `${todayStr}T23:59:59`);

  const todayUniqueVisitors = new Set(todayUniqueData?.map((v) => v.visitor_id)).size;

  // 총 순 방문자 (IP 해시 기반)
  const { data: uniqueData } = await supabase.from("page_views").select("ip_hash");
  const totalUniqueVisitors = new Set(uniqueData?.map((v) => v.ip_hash)).size;

  // 일별 통계 (최근 30일)
  const { data: dailyData } = await supabase
    .from("page_views")
    .select("viewed_at, visitor_id")
    .gte("viewed_at", thirtyDaysAgoStr);

  // 일별 데이터 집계
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

  // 인기 페이지 TOP 10
  const { data: pageViewsData } = await supabase
    .from("page_views")
    .select("page_path")
    .gte("viewed_at", thirtyDaysAgoStr);

  const pageStats = new Map<string, number>();
  pageViewsData?.forEach((row) => {
    pageStats.set(row.page_path, (pageStats.get(row.page_path) || 0) + 1);
  });

  const topPages = Array.from(pageStats.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 인기 포스트 TOP 10
  const { data: postViewsData } = await supabase
    .from("page_views")
    .select("post_id, posts(id, title)")
    .not("post_id", "is", null)
    .gte("viewed_at", thirtyDaysAgoStr);

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

  // 레퍼러 통계
  const { data: referrerData } = await supabase
    .from("page_views")
    .select("referrer")
    .gte("viewed_at", thirtyDaysAgoStr);

  const referrerStats = new Map<string, number>();
  referrerData?.forEach((row) => {
    const referrer = parseReferrerDomain(row.referrer);
    referrerStats.set(referrer, (referrerStats.get(referrer) || 0) + 1);
  });

  const referrers = Array.from(referrerStats.entries())
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 디바이스 통계
  const { data: deviceData } = await supabase
    .from("page_views")
    .select("device_type")
    .gte("viewed_at", thirtyDaysAgoStr);

  const deviceStats = new Map<string, number>();
  deviceData?.forEach((row) => {
    const device = row.device_type || "unknown";
    deviceStats.set(device, (deviceStats.get(device) || 0) + 1);
  });

  const devices = Array.from(deviceStats.entries()).map(([name, value]) => ({
    name: name === "desktop" ? "데스크톱" : name === "mobile" ? "모바일" : name === "tablet" ? "태블릿" : "기타",
    value,
  }));

  // 브라우저 통계
  const { data: browserData } = await supabase
    .from("page_views")
    .select("browser")
    .gte("viewed_at", thirtyDaysAgoStr);

  const browserStats = new Map<string, number>();
  browserData?.forEach((row) => {
    const browser = row.browser || "Other";
    browserStats.set(browser, (browserStats.get(browser) || 0) + 1);
  });

  const browsers = Array.from(browserStats.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 시간대별 통계 (최근 7일)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const { data: hourlyData } = await supabase
    .from("page_views")
    .select("viewed_at")
    .gte("viewed_at", sevenDaysAgoStr);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">통계</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">최근 30일 기준</span>
      </div>

      {/* 요약 카드 */}
      <AnalyticsOverview
        totalViews={totalViews || 0}
        totalUniqueVisitors={totalUniqueVisitors}
        todayViews={todayViews || 0}
        todayUniqueVisitors={todayUniqueVisitors}
        yesterdayViews={yesterdayViews || 0}
      />

      {/* 트렌드 차트 */}
      <ViewsChart data={chartData} />

      {/* 인기 페이지 & 포스트 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopPages data={topPages} />
        <TopPosts data={topPosts} />
      </div>

      {/* 유입 경로 & 디바이스/브라우저 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ReferrerTable data={referrers} />
        <div className="space-y-6">
          <DeviceChart data={devices} />
          <BrowserChart data={browsers} />
        </div>
      </div>

      {/* 시간대별 통계 */}
      <HourlyChart data={hourlyChartData} />
    </div>
  );
}

// 레퍼러 도메인 추출 함수
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
