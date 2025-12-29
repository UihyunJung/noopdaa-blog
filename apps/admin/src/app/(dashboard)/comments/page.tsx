"use client";

import { useState, useEffect } from "react";
import { Button, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { Comment, Post } from "@/lib/types";

type CommentWithPost = Comment & { posts: Pick<Post, "title"> | null };

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentWithPost[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const supabase = createClient();

  useEffect(() => {
    loadComments();
  }, [filter]);

  const loadComments = async () => {
    let query = supabase
      .from("comments")
      .select("*, posts(title)")
      .order("created_at", { ascending: false });

    if (filter === "pending") {
      query = query.eq("is_approved", false);
    } else if (filter === "approved") {
      query = query.eq("is_approved", true);
    }

    const { data } = await query;
    setComments((data as CommentWithPost[]) || []);
  };

  const handleApprove = async (id: string) => {
    await supabase.from("comments").update({ is_approved: true }).eq("id", id);
    loadComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("comments").delete().eq("id", id);
    loadComments();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        댓글 관리
      </h1>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          전체
        </Button>
        <Button
          variant={filter === "pending" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          대기중
        </Button>
        <Button
          variant={filter === "approved" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("approved")}
        >
          승인됨
        </Button>
      </div>

      {comments.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">댓글이 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.author_name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {comment.author_email}
                    </span>
                    {!comment.is_approved && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        대기중
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      포스트: {comment.posts?.title || "삭제된 포스트"}
                    </span>
                    <span>
                      {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  {!comment.is_approved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(comment.id)}
                    >
                      승인
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
