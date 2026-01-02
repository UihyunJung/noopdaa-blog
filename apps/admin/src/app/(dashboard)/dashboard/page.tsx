import { Card, CardHeader, CardTitle, CardContent } from "@noopdaa/ui";
import { createServerClient } from "@/lib/supabase/server";
import { StatsCards } from "./StatsCards";
import { RecentComments } from "./RecentComments";
import { PopularPosts } from "./PopularPosts";

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const [
    { count: postCount },
    { count: commentCount },
    { data: posts },
    { count: todayPageViews },
    { count: yesterdayPageViews },
    { data: todayVisitorData },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("view_count")
      .eq("status", "published"),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", `${todayStr}T00:00:00`)
      .lt("viewed_at", `${todayStr}T23:59:59`),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", `${yesterdayStr}T00:00:00`)
      .lt("viewed_at", `${yesterdayStr}T23:59:59`),
    supabase
      .from("page_views")
      .select("visitor_id")
      .gte("viewed_at", `${todayStr}T00:00:00`)
      .lt("viewed_at", `${todayStr}T23:59:59`),
  ]);

  const totalViews = posts?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;
  const todayUniqueVisitors = new Set(todayVisitorData?.map((v) => v.visitor_id)).size;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        대시보드
      </h1>

      <StatsCards
        postCount={postCount || 0}
        totalViews={totalViews}
        commentCount={commentCount || 0}
        todayPageViews={todayPageViews || 0}
        todayUniqueVisitors={todayUniqueVisitors}
        yesterdayPageViews={yesterdayPageViews || 0}
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>인기 포스트</CardTitle>
          </CardHeader>
          <CardContent>
            <PopularPosts />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 댓글</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentComments />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
