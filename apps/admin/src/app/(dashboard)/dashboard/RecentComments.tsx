import { createServerClient } from "@/lib/supabase/server";

export async function RecentComments() {
  const supabase = await createServerClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("*, posts(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!comments || comments.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        아직 댓글이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.author_name}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                {comment.content}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(comment.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
            {!comment.is_approved && (
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                대기중
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
