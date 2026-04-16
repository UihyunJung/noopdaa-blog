"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Input } from "@noopdaa/ui";
import type { Comment } from "@/lib/types";
import { HiOutlineArrowUturnLeft, HiOutlinePlus, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

interface CommentsProps {
  postId: string;
  postTitle?: string;
}

type CommentWithAdmin = Comment & { is_admin?: boolean };

interface AdminProfile {
  username: string;
  email: string;
  avatar_url: string | null;
}

// CommentForm을 외부로 분리하여 리렌더링 시 unmount 방지
interface CommentFormProps {
  parentId?: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent, parentId: string | null) => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
  isAdmin: boolean;
  adminProfile: AdminProfile | null;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  isSubmitting: boolean;
}

function CommentForm({
  parentId = null,
  onCancel,
  onSubmit,
  formRef,
  isAdmin,
  adminProfile,
  name,
  setName,
  email,
  setEmail,
  content,
  setContent,
  isSubmitting,
}: CommentFormProps) {
  return (
    <form
      ref={formRef}
      onSubmit={(e) => onSubmit(e, parentId)}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-white">
          {parentId ? "답글 작성" : "댓글 작성"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          취소
        </button>
      </div>

      {isAdmin ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/20">
          {adminProfile?.avatar_url ? (
            <Image
              src={adminProfile.avatar_url}
              alt={adminProfile.username}
              width={32}
              height={32}
              className="rounded-full object-cover ring-2 ring-primary-500/20"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-medium text-white shadow-md shadow-primary-500/25">
              {adminProfile?.username?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-white">
              {adminProfile?.username}
            </span>
            <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
              관리자
            </span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            required
          />
          <Input
            type="email"
            label="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            required
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          내용
        </label>
        <textarea
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentId ? "답글을 작성하세요" : "댓글을 작성하세요"}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {parentId ? "답글 작성" : "댓글 작성"}
        </Button>
      </div>
    </form>
  );
}

export function Comments({ postId, postTitle }: CommentsProps) {
  const [comments, setComments] = useState<CommentWithAdmin[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [publicAdminProfile, setPublicAdminProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const commentFormRef = useRef<HTMLFormElement>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadComments();
    checkAdmin();
  }, [postId]);

  // 답글 폼이 열리면 스크롤
  useEffect(() => {
    if (replyTo && replyFormRef.current) {
      replyFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [replyTo]);

  // 서버 API로 관리자 체크 (Supabase SDK 미사용)
  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/auth/check");
      const data = await res.json();
      if (data.isAdmin && data.profile) {
        setIsAdmin(true);
        setAdminProfile(data.profile);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  // 서버 API로 댓글 조회 + 공개 관리자 프로필
  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments(data.comments || []);
      if (data.adminProfile) {
        setPublicAdminProfile(data.adminProfile);
      }
    } catch {
      setComments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();

    // 중복 클릭 방지
    if (isSubmitting) return;

    const authorName = isAdmin ? adminProfile?.username || "관리자" : name;
    const authorEmail = isAdmin ? adminProfile?.email || "" : email;

    if (!isAdmin && (!name.trim() || !email.trim())) return;
    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      // 서버 API로 댓글 작성
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId,
          authorName,
          authorEmail,
          content,
          isAdmin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "댓글 작성에 실패했습니다.");
        return;
      }

      // 관리자가 아닌 경우에만 이메일 알림 발송
      if (!isAdmin && postTitle) {
        try {
          await fetch("/api/comments/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postId,
              postTitle,
              authorName,
              content,
              isReply: !!parentId,
            }),
          });
        } catch (e) {
          console.error("Failed to send notification:", e);
        }
      }

      // 폼 초기화
      setContent("");
      setReplyTo(null);
      setShowCommentForm(false);

      if (!isAdmin) {
        setName("");
        setEmail("");
      }

      // 댓글 목록 새로고침 후 하이라이트
      await loadComments();

      const newComment = data.comment;
      if (newComment?.id) {
        setHighlightedCommentId(newComment.id);

        // 새 댓글로 스크롤
        setTimeout(() => {
          const commentElement = document.getElementById(`comment-${newComment.id}`);
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);

        // 2초 후 하이라이트 제거
        setTimeout(() => {
          setHighlightedCommentId(null);
        }, 2000);
      }
    } finally {
      // 모든 작업 완료 후 로딩 상태 해제
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyTo(commentId);
    setShowCommentForm(false);
    setContent("");
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setContent("");
  };

  const handleShowCommentForm = () => {
    setShowCommentForm(true);
    setReplyTo(null);
    setContent("");
  };

  const handleCancelComment = () => {
    setShowCommentForm(false);
    setContent("");
  };

  // 댓글을 트리 구조로 정리
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  // CommentForm에 전달할 공통 props
  const commentFormProps = {
    isAdmin,
    adminProfile,
    name,
    setName,
    email,
    setEmail,
    content,
    setContent,
    isSubmitting,
    onSubmit: handleSubmit,
  };

  const renderComment = (comment: CommentWithAdmin, depth = 0) => {
    const isHighlighted = highlightedCommentId === comment.id;
    const replies = getReplies(comment.id);

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={`${depth > 0 ? "ml-6 border-l-2 border-zinc-200 pl-6 dark:border-zinc-700 sm:ml-10" : ""}`}
      >
        <div
          className={`rounded-2xl p-5 transition-all duration-500 ${
            isHighlighted
              ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-zinc-900"
              : ""
          } ${
            comment.is_admin
              ? "border border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20"
              : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {comment.is_admin ? (
                publicAdminProfile?.avatar_url ? (
                  <Image
                    src={publicAdminProfile.avatar_url}
                    alt={comment.author_name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover ring-2 ring-primary-500/20"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-medium text-white shadow-md shadow-primary-500/25">
                    {comment.author_name.charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900 dark:text-white">
                  {comment.author_name}
                </span>
                {comment.is_admin && (
                  <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                    관리자
                  </span>
                )}
              </div>
            </div>
            <time className="text-sm text-zinc-500 dark:text-zinc-400">
              {new Date(comment.created_at).toLocaleDateString("ko-KR")}
            </time>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{comment.content}</p>
          <button
            onClick={() => handleReplyClick(comment.id)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <HiOutlineArrowUturnLeft className="h-4 w-4" />
            답글
          </button>
        </div>

        {/* 이 댓글에 대한 답글 폼 */}
        {replyTo === comment.id && (
          <div className="mt-4">
            <CommentForm
              {...commentFormProps}
              parentId={comment.id}
              onCancel={handleCancelReply}
              formRef={replyFormRef}
            />
          </div>
        )}

        {/* 답글 목록 */}
        {replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            댓글
          </h2>
          {comments.length > 0 && (
            <span className="rounded-full bg-primary-100 px-2.5 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {comments.length}
            </span>
          )}
        </div>
        {!showCommentForm && !replyTo && (
          <button
            onClick={handleShowCommentForm}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-500 hover:shadow-lg"
          >
            <HiOutlinePlus className="h-4 w-4" />
            댓글 쓰기
          </button>
        )}
      </div>

      {/* 댓글 작성 폼 (상단) */}
      {showCommentForm && (
        <div className="mt-6">
          <CommentForm
            {...commentFormProps}
            onCancel={handleCancelComment}
            formRef={commentFormRef}
          />
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className="mt-8 space-y-6">
          {rootComments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-800/30">
          <HiOutlineChatBubbleLeftRight className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
          </p>
        </div>
      )}
    </section>
  );
}
