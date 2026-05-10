"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, ConfirmModal } from "@noopdaa/ui";
import type { Comment, Post } from "@/lib/types";
import { approveComment, deleteComment } from "./actions";

export type CommentWithPost = Comment & { posts: Pick<Post, "title"> | null };
export type CommentsFilter = "all" | "pending" | "approved";

interface CommentsClientProps {
  initialComments: CommentWithPost[];
  filter: CommentsFilter;
}

export function CommentsClient({ initialComments, filter }: CommentsClientProps) {
  const router = useRouter();
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [isActionPending, startActionTransition] = useTransition();
  const [isFilterPending, startFilterTransition] = useTransition();

  const handleFilterChange = (next: CommentsFilter) => {
    startFilterTransition(() => {
      router.push(next === "all" ? "?" : `?filter=${next}`);
    });
  };

  const handleApprove = (id: string) => {
    setActionTarget(id);
    startActionTransition(async () => {
      const result = await approveComment(id);
      setActionTarget(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("댓글이 승인되었습니다.");
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    const id = confirmTarget;
    setActionTarget(id);
    startActionTransition(async () => {
      const result = await deleteComment(id);
      setActionTarget(null);
      setConfirmTarget(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("댓글이 삭제되었습니다.");
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        댓글 관리
      </h1>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("all")}
          disabled={isFilterPending}
        >
          전체
        </Button>
        <Button
          variant={filter === "pending" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("pending")}
          disabled={isFilterPending}
        >
          대기중
        </Button>
        <Button
          variant={filter === "approved" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("approved")}
          disabled={isFilterPending}
        >
          승인됨
        </Button>
      </div>

      {initialComments.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">댓글이 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {initialComments.map((comment) => (
            <Card key={comment.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
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
                  <p className="mb-2 break-words text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="truncate">
                      포스트: {comment.posts?.title || "삭제된 포스트"}
                    </span>
                    <span>
                      {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!comment.is_approved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(comment.id)}
                      isLoading={actionTarget === comment.id}
                      disabled={isActionPending}
                    >
                      승인
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmTarget(comment.id)}
                    isLoading={actionTarget === comment.id}
                    disabled={isActionPending}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
        title="댓글 삭제"
        description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={isActionPending}
      />
    </div>
  );
}
