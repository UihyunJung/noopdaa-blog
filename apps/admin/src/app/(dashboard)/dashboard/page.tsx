import { Card, CardHeader, CardTitle, CardContent } from "@noopdaa/ui";
import { createServerClient } from "@/lib/supabase/server";
import { StatsCards } from "./StatsCards";
import { RecentComments } from "./RecentComments";
import { PopularPosts } from "./PopularPosts";

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const [
    { count: postCount },
    { count: commentCount },
    { data: posts },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("view_count")
      .eq("status", "published"),
  ]);

  const totalViews = posts?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        대시보드
      </h1>

      <StatsCards
        postCount={postCount || 0}
        totalViews={totalViews}
        commentCount={commentCount || 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
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
